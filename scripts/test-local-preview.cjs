// scripts/test-local-preview.cjs
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

async function main() {
  console.log('Starting Vite preview on port 9999...');
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', '9999', '--strictPort'], {
    cwd: 'd:\\DG Skill Tree',
    shell: true
  });

  previewProcess.stdout.on('data', (data) => {
    console.log(`[Preview Server]: ${data}`);
  });

  previewProcess.stderr.on('data', (data) => {
    console.error(`[Preview Error]: ${data}`);
  });

  // Wait 3 seconds for server to start
  await new Promise(r => setTimeout(r, 3000));

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  page.on('console', msg => {
    console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });

  try {
    console.log('Navigating to local preview...');
    await page.goto('http://localhost:9999/dg-skill-tree/', { waitUntil: 'networkidle2' });

    console.log('Waiting 3s for settlement...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('Waiting for cards...');
    await page.waitForSelector('.ant-card', { timeout: 10000 });

    console.log('Clicking the info icon on the first course card...');
    const clicked = await page.evaluate(() => {
      const icons = Array.from(document.querySelectorAll('.info-icon'));
      if (icons.length > 0) {
        const cardText = icons[0].closest('.ant-card')?.innerText || '';
        console.log('Found info-icon inside card:', cardText.replace(/\n/g, ' '));
        icons[0].click();
        return true;
      }
      return false;
    });

    console.log('Clicked:', clicked);
    await new Promise(r => setTimeout(r, 3000));

    const modalContent = await page.evaluate(() => {
      const modal = document.querySelector('.ant-modal-container') || document.querySelector('.ant-modal');
      return modal ? modal.innerText : 'MODAL NOT FOUND';
    });

    console.log('\n--- Modal Content ---');
    console.log(modalContent);
    console.log('---------------------\n');

  } catch (err) {
    console.error('Error in Puppeteer script:', err.message);
  } finally {
    await browser.close();
    previewProcess.kill();
    console.log('Preview process killed.');
  }
}

main().catch(console.error);
