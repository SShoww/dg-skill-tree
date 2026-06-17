// scripts/test-mis-dom.cjs
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  console.log('Navigating...');
  await page.goto('https://www.mis.cmu.ac.th/TQF/coursepublic.aspx', { waitUntil: 'networkidle2' });
  
  await page.focus('#txtCourseName');
  await page.keyboard.type('958102');
  
  console.log('Searching...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
    page.click('#btnSearchCourse')
  ]);
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking detail...');
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const engLink = links.find(a => a.innerText.trim() === 'Introduction to Digital Games');
    if (engLink) engLink.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Dumping all HTML elements inside #pnlDetail or the page...');
  const data = await page.evaluate(() => {
    const detail = document.querySelector('#pnlDetail');
    if (!detail) return 'No #pnlDetail found!';
    
    // Find all links in #pnlDetail
    const links = Array.from(detail.querySelectorAll('a')).map(a => ({
      text: a.innerText.trim(),
      href: a.href,
      id: a.id,
      onclick: a.getAttribute('onclick')
    }));
    
    // Find all tables in #pnlDetail
    const tables = Array.from(detail.querySelectorAll('table')).map((t, idx) => ({
      index: idx,
      text: t.innerText.slice(0, 300)
    }));
    
    return {
      text: detail.innerText,
      links,
      tables
    };
  });
  
  console.log('Detail Text:\n', data.text);
  console.log('\nLinks inside detail:\n', JSON.stringify(data.links, null, 2));
  console.log('\nTables inside detail:\n', JSON.stringify(data.tables, null, 2));
  
  await browser.close();
}

main().catch(console.error);
