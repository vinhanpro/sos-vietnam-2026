const https = require('https');
const fs = require('fs');

function fetchText(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 10000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', e => {
      console.log('Fetch error:', e.message);
      resolve('');
    });
  });
}

async function main() {
  const html1 = await fetchText('https://sapnhap.bando.com.vn/');
  fs.writeFileSync('scripts/sapnhap.html', html1);
  console.log('Saved sapnhap.html, length:', html1.length);

  const html2 = await fetchText('https://cosodulieu.bando.com.vn/');
  fs.writeFileSync('scripts/cosodulieu.html', html2);
  console.log('Saved cosodulieu.html, length:', html2.length);
}
main();
