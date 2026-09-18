const https = require('https');

function checkTile(z, x, y) {
  return new Promise(resolve => {
    const url = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/' + z + '/' + y + '/' + x;
    https.get(url, res => {
      let len = 0;
      res.on('data', c => len += c.length);
      res.on('end', () => {
        console.log(`Zoom ${z} (${x}, ${y}): Status ${res.statusCode}, size: ${len}`);
        resolve();
      });
    }).on('error', () => resolve());
  });
}

async function run() {
  // Hanoi: lat 21.0285, lng 105.8542
  for (let z = 12; z <= 19; z++) {
    const n = Math.pow(2, z);
    const x = Math.floor((105.8542 + 180) / 360 * n);
    const latRad = 21.0285 * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    await checkTile(z, x, y);
  }
}
run();
