// scripts/test-modal-live.cjs
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  console.log('Navigating to live site...');
  await page.goto('https://sshoww.github.io/dg-skill-tree/', { waitUntil: 'networkidle2' });
  
  // Wait for the flowchart / cards to render
  console.log('Waiting for course cards...');
  await page.waitForSelector('.ant-card', { timeout: 10000 });
  
  // Find a card for 001101 and click the info icon or double click
  console.log('Triggering details for 001101...');
  const clicked = await page.evaluate(() => {
    // Look for all card wrappers
    const cards = Array.from(document.querySelectorAll('.ant-card'));
    const target = cards.find(el => el.innerText && el.innerText.includes('001101'));
    if (target) {
      // Try finding the info icon
      const infoIcon = target.querySelector('.info-icon') || target.querySelector('[class*="info-icon"]');
      if (infoIcon) {
        infoIcon.click();
        return 'info-icon-clicked';
      }
      
      // Try double click on the card
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
  
  console.log('Action taken:', clicked);
  
  if (clicked !== 'card-not-found') {
    // Wait for modal to appear
    console.log('Waiting for modal...');
    await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {
      console.log('Modal did not appear.');
    });
    
    // Check if the tabs exist inside the modal
    const modalText = await page.evaluate(() => {
      const modal = document.querySelector('.ant-modal-content');
      return modal ? modal.innerText.slice(0, 1000) : 'No modal content found!';
    });
    
    console.log('Modal Text snippet:\n', modalText);
    
    const tabs = await page.evaluate(() => {
      const tabElements = Array.from(document.querySelectorAll('.ant-tabs-tab'));
      return tabElements.map(el => el.innerText);
    });
    console.log('Tabs found in DOM:', tabs);
  }
  
  await browser.close();
}

main().catch(console.error);
