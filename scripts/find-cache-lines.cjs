const fs = require('fs');
const s = fs.readFileSync('scripts/sapnhap.html', 'utf8');
const lines = s.split('\n');
lines.forEach((l, i) => {
  if (l.includes('cache.bando.com.vn') || l.includes('sapnhap') || l.includes('wfs') || l.includes('wms') || l.includes('service?')) {
    console.log(i + 1, l.trim());
  }
});
