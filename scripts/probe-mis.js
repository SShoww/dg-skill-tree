// scripts/probe-mis.js
// Probe the CMU MIS site structure for a single course to understand HTML layout
const puppeteer = require('puppeteer');

async function probe() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log('Navigating to CMU MIS TQF...');
  await page.goto('https://www.mis.cmu.ac.th/TQF/coursepublic.aspx', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Screenshot search form
  console.log('Page loaded. Getting form elements...');
  const formEls = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select'));
    return inputs.map(el => ({ tag: el.tagName, id: el.id, name: el.name, type: el.type, value: el.value.slice(0, 50) }));
  });
  console.log('Form elements:', JSON.stringify(formEls, null, 2));

  // Try to fill in the search form
  // Year field
  try {
    await page.select('select[id*="ddlYear"]', '2569');
    console.log('Selected year 2569');
  } catch(e) { console.log('No year select found:', e.message); }

  try {
    await page.select('select[id*="ddlSemester"]', '1');
    console.log('Selected semester 1');
  } catch(e) { console.log('No semester select found:', e.message); }

  // Fill course number
  const courseInputSel = 'input[id*="txtCourseNo"]';
  try {
    await page.type(courseInputSel, '958102');
    console.log('Typed course number 958102');
  } catch(e) { console.log('No course input found:', e.message); }

  // Click Search button
  try {
    await page.click('input[id*="btnSearch"]');
    console.log('Clicked search button');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
  } catch(e) { 
    console.log('Click/nav error:', e.message);
    // Try JS submit
    try {
      await page.evaluate(() => document.querySelector('input[type="submit"]').click());
      await new Promise(r => setTimeout(r, 3000));
    } catch(e2) { console.log('JS click error:', e2.message); }
  }

  console.log('\n--- Page after search ---');
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
  console.log(bodyText);

  // Check for result rows
  const rows = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('tr'));
    return trs.slice(0, 20).map(tr => tr.innerText.trim().slice(0, 100));
  });
  console.log('\nTable rows found:', rows);

  await browser.close();
}

probe().catch(console.error);
