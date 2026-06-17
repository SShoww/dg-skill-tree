// scripts/take-screenshot.cjs
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

async function main() {
  console.log('Starting Vite preview...');
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', '8888', '--strictPort'], {
    cwd: 'd:\\DG Skill Tree',
    shell: true
  });

  // Wait 3 seconds for server
  await new Promise(r => setTimeout(r, 3000));

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  try {
    console.log('Navigating to local preview...');
    await page.goto('http://localhost:8888/dg-skill-tree/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Clicking the first info-icon...');
    await page.evaluate(() => {
      const icons = Array.from(document.querySelectorAll('.info-icon'));
      if (icons.length > 0) {
        icons[0].click();
      }
    });

    console.log('Waiting for modal animation...');
    await new Promise(r => setTimeout(r, 2000));

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'd:\\DG Skill Tree\\screenshot.png' });
    console.log('Screenshot saved to screenshot.png');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
    previewProcess.kill();
    console.log('Preview server killed.');
  }
}

main().catch(console.error);
