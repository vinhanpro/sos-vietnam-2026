const https = require('https');
const fs = require('fs');

function fetchScript(url, path) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        fs.writeFileSync(path, data);
        console.log('Fetched', url, 'size:', data.length);
        resolve(data);
      });
    }).on('error', e => {
      console.log('Error fetching', url, e.message);
      resolve('');
    });
  });
}

async function run() {
  await fetchScript('https://cosodulieu.bando.com.vn/static/map/js/2_config.js', 'scripts/2_config.js');
  await fetchScript('https://cosodulieu.bando.com.vn/static/map/js/18_sapnhap_tree.js', 'scripts/18_sapnhap_tree.js');
  await fetchScript('https://cosodulieu.bando.com.vn/static/map/js/7_wms_info.js', 'scripts/7_wms_info.js');
  await fetchScript('https://sapnhap.bando.com.vn/res/js/stieuchuan1.4.js', 'scripts/stieuchuan.js');
}
run();
