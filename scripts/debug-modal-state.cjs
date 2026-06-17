// scripts/debug-modal-state.cjs
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  page.on('console', msg => console.log(`[PAGE LOG]: ${msg.text()}`));
  page.on('pageerror', err => console.log(`[PAGE ERROR]: ${err.message}`));

  console.log('Navigating to live site...');
  await page.goto('https://sshoww.github.io/dg-skill-tree/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));

  // Get outerHTML of body before click
  const bodyBefore = await page.evaluate(() => document.body.innerHTML);
  console.log('Body length before click:', bodyBefore.length);

  console.log('Clicking first info-icon...');
  await page.evaluate(() => {
    const icons = Array.from(document.querySelectorAll('.info-icon'));
    if (icons.length > 0) {
      console.log('Clicking icon inside card:', icons[0].closest('.ant-card')?.innerText.replace(/\n/g, ' '));
      icons[0].click();
    } else {
      console.log('No info-icons found!');
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  // Get outerHTML of body after click
  const bodyAfter = await page.evaluate(() => document.body.innerHTML);
  console.log('Body length after click:', bodyAfter.length);

  // Check if body content changed significantly
  if (bodyAfter.length !== bodyBefore.length) {
    console.log('Body content changed!');
    // Find what new elements exist in bodyAfter that were not in bodyBefore
    // Ant Design Modal is usually rendered inside .ant-modal-root or at the end of the body
    const modalRootExists = await page.evaluate(() => {
      const root = document.querySelector('.ant-modal-root') || document.querySelector('.ant-modal-wrap') || document.querySelector('.ant-modal');
      return root ? { html: root.outerHTML.slice(0, 800), text: root.innerText } : null;
    });
    console.log('Modal Root:', modalRootExists);
  } else {
    console.log('Body content length is exactly the same!');
  }

  await browser.close();
}

main().catch(console.error);
