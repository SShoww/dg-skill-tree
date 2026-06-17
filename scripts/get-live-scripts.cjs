// scripts/get-live-scripts.cjs
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  console.log('Navigating to live site...');
  await page.goto('https://sshoww.github.io/dg-skill-tree/', { waitUntil: 'networkidle2' });
  
  const scriptSrcs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script')).map(s => s.getAttribute('src') || s.innerText.slice(0, 100));
  });
  
  console.log('Scripts loaded by live site:', scriptSrcs);
  await browser.close();
}

main().catch(console.error);
