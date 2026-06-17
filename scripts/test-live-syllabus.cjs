// scripts/test-live-syllabus.cjs
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  console.log('Navigating to live site...');
  await page.goto('https://sshoww.github.io/dg-skill-tree/', { waitUntil: 'networkidle2' });
  
  // Wait 4 seconds for everything to settle
  console.log('Waiting 4s for settlement...');
  await new Promise(r => setTimeout(r, 4000));
  
  console.log('Clicking the first info-icon in the DOM...');
  const clicked = await page.evaluate(() => {
    // Let's find all elements with class info-icon
    const icons = Array.from(document.querySelectorAll('.info-icon'));
    if (icons.length > 0) {
      // Print parent card text for debugging
      const cardText = icons[0].closest('.ant-card')?.innerText || 'No card parent';
      console.log('Found info-icon inside card:', cardText);
      icons[0].click();
      return { clicked: true, cardText };
    }
    return { clicked: false, cardText: '' };
  });
  
  console.log('Click result:', clicked);
  
  if (clicked.clicked) {
    console.log('Waiting for modal to open...');
    await new Promise(r => setTimeout(r, 3000));
    
    const modalContent = await page.evaluate(() => {
      const modal = document.querySelector('.ant-modal-content');
      return modal ? modal.innerText : 'MODAL NOT FOUND';
    });
    
    console.log('\n--- Modal Content ---');
    console.log(modalContent);
    console.log('---------------------\n');
  } else {
    // If info-icon not found, let's print all card classes or texts
    const cardsText = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.ant-card')).map(c => c.innerText.slice(0, 100));
    });
    console.log('All card snippets in DOM:', cardsText.slice(0, 5));
  }
  
  await browser.close();
}

main().catch(console.error);
