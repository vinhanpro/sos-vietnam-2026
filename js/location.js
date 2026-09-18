// Location and Geocoding Service for SOS Vietnam

export class LocationService {
  constructor() {
    this.currentCoords = { lat: 21.0285, lng: 105.8542 }; // Default Hanoi Center
    this.currentAddress = 'Đang lấy vị trí GPS...';
    this.accuracy = 10;
    this.listeners = [];
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
          console.log('📍 GPS acquired:', this.currentCoords, 'Accuracy:', this.accuracy, 'm');

          // Reverse geocode
          await this.reverseGeocode(this.currentCoords.lat, this.currentCoords.lng);
          this.emitUpdate();
          // Tinh chỉnh: bản định vị đầu tiên thường sai vài trăm mét (wifi/cell),
          // theo dõi thêm để lấy toạ độ chính xác hơn rồi cập nhật lại.
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
   * Theo dõi GPS thêm tối đa 20s để lấy bản định vị chính xác hơn.
   * Chỉ cập nhật khi sai số giảm đáng kể (>25m) hoặc lệch vị trí > 40m,
   * dừng ngay khi đạt sai số <= 30m để tiết kiệm pin.
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

    const distanceM = (a, b) => {
      const R = 6371000;
      const dLat = (b.lat - a.lat) * Math.PI / 180;
      const dLng = (b.lng - a.lng) * Math.PI / 180;
      const lat1 = a.lat * Math.PI / 180;
      const lat2 = b.lat * Math.PI / 180;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    };

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const acc = Math.round(position.coords.accuracy || 999);
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        const moved = distanceM(this.currentCoords, next);
        const better = acc + 25 < (this.accuracy || 999);
        if (better || moved > 40) {
          this.currentCoords = next;
          this.accuracy = acc;
          console.log('📍 GPS refined:', next, 'Accuracy:', acc, 'm');
          await this.reverseGeocode(next.lat, next.lng);
          this.emitUpdate();
        }
        if (acc <= 30) {
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
