const fs = require('fs');

const s = fs.readFileSync('scripts/sapnhap.html', 'utf8');

const matches = s.match(/(https?:\/\/[^\s"'<>]+|\/[a-zA-Z0-9_\-\.\/]+\.(?:json|geojson|php|ashx|aspx|js))/gi) || [];
console.log('sapnhap.html matches:');
[...new Set(matches)].forEach(m => console.log(m));
