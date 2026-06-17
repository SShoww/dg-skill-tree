// scripts/probe-mis2.cjs
// Probe the search results and course detail page for 958102
const puppeteer = require('puppeteer');

async function probe() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  console.log('=== Step 1: Navigate to MIS ===');
  await page.goto('https://www.mis.cmu.ac.th/TQF/coursepublic.aspx', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Click "วิชา" tab to get to course search
  console.log('=== Step 2: Click Course tab ===');
  await page.click('#btnCourse');
  await new Promise(r => setTimeout(r, 1000));

  console.log('=== Step 3: Fill search form ===');
  await page.select('#ddlAcademicYear', '2569');
  await page.select('#ddlAcademicTerm', '1');
  await page.type('#txtCourseName', '958102');
  
  console.log('=== Step 4: Click Search ===');
  await page.click('#btnSearchCourse');
  await new Promise(r => setTimeout(r, 3000));

  console.log('=== Step 5: Check results ===');
  const resultsText = await page.evaluate(() => document.body.innerText.slice(0, 3000));
  console.log('Results text:', resultsText);

  // Try to get result table
  const resultLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    return links.filter(a => a.href.includes('coursepublic') || a.innerText.includes('958')).map(a => ({
      text: a.innerText.trim().slice(0, 100),
      href: a.href
    }));
  });
  console.log('\nResult links:', JSON.stringify(resultLinks, null, 2));

  // Get grid/table data
  const tableData = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('table'));
    return tables.slice(0,3).map(t => t.innerText.trim().slice(0, 500));
  });
  console.log('\nTable data:', JSON.stringify(tableData, null, 2));

  await browser.close();
}

probe().catch(console.error);
