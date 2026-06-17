// scripts/probe-mis3.cjs
// Fixed probe: don't click tab first, directly search
const puppeteer = require('puppeteer');

async function probe() {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  console.log('=== Navigate to MIS ===');
  await page.goto('https://www.mis.cmu.ac.th/TQF/coursepublic.aspx', { waitUntil: 'networkidle2', timeout: 30000 });

  // Get current form state
  const yearVal = await page.evaluate(() => document.querySelector('#ddlAcademicYear')?.value);
  const termVal = await page.evaluate(() => document.querySelector('#ddlAcademicTerm')?.value);
  console.log('Default year:', yearVal, 'term:', termVal);

  // Now fill the course search directly (year/semester are already set to 2569/1)
  console.log('=== Fill course number ===');
  await page.focus('#txtCourseName');
  await page.keyboard.type('958102');

  console.log('=== Click Search ===');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
    page.click('#btnSearchCourse')
  ]);
  await new Promise(r => setTimeout(r, 3000));

  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 3000));
  console.log('Page after search:\n', bodyText);

  // Get all links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.innerText.trim().slice(0, 80),
      href: a.href
    })).filter(l => l.text.length > 0);
  });
  console.log('\nLinks on page:', JSON.stringify(links.slice(0, 20), null, 2));

  // Get result grid rows
  const gridRows = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('table tr')).slice(0, 20).map(tr => tr.innerText.trim().slice(0, 200));
  });
  console.log('\nGrid rows:', JSON.stringify(gridRows, null, 2));

  await new Promise(r => setTimeout(r, 5000)); // pause to see browser
  await browser.close();
}

probe().catch(console.error);
