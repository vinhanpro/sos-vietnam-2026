const fs = require('fs');

const sapnhap = fs.readFileSync('scripts/sapnhap.html', 'utf8');
const coso = fs.readFileSync('scripts/cosodulieu.html', 'utf8');

console.log('=== SAPNHAP SCRIPTS ===');
const sScripts = sapnhap.match(/<script[^>]*src=["']([^"']+)["']/gi) || [];
sScripts.forEach(s => console.log(s));

console.log('\n=== SAPNHAP POTENTIAL APIS & URLS ===');
const sUrls = sapnhap.match(/(https?:\/\/[a-zA-Z0-9_\-\.\:\/]+|\/[a-zA-Z0-9_\-\.\/]+)/g) || [];
const filteredS = [...new Set(sUrls)].filter(u => u.includes('api') || u.includes('geo') || u.includes('bando') || u.includes('json') || u.includes('wfs') || u.includes('wms') || u.includes('data'));
filteredS.slice(0, 30).forEach(u => console.log(u));

console.log('\n=== COSODULIEU SCRIPTS ===');
const cScripts = coso.match(/<script[^>]*src=["']([^"']+)["']/gi) || [];
cScripts.forEach(s => console.log(s));

console.log('\n=== COSODULIEU POTENTIAL APIS & URLS ===');
const cUrls = coso.match(/(https?:\/\/[a-zA-Z0-9_\-\.\:\/]+|\/[a-zA-Z0-9_\-\.\/]+)/g) || [];
const filteredC = [...new Set(cUrls)].filter(u => u.includes('api') || u.includes('geo') || u.includes('bando') || u.includes('json') || u.includes('wfs') || u.includes('wms') || u.includes('data'));
filteredC.slice(0, 30).forEach(u => console.log(u));
