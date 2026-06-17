// scripts/probe-001101.cjs
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  await page.goto('https://www.mis.cmu.ac.th/TQF/coursepublic.aspx', { waitUntil: 'networkidle2' });
  
  await page.focus('#txtCourseName');
  await page.keyboard.type('001101');
  
  await page.select('#ddlAcademicYear', '2569');
  await page.select('#ddlAcademicTerm', '1');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
    page.click('#btnSearchCourse')
  ]);
  await new Promise(r => setTimeout(r, 2000));
  
  const text = await page.evaluate(() => {
    const grid = document.querySelector('#gvCourseList');
    return grid ? grid.innerText : 'No #gvCourseList found! Full text:\n' + document.body.innerText.slice(0, 1500);
  });
  
  console.log('Results text for 001101 (2569/1):\n', text);
  await browser.close();
}

main().catch(console.error);
