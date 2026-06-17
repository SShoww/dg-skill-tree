// scripts/probe-course-tab.cjs
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  console.log('Navigating to CMU MIS...');
  await page.goto('https://www.mis.cmu.ac.th/TQF/coursepublic.aspx', { waitUntil: 'networkidle2' });
  
  console.log('Clicking Course (วิชา) tab...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
    page.click('#btnCourse')
  ]);
  
  console.log('Waiting for #ddlAcademicYear selector...');
  await page.waitForSelector('#ddlAcademicYear', { visible: true, timeout: 10000 });
  
  console.log('Filling form...');
  await page.select('#ddlAcademicYear', '2569');
  await page.select('#ddlAcademicTerm', '1');
  
  await page.focus('#txtCourseName');
  await page.keyboard.type('001101');
  
  console.log('Searching...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
    page.click('#btnSearchCourse')
  ]);
  await new Promise(r => setTimeout(r, 2000));
  
  const text = await page.evaluate(() => {
    const grid = document.querySelector('#gvCourseList');
    return grid ? grid.innerText : 'No #gvCourseList found!';
  });
  
  console.log('Results:\n', text);
  await browser.close();
}

main().catch(console.error);
