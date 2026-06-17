// scripts/probe-mis.cjs
// Probe the CMU MIS site structure for a single course to understand HTML layout
const puppeteer = require('puppeteer');

async function probe() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log('Navigating to CMU MIS TQF...');
  await page.goto('https://www.mis.cmu.ac.th/TQF/coursepublic.aspx', { waitUntil: 'networkidle2', timeout: 30000 });
  
  console.log('Page loaded. Getting form elements...');
  const formEls = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select'));
    return inputs.map(el => ({ tag: el.tagName, id: el.id, name: el.name, type: el.type, value: (el.value || '').slice(0, 50) }));
  });
  console.log('Form elements:', JSON.stringify(formEls, null, 2));

  // Try year select
  const yearSel = await page.evaluate(() => {
    const sel = document.querySelector('select');
    return sel ? sel.id : null;
  });
  console.log('First select id:', yearSel);

  // Get all select ids
  const selectIds = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('select')).map(s => ({ id: s.id, options: Array.from(s.options).slice(0,5).map(o => o.value+':'+o.text) }));
  });
  console.log('All selects:', JSON.stringify(selectIds, null, 2));

  // Get button ids
  const btnIds = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input[type="submit"], button')).map(b => ({ id: b.id, value: b.value || b.innerText }));
  });
  console.log('Buttons:', JSON.stringify(btnIds));

  await browser.close();
}

probe().catch(console.error);
