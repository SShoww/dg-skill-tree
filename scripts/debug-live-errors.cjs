// scripts/debug-live-errors.cjs
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  console.log('Navigating...');
  await page.goto('https://sshoww.github.io/dg-skill-tree/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));

  console.log('Clicking info icon...');
  await page.evaluate(() => {
    const icons = Array.from(document.querySelectorAll('.info-icon'));
    if (icons.length > 0) icons[0].click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Find all elements containing text
  const domInfo = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    // Find elements with classes containing 'modal' or 'tabs'
    const modalEls = all.filter(el => {
      const cls = el.className;
      return typeof cls === 'string' && (cls.includes('modal') || cls.includes('tabs') || cls.includes('Tab'));
    }).map(el => ({ tag: el.tagName, class: el.className, text: el.innerText ? el.innerText.slice(0, 50) : '' }));

    // Find any element containing the text "Overview" or "Syllabus"
    const overviewEls = all.filter(el => el.innerText && (el.innerText.includes('Overview') || el.innerText.includes('Syllabus')) && el.children.length === 0)
      .map(el => ({ tag: el.tagName, class: el.className, text: el.innerText }));

    return {
      modalEls: modalEls.slice(0, 10),
      overviewEls: overviewEls.slice(0, 10)
    };
  });

  console.log('Modal elements:', domInfo.modalEls);
  console.log('Overview/Syllabus elements:', domInfo.overviewEls);

  await browser.close();
}

main().catch(console.error);
