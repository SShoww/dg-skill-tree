// scripts/get-pages-settings.cjs
const https = require('https');

const options = {
  hostname: 'api.github.com',
  path: '/repos/SShoww/dg-skill-tree/pages',
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      console.log('GitHub Pages Config:', JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log('Error parsing response:', e.message, '\nRaw data:', data);
    }
  });
}).on('error', (err) => {
  console.error('Request failed:', err.message);
});
