// Location and Geocoding Service for SOS Vietnam

/**
 * Linear 1D/2-axis Kalman Filter for GPS coordinate smoothing.
 * Fuses successive GPS readings with measurement noise derived from
 * position.coords.accuracy and an empirical process-noise model.
 */
export class GPSKalmanFilter {
  constructor(initialLat, initialLng, initialAccuracy = 30) {
    this.init(initialLat, initialLng, initialAccuracy);
  }

  init(lat, lng, accuracy = 30) {
    const latMetersPerDeg = 111320;
    const rad = lat * Math.PI / 180;
    const lngMetersPerDeg = 111320 * Math.max(Math.cos(rad), 0.1);
    const acc = Math.max(accuracy, 1);

    this.lat = lat;
    this.lng = lng;
    this.varianceLat = (acc / latMetersPerDeg) ** 2;
    this.varianceLng = (acc / lngMetersPerDeg) ** 2;
    this.lastTimestamp = Date.now();
  }

  update(fix) {
    const now = fix.timestamp || Date.now();
    const dt = Math.max((now - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = now;

    const latMetersPerDeg = 111320;
    const rad = fix.lat * Math.PI / 180;
    const lngMetersPerDeg = 111320 * Math.max(Math.cos(rad), 0.1);

    // Process noise Q (walking/motion uncertainty ~ 1.5 m/s)
    const speed = 1.5;
    const qMeters = (speed * dt) ** 2;
    const qLat = qMeters / (latMetersPerDeg ** 2);
    const qLng = qMeters / (lngMetersPerDeg ** 2);

    // Predict step: prior variance increases with process noise
    const predVarLat = this.varianceLat + qLat;
    const predVarLng = this.varianceLng + qLng;

    // Measurement noise R from GPS accuracy reading (1-sigma)
    const rAcc = Math.max(fix.accuracy || 20, 2);
    const rLat = (rAcc / latMetersPerDeg) ** 2;
    const rLng = (rAcc / lngMetersPerDeg) ** 2;

    // Kalman gain K = P_pred / (P_pred + R)
    const kLat = predVarLat / (predVarLat + rLat);
    const kLng = predVarLng / (predVarLng + rLng);

    // Update state estimate with new measurement
    this.lat = this.lat + kLat * (fix.lat - this.lat);
    this.lng = this.lng + kLng * (fix.lng - this.lng);

    // Update posterior error variance P = (1 - K) * P_pred
    this.varianceLat = (1 - kLat) * predVarLat;
    this.varianceLng = (1 - kLng) * predVarLng;

    const postAccMeters = Math.sqrt(this.varianceLat) * latMetersPerDeg;

    return {
      lat: Number(this.lat.toFixed(7)),
      lng: Number(this.lng.toFixed(7)),
      accuracy: Math.max(Math.round(postAccMeters), 3)
    };
  }
}

export class LocationService {
  constructor() {
    this.currentCoords = { lat: 21.0285, lng: 105.8542 }; // Default Hanoi Center
    this.currentAddress = 'Đang lấy vị trí GPS...';
    this.accuracy = 10;
    this.listeners = [];
    this.kalmanFilter = null;
  }

  onLocationUpdate(callback) {
    this.listeners.push(callback);
  }

  emitUpdate() {
    for (const cb of this.listeners) {
      cb({
        coords: this.currentCoords,
        address: this.currentAddress,
        accuracy: this.accuracy
      });
    }
  }

  async acquireLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported, using fallback.');
        this.currentAddress = 'Hà Nội, Việt Nam';
        this.emitUpdate();
        return resolve(this.currentCoords);
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          this.currentCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.accuracy = Math.round(position.coords.accuracy || 10);
          this.kalmanFilter = new GPSKalmanFilter(this.currentCoords.lat, this.currentCoords.lng, this.accuracy);
          console.log('📍 GPS acquired:', this.currentCoords, 'Accuracy:', this.accuracy, 'm');

          // Reverse geocode
          await this.reverseGeocode(this.currentCoords.lat, this.currentCoords.lng);
          this.emitUpdate();
          // Tinh chỉnh bằng Kalman Filter qua watchPosition
          this.refineLocation();
          resolve(this.currentCoords);
        },
        async (err) => {
          console.warn('GPS error or denied:', err.message);
          // Smart IP Geolocation Fallback
          try {
            const ipRes = await fetch('/api/geocode/ip');
            const ipData = await ipRes.json();
            if (ipData && ipData.ok) {
              this.currentCoords = { lat: ipData.lat, lng: ipData.lng };
              this.currentAddress = ipData.address || `${ipData.city}, Việt Nam`;
              this.accuracy = 500;
              this.emitUpdate();
              return resolve(this.currentCoords);
            }
          } catch (e) {}

          // Fallback to Can Tho / HCMC
          this.currentCoords = { lat: 10.0465, lng: 105.7865 };
          this.currentAddress = 'Quận Ninh Kiều, TP. Cần Thơ, Việt Nam';
          this.emitUpdate();
          resolve(this.currentCoords);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  /**
   * Theo dõi GPS và áp dụng 1D/2-axis Kalman Filter để lọc nhiễu,
   * tăng độ ổn định và giảm phương sai sai số của tọa độ theo thời gian.
   */
  refineLocation() {
    if (!navigator.geolocation || this._refining) return;
    this._refining = true;
    let watchId = null;
    const stop = () => {
      this._refining = false;
      if (watchId !== null) {
        try { navigator.geolocation.clearWatch(watchId); } catch (e) {}
        watchId = null;
      }
    };
    const timer = setTimeout(stop, 20000);

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const rawLat = position.coords.latitude;
        const rawLng = position.coords.longitude;
        const rawAcc = Math.round(position.coords.accuracy || 30);

        if (!this.kalmanFilter) {
          this.kalmanFilter = new GPSKalmanFilter(rawLat, rawLng, rawAcc);
        }

        const filtered = this.kalmanFilter.update({
          lat: rawLat,
          lng: rawLng,
          accuracy: rawAcc,
          timestamp: position.timestamp || Date.now()
        });

        this.currentCoords = { lat: filtered.lat, lng: filtered.lng };
        this.accuracy = filtered.accuracy;
        console.log('📍 GPS Kalman refined:', this.currentCoords, 'Accuracy:', this.accuracy, 'm');

        await this.reverseGeocode(this.currentCoords.lat, this.currentCoords.lng);
        this.emitUpdate();

        if (this.accuracy <= 15) {
          clearTimeout(timer);
          stop();
        }
      },
      () => { clearTimeout(timer); stop(); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  async reverseGeocode(lat, lng) {
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data && data.address) {
        this.currentAddress = data.address;
      } else {
        this.currentAddress = `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
    } catch (e) {
      this.currentAddress = `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    return this.currentAddress;
  }
}
