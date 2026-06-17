// scripts/check-live-site.cjs
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  console.log('Navigating to live site...');
  await page.goto('https://sshoww.github.io/dg-skill-tree/', { waitUntil: 'networkidle2' });
  
  console.log('Title:', await page.title());
  
  // Dump some text of the page to check if it has the updated React bundle
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 1000));
  console.log('Body Text snippet:\n', bodyText);
  
  await browser.close();
}

main().catch(console.error);
