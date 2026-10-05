// Statistical proof for P7-A: GPS Kalman Filter noise reduction verification
// Simulates 100 GPS fixes with realistic synthetic measurement noise around a ground truth location.

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Box-Muller transform for standard Gaussian random values
function randomGaussian(mean = 0, stdev = 1) {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

async function run() {
  const { GPSKalmanFilter } = await import('../js/location.js');

  const trueLat = 10.0452;
  const trueLng = 105.7469;
  const numSamples = 100;
  const noiseStdevMeters = 25; // standard GPS noise ~25m standard deviation
  const latMetersPerDeg = 111320;
  const lngMetersPerDeg = 111320 * Math.cos(trueLat * Math.PI / 180);

  console.log(`[P7-A GPS Kalman Filter Verification]`);
  console.log(`Ground Truth: lat=${trueLat}, lng=${trueLng}`);
  console.log(`Simulating ${numSamples} GPS fixes with measurement noise stdev = ${noiseStdevMeters}m...`);

  const rawFixes = [];
  let t = Date.now();

  for (let i = 0; i < numSamples; i++) {
    t += 1000; // 1 fix per second
    const noiseXMeters = randomGaussian(0, noiseStdevMeters);
    const noiseYMeters = randomGaussian(0, noiseStdevMeters);
    const rawLat = trueLat + (noiseYMeters / latMetersPerDeg);
    const rawLng = trueLng + (noiseXMeters / lngMetersPerDeg);
    const accuracy = Math.round(Math.abs(randomGaussian(25, 5)));

    rawFixes.push({
      lat: rawLat,
      lng: rawLng,
      accuracy,
      timestamp: t
    });
  }

  // Initialize Kalman Filter with initial reading
  const kf = new GPSKalmanFilter(rawFixes[0].lat, rawFixes[0].lng, rawFixes[0].accuracy);
  const filteredFixes = [];

  for (const fix of rawFixes) {
    const est = kf.update(fix);
    filteredFixes.push(est);
  }

  // Calculate Mean Squared Error (MSE) from Ground Truth for both
  let sumSqErrRaw = 0;
  let sumSqErrFiltered = 0;
  let sumErrRaw = 0;
  let sumErrFiltered = 0;

  for (let i = 0; i < numSamples; i++) {
    const dRaw = distanceMeters(rawFixes[i].lat, rawFixes[i].lng, trueLat, trueLng);
    const dFilt = distanceMeters(filteredFixes[i].lat, filteredFixes[i].lng, trueLat, trueLng);

    sumErrRaw += dRaw;
    sumErrFiltered += dFilt;
    sumSqErrRaw += dRaw * dRaw;
    sumSqErrFiltered += dFilt * dFilt;
  }

  const meanErrRaw = sumErrRaw / numSamples;
  const meanErrFiltered = sumErrFiltered / numSamples;
  const mseRaw = sumSqErrRaw / numSamples;
  const mseFiltered = sumSqErrFiltered / numSamples;
  const varianceReductionPct = ((mseRaw - mseFiltered) / mseRaw) * 100;

  console.log('\n--- Results ---');
  console.log(`Raw GPS Fixes:       Mean Error = ${meanErrRaw.toFixed(2)}m | MSE (Variance) = ${mseRaw.toFixed(2)} m²`);
  console.log(`Kalman Filtered Fix: Mean Error = ${meanErrFiltered.toFixed(2)}m | MSE (Variance) = ${mseFiltered.toFixed(2)} m²`);
  console.log(`Variance Reduction:  ${varianceReductionPct.toFixed(2)}%`);
  console.log(`Final Filtered Estimate: lat=${filteredFixes[numSamples - 1].lat}, lng=${filteredFixes[numSamples - 1].lng}, estimated accuracy=±${filteredFixes[numSamples - 1].accuracy}m`);

  if (mseFiltered < mseRaw && varianceReductionPct > 40) {
    console.log('\nPASS: 1D/2-axis Kalman Filter significantly reduced GPS measurement variance!');
    process.exit(0);
  } else {
    console.error('\nFAIL: Kalman Filter did not achieve required variance reduction.');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
