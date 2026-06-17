/**
 * Parses and transforms raw CMU MIS TQF course data combined with registry information
 * into the centralized course details schema.
 * 
 * @param {object} rawTqf - Raw scraped TQF data for a course
 * @param {object} registryCourse - Registry course object from courses.ts
 * @param {string} advisingTips - Advising tips / prep info from coursePrepData.js
 * @returns {object} Centralized course detail object
 */
export function parseTQFData(rawTqf = {}, registryCourse = {}, advisingTips = '') {
  // Parse description with fallbacks
  let descriptionTH = rawTqf.description_th || '';
  let descriptionEN = rawTqf.description_en || '';

  // Clean placeholder descriptions
  if (descriptionTH.includes('ไม่พบข้อมูล') || descriptionTH.includes('No syllabus data')) {
    descriptionTH = '';
  }
  if (descriptionEN.includes('No syllabus data')) {
    descriptionEN = '';
  }

  // Fallback to inline registry description if TQF is empty
  if (!descriptionTH && registryCourse.description) {
    descriptionTH = registryCourse.description;
  }
  if (!descriptionEN && registryCourse.description && !/[\u0e00-\u0e7f]/.test(registryCourse.description)) {
    descriptionEN = registryCourse.description;
  }

  // Parse credits (e.g. 3(1-4-4)) mathematically:
  // Total = First digit
  // Lecture = 1st digit inside parenthesis
  // Lab = 2nd digit inside parenthesis
  // Self Study = 3rd digit inside parenthesis
  let credits = {
    total: 3,
    lecture: 3,
    lab: 0,
    selfStudy: 6
  };

  const creditsStr = registryCourse.credits || rawTqf.credits_raw || '';
  const match = creditsStr.match(/(\d)\((\d)-(\d)-(\d)\)/);
  if (match) {
    credits = {
      total: parseInt(match[1], 10),
      lecture: parseInt(match[2], 10),
      lab: parseInt(match[3], 10),
      selfStudy: parseInt(match[4], 10)
    };
  } else if (registryCourse.credit_count) {
    credits.total = registryCourse.credit_count;
    // Estimate breakdown for general placeholders
    credits.lecture = registryCourse.credit_count;
    credits.lab = 0;
    credits.selfStudy = registryCourse.credit_count * 2;
  }

  return {
    courseCode: registryCourse.code || rawTqf.courseCode || '',
    deptCode: registryCourse.dept_code || rawTqf.dept_code || '',
    courseNameTH: registryCourse.title_th || rawTqf.courseNameTH || '',
    courseNameEN: registryCourse.title_en || rawTqf.courseNameEN || '',
    categoryTag: registryCourse.category || '',
    descriptionTH: descriptionTH || 'ไม่มีข้อมูลคำอธิบายรายวิชาในขณะนี้',
    descriptionEN: descriptionEN || 'No description available at the moment.',
    credits,
    advisingTips: advisingTips || 'Review core syllabus topics and prepare key tools based on your track specializations.'
  };
}
