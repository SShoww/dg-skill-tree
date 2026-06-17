// scripts/scrape-syllabus.cjs
// Scrapes course description (TH + EN) from CMU MIS for all courses in coursesData
// Saves output to src/data/syllabusData.json with concurrency and progress saving
// Run with: node scripts/scrape-syllabus.cjs

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SYLLABUS_JSON_PATH = path.join(__dirname, '../src/data/syllabusData.json');

// ── Extract all real course codes from courses.ts (skip virtual slots) ──────
function extractCourseCodes() {
  const coursesTs = fs.readFileSync(path.join(__dirname, '../src/data/courses.ts'), 'utf8');
  const codeRe = /"code":\s*"([^"]+)"/g;
  const codes = new Set();
  let m;
  while ((m = codeRe.exec(coursesTs)) !== null) {
    const code = m[1];
    // Skip virtual elective slot IDs like GE-EL-01, MJ-EL-01, FE-EL-01
    if (!code.includes('-EL-') && code.length >= 6 && /^\d/.test(code)) {
      codes.add(code);
    }
  }
  return Array.from(codes);
}

// ── Parse the detail panel text into structured fields ────────────────────────
function parseDetailText(text) {
  let description_en = '';
  let description_th = '';

  // The detail panel has a row like:
  // "คำอธิบายลักษณะกระบวนวิชา :  ENG: ... THA: ..."
  const descBlock = text.match(/คำอธิบายลักษณะกระบวนวิชา\s*:\s*([\s\S]+?)(?:หน่วยกิต|เงื่อนไข|Formerly|$)/);
  if (descBlock) {
    const block = descBlock[1];
    const engMatch = block.match(/ENG:\s*([\s\S]+?)(?:THA:|$)/);
    const thaMatch = block.match(/THA:\s*([\s\S]+?)$/);
    if (engMatch) description_en = engMatch[1].trim().replace(/\s+/g, ' ');
    if (thaMatch) description_th = thaMatch[1].trim().replace(/\s+/g, ' ');
  }

  return { description_en, description_th };
}

