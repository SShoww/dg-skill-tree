// scripts/probe-buttons.cjs
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  await page.goto('https://www.mis.cmu.ac.th/TQF/coursepublic.aspx', { waitUntil: 'networkidle2' });
  
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input[type="submit"], input[type="button"], button, a.btn, .nav-tabs a, ul li a')).map(el => ({
      tag: el.tagName,
      id: el.id,
      text: el.innerText.trim(),
      value: el.value,
      className: el.className
    }));
  });
  
  console.log('Buttons/Tabs:', JSON.stringify(buttons, null, 2));
  await browser.close();
}

main().catch(console.error);
