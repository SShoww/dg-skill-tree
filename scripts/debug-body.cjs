// scripts/debug-body.cjs
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs');

async function main() {
  console.log('Starting Vite preview...');
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', '9999', '--strictPort'], {
    cwd: 'd:\\DG Skill Tree',
    shell: true
  });

  await new Promise(r => setTimeout(r, 3000));

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  try {
    await page.goto('http://localhost:9999/dg-skill-tree/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));
    await page.waitForSelector('.ant-card', { timeout: 10000 });

    // Click the first info-icon
    await page.evaluate(() => {
      const icons = Array.from(document.querySelectorAll('.info-icon'));
      if (icons.length > 0) icons[0].click();
    });

    await new Promise(r => setTimeout(r, 3000));

    // Save HTML
    const html = await page.evaluate(() => document.body.innerHTML);
    fs.writeFileSync('d:\\DG Skill Tree\\body.html', html, 'utf8');
    console.log('Saved body.html');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
    previewProcess.kill();
  }
}

main().catch(console.error);