// Helper to retry flaky Puppeteer actions when ASP.NET UpdatePanel is refreshing
async function retryAction(fn, retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ── Search + extract for one course code on a fresh page ─────────────────────
async function scrapeCourse(browser, code, yearTerms) {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  // Set reasonable timeout
  page.setDefaultTimeout(15000);

  try {
    // Initial page load
    await page.goto('https://www.mis.cmu.ac.th/TQF/coursepublic.aspx', {
      waitUntil: 'networkidle2',
      timeout: 20000
    });

    // Click Course (วิชา) tab
    await page.click('#btnCourse');
    await new Promise(r => setTimeout(r, 2000)); // wait for UpdatePanel

    // Wait for the dropdown to be visible
    await page.waitForSelector('#ddlAcademicYear', { visible: true, timeout: 10000 });

    for (const [year, term] of yearTerms) {
      try {
        // Select year and term with retry
        await retryAction(async () => {
          await page.select('#ddlAcademicYear', String(year));
        });
        await retryAction(async () => {
          await page.select('#ddlAcademicTerm', String(term));
        });

        // Clear and fill the search input with retry
        await retryAction(async () => {
          await page.evaluate(() => {
            const input = document.querySelector('#txtCourseName');
            if (input) input.value = '';
          });
          await page.focus('#txtCourseName');
          await page.keyboard.type(code);
        });

        // Click search and wait for UpdatePanel
        await page.click('#btnSearchCourse');
        await new Promise(r => setTimeout(r, 2500));

        // Check if there's a result row in gvCourseList
        const resultExists = await page.evaluate(() => {
          const grid = document.querySelector('#gvCourseList');
          return grid && grid.innerText.includes('Update:');
        });

        if (!resultExists) {
          continue; // try next year/term
        }

        // Click the English detail link with retry
        const engClicked = await retryAction(async () => {
          return await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            const l = links.find(a => a.id && a.id.includes('lbnDetailEng'));
            if (l) { l.click(); return true; }
            return false;
          });
        });

        if (!engClicked) continue;
        
        // Wait for #pnlDetail to load
        await page.waitForSelector('#pnlDetail', { timeout: 5000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 1500));

        // Extract detail panel text
        const detailText = await page.evaluate(() => {
          const detail = document.querySelector('#pnlDetail');
          return detail ? detail.innerText : '';
        });

        if (!detailText) continue;

        const { description_en, description_th } = parseDetailText(detailText);

        if (description_en || description_th) {
          return {
            year,
            semester: term,
            description_en,
            description_th,
            clos: [],
            assessment: [],
            mis_url: `https://www.mis.cmu.ac.th/TQF/coursepublic.aspx`
          };
        }
      } catch (err) {
        // Try next year/term
      }
    }
  } catch (e) {
    // Skip if page load / tab selection completely fails
  } finally {
    await page.close();
  }
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const codes = extractCourseCodes();
  console.log(`Total course codes in system: ${codes.length}`);

  // Load existing results to resume if possible
  let results = {};
  if (fs.existsSync(SYLLABUS_JSON_PATH)) {
    try {
      results = JSON.parse(fs.readFileSync(SYLLABUS_JSON_PATH, 'utf8'));
      console.log(`Loaded ${Object.keys(results).length} existing records from ${SYLLABUS_JSON_PATH}`);
    } catch (e) {
      console.warn('Could not parse existing syllabusData.json, starting fresh.');
    }
  }

  // Filter codes that are not scraped yet
  const pendingCodes = codes.filter(c => !results[c] || !results[c].description_en);
  console.log(`Pending course codes to scrape: ${pendingCodes.length}`);

  if (pendingCodes.length === 0) {
    console.log('All course codes already scraped!');
    return;
  }

  const yearTerms = [
    [2569, 1], [2569, 2], [2568, 1], [2568, 2], [2567, 1], [2567, 2]
  ];

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const concurrency = 3; // Use concurrency 3 to keep server happy and avoid timeout
  const queue = [...pendingCodes];
  let completed = 0;
  let foundCount = 0;
  let notFoundCount = 0;

  console.log(`Starting scraper with concurrency = ${concurrency}...\n`);

  async function worker() {
    while (queue.length > 0) {
      const code = queue.shift();
      if (!code) break;
      
      const currentIdx = ++completed;
      
      const data = await scrapeCourse(browser, code, yearTerms);
      if (data) {
        results[code] = data;
        foundCount++;
        console.log(`[${currentIdx}/${pendingCodes.length}] ✓ ${code}: (${data.year}/S${data.semester}) "${data.description_en.slice(0, 50)}..."`);
      } else {
        // Save placeholder null to avoid scraping it again this session
        results[code] = {
          year: 2569,
          semester: 1,
          description_en: "No syllabus data found on CMU MIS.",
          description_th: "ไม่พบข้อมูลประมวลรายวิชาในระบบ CMU MIS",
          clos: [],
          assessment: [],
          mis_url: "https://www.mis.cmu.ac.th/TQF/coursepublic.aspx"
        };
        notFoundCount++;
        console.log(`[${currentIdx}/${pendingCodes.length}] ✗ ${code}: Not found`);
      }

      // Save output periodically (every 5 courses) to avoid data loss
      if (currentIdx % 5 === 0) {
        fs.writeFileSync(SYLLABUS_JSON_PATH, JSON.stringify(results, null, 2), 'utf8');
      }
    }
  }

  // Launch workers
  const workers = Array.from({ length: concurrency }, worker);
  await Promise.all(workers);

  await browser.close();

  // Final save
  fs.writeFileSync(SYLLABUS_JSON_PATH, JSON.stringify(results, null, 2), 'utf8');

  console.log(`\n✅ Scraping session complete!`);
  console.log(`Successfully found: ${foundCount}`);
  console.log(`Not found: ${notFoundCount}`);
  console.log(`Total stored in syllabusData.json: ${Object.keys(results).length}`);
}

main().catch(err => {
  console.error('Fatal error in main:', err);
  process.exit(1);
});
