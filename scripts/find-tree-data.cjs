const fs = require('fs');

function checkFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`=== ${file} ===`);
  const regex = /["']([^"']*(?:json|api|data|sapnhap|geoserver|wfs|cache)[^"']*)["']/gi;
  let match;
  const set = new Set();
  while ((match = regex.exec(content)) !== null) {
    set.add(match[1]);
  }
  console.log([...set].slice(0, 30));
}

checkFile('scripts/18_sapnhap_tree.js');
checkFile('scripts/stieuchuan.js');
checkFile('scripts/7_wms_info.js');
