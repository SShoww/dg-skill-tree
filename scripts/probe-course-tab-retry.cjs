// scripts/probe-course-tab-retry.cjs
const puppeteer = require('puppeteer');

async function retryAction(fn, retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      console.log(`Action failed (attempt ${i + 1}/${retries}), retrying: ${e.message}`);
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  console.log('Navigating to CMU MIS...');
  await page.goto('https://www.mis.cmu.ac.th/TQF/coursepublic.aspx', { waitUntil: 'networkidle2' });
  
  console.log('Clicking Course (วิชา) tab...');
  await page.click('#btnCourse');
  await new Promise(r => setTimeout(r, 2000)); // wait for UpdatePanel
  
  console.log('Waiting for #ddlAcademicYear selector...');
  await page.waitForSelector('#ddlAcademicYear', { visible: true, timeout: 10000 });
  
  console.log('Filling form with retry...');
  await retryAction(async () => {
    await page.select('#ddlAcademicYear', '2569');
  });
  await retryAction(async () => {
    await page.select('#ddlAcademicTerm', '1');
  });
  await retryAction(async () => {
    await page.evaluate(() => { document.querySelector('#txtCourseName').value = ''; });
    await page.focus('#txtCourseName');
    await page.keyboard.type('001101');
  });
  
  console.log('Searching...');
  await page.click('#btnSearchCourse');
  await new Promise(r => setTimeout(r, 3000)); // wait for search results UpdatePanel
  
  const text = await page.evaluate(() => {
    const grid = document.querySelector('#gvCourseList');
    return grid ? grid.innerText : 'No #gvCourseList found! Full text:\n' + document.body.innerText.slice(0, 1500);
  });
  
  console.log('Results:\n', text);
  await browser.close();
}

main().catch(console.error);
