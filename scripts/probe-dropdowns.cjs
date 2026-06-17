// scripts/probe-dropdowns.cjs
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  await page.goto('https://www.mis.cmu.ac.th/TQF/coursepublic.aspx', { waitUntil: 'networkidle2' });
  
  const options = await page.evaluate(() => {
    const years = Array.from(document.querySelectorAll('#ddlAcademicYear option')).map(opt => ({
      text: opt.innerText.trim(),
      value: opt.value
    }));
    const terms = Array.from(document.querySelectorAll('#ddlAcademicTerm option')).map(opt => ({
      text: opt.innerText.trim(),
      value: opt.value
    }));
    return { years, terms };
  });
  
  console.log('Years:', options.years);
  console.log('Terms:', options.terms);
  await browser.close();
}

main().catch(console.error);
