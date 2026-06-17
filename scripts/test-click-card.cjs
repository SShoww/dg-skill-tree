// scripts/test-click-card.cjs
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  page.on('console', msg => {
    console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });

  console.log('Navigating to live site...');
  await page.goto('https://sshoww.github.io/dg-skill-tree/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Finding card for 958102...');
  const clicked = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.ant-card'));
    const target = cards.find(c => c.innerText && c.innerText.includes('958102'));
    if (target) {
      // Dispatch double click
      const event = new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      target.dispatchEvent(event);
      return 'dblclick-dispatched';
    }
    return 'card-not-found';
  });
  
  console.log('Action result:', clicked);
  await new Promise(r => setTimeout(r, 3000));
  
  const modalText = await page.evaluate(() => {
    const modal = document.querySelector('.ant-modal-content');
    return modal ? modal.innerText.slice(0, 300) : 'MODAL NOT FOUND';
  });
  console.log('Modal text:', modalText);
  
  await browser.close();
}

main().catch(console.error);
