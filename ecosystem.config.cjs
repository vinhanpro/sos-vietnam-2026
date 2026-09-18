module.exports = {
  apps: [{
    name: 'sos-vietnam',
    script: 'server.js',
    cwd: __dirname,
    // 164MB GeoJSON (3.321 xã/phường) cần heap lớn khi JSON.parse
    node_args: '--max-old-space-size=3072',
    env: { NODE_ENV: 'production', PORT: 3000, SOS_WARD_BOUNDARIES_FILE: process.env.SOS_WARD_BOUNDARIES_FILE || 'vn-ward-boundaries.json' },
    watch: false, instances: 1, exec_mode: 'fork',
    max_memory_restart: '3500M'
  }]
}
