// scripts/probe-results-table.cjs
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  await page.goto('https://www.mis.cmu.ac.th/TQF/coursepublic.aspx', { waitUntil: 'networkidle2' });
  
  await page.focus('#txtCourseName');
  await page.keyboard.type('958102');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
    page.click('#btnSearchCourse')
  ]);
  await new Promise(r => setTimeout(r, 2000));
  
  const resultsHTML = await page.evaluate(() => {
    const table = document.querySelector('#gvCoursePublic'); // The grid view is usually gvCoursePublic or similar
    if (table) return table.outerHTML;
    
    // Fallback: find any table on the page
    const tables = Array.from(document.querySelectorAll('table'));
    return tables.map((t, i) => `Table ${i}:\n${t.outerHTML}`).join('\n\n');
  });
  
  console.log('Results Table HTML:\n', resultsHTML);
  await browser.close();
}

main().catch(console.error);
