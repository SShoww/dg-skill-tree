// scripts/probe-mis4.cjs
// Probe the course detail page after clicking the English/Thai link
const puppeteer = require('puppeteer');

async function probe() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  await page.goto('https://www.mis.cmu.ac.th/TQF/coursepublic.aspx', { waitUntil: 'networkidle2', timeout: 30000 });

  // Search for 958102
  await page.focus('#txtCourseName');
  await page.keyboard.type('958102');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
    page.click('#btnSearchCourse')
  ]);
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking English detail link...');
  // Click the English link
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const engLink = links.find(a => a.innerText.trim() === 'Introduction to Digital Games');
    if (engLink) engLink.click();
  });
  await new Promise(r => setTimeout(r, 4000));

  console.log('\n=== English Detail Page ===');
  const engText = await page.evaluate(() => document.body.innerText.slice(0, 6000));
  console.log(engText);

  // Get all labeled sections
  const sections = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,th,td[style*="bold"],td[class*="head"],td[class*="label"]'));
    return headers.map(h => ({ tag: h.tagName, text: h.innerText.trim().slice(0, 100) }));
  });
  console.log('\n=== Sections/Headers ===');
  console.log(JSON.stringify(sections.slice(0, 30), null, 2));

  // Find description, CLOs, assessment
  const tqfData = await page.evaluate(() => {
    // Find all table cells or divs with course data
    const allText = document.body.innerText;
    const result = {};
    
    // Look for specific patterns
    const descIdx = allText.indexOf('Course Description');
    if (descIdx !== -1) result.descStart = allText.slice(descIdx, descIdx + 500);
    
    const cloIdx = allText.indexOf('Course Learning Outcome') || allText.indexOf('CLO');
    if (cloIdx !== -1) result.cloStart = allText.slice(cloIdx, cloIdx + 500);
    
    return result;
  });
  console.log('\n=== TQF Data Found ===', JSON.stringify(tqfData, null, 2));

  await browser.close();
}

probe().catch(console.error);
