// Map Controller with CartoDB Dark, Esri Satellite, Google Maps & 34 Provinces System

export class MapController {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.markers = new Map();
    this.routeSourceId = 'rescue-route';
    this.vehicleMarker = null;
    this.stationMarkers = [];
    this.activeWardStationMarker = null;
    this.currentStyleMode = 'dark'; // 'dark' | 'satellite' | 'streets'
    // Restore ward visibility from localStorage
    this.allWardsVisible = localStorage.getItem('allWardsVisible') === 'true';
  }

  init(center = [105.8542, 21.0285], zoom = 14) {
    if (!window.maplibregl) {
      console.error('MapLibre GL not loaded');
      return;
    }

    const defaultStyle = {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        'vn-narenca': {
          type: 'raster',
          tiles: [
            'https://mt0.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
            'https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
            'https://mt2.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
            'https://mt3.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}'
          ],
          tileSize: 256,
          attribution: '&copy; Bản Đồ Nền Quốc Gia 2026'
        },
        'esri-sat': {
          type: 'raster',
          tiles: [
            'https://mt0.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}',
            'https://mt1.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}',
            'https://mt2.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}',
            'https://mt3.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}'
          ],
          tileSize: 256,
          attribution: '&copy; Ảnh Vệ Tinh Độ Nét Cao'
        },
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://mt0.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
            'https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
            'https://mt2.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
            'https://mt3.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}'
          ],
          tileSize: 256,
          maxzoom: 21,
          attribution: '&copy; Bản Đồ Tác Chiến Chỉ Huy Quân Sự'
        },
        vnprov: {
          type: 'geojson',
          data: '/assets/vn-provinces.geojson'
        },
        vnlbl: {
          type: 'geojson',
          data: '/assets/vn-province-labels.geojson'
        },
        'vn-all-wards': {
          type: 'geojson',
          data: '/assets/vn-wards-simplified.geojson'
        }
      },
      layers: [
        {
          id: 'base-tiles',
          type: 'raster',
          source: 'vn-narenca',
          minzoom: 0,
          maxzoom: 20
        },
        {
          id: 'vn-provinces-shadow',
          type: 'line',
          source: 'vnprov',
          paint: {
            'line-color': 'rgba(0,0,0,0.7)',
            'line-width': ['interpolate', ['linear'], ['zoom'], 4, 3, 10, 6],
            'line-blur': 2
          }
        },
        {
          id: 'vn-provinces-boundary',
          type: 'line',
          source: 'vnprov',
          paint: {
            'line-color': '#00d2ff',
            'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.2, 10, 2.5],
            'line-opacity': 0.75
          }
        },
        {
          id: 'vn-province-labels',
          type: 'symbol',
          source: 'vnlbl',
          minzoom: 4,
          maxzoom: 11,
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Semibold'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 8, 14],
            'text-transform': 'uppercase'
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(0,0,0,0.85)',
            'text-halo-width': 2
          }
        },
        {
          id: 'vn-all-wards-fill',
          type: 'fill',
          source: 'vn-all-wards',
          layout: {
            visibility: 'none'
          },
          paint: {
            'fill-color': '#fde047',
            'fill-opacity': 0.04
          }
        },
        {
          id: 'vn-all-wards-line',
          type: 'line',
          source: 'vn-all-wards',
          layout: {
            visibility: 'none'
          },
          paint: {
            'line-color': '#facc15',
            'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.45, 8, 0.9, 12, 1.6],
            'line-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.4, 8, 0.7, 12, 0.9]
          }
        }
      ]
    };

    this.map = new window.maplibregl.Map({
      container: this.containerId,
      style: defaultStyle,
      center: center,
      zoom: zoom,
      pitch: 25,
      attributionControl: false
    });

    // Bảo vệ: bỏ qua yêu cầu thêm lớp đã tồn tại (tránh lỗi "Layer ... already exists")
    const mapRef = this.map;
    const originalAddLayer = mapRef.addLayer.bind(mapRef);
    mapRef.addLayer = (layer, before) => {
      try {
        if (layer && layer.id && mapRef.getLayer(layer.id)) return mapRef;
        return originalAddLayer(layer, before);
      } catch (err) {
        console.warn('[map] Không thêm được lớp:', layer && layer.id, err && err.message);
        return mapRef;
      }
    };
    const originalAddSource = mapRef.addSource.bind(mapRef);
    mapRef.addSource = (id, source) => {
      try {
        if (id && mapRef.getSource(id)) return mapRef;
        return originalAddSource(id, source);
      } catch (err) {
        console.warn('[map] Không thêm được nguồn:', id, err && err.message);
        return mapRef;
      }
    };

    if (!this.options.disableStations) {
      this.loadAllStationsMarkers();
    }
    return this.map;
  }

  switchTileLayer(sourceId) {
    if (!this.map) return;

    const sourceDefs = {
      'vn-narenca': {
        type: 'raster',
        tiles: [
          'https://mt0.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
          'https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
          'https://mt2.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
          'https://mt3.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}'
        ],
        tileSize: 256
      },
      'esri-sat': {
        type: 'raster',
        tiles: [
          'https://mt0.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}',
          'https://mt1.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}',
          'https://mt2.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}',
          'https://mt3.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}'
        ],
        tileSize: 256
      },
      'carto-dark': {
        type: 'raster',
        tiles: [
          'https://mt0.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
          'https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
          'https://mt2.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
          'https://mt3.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}'
        ],
        tileSize: 256,
        maxzoom: 21
      }
    };

    let actualSource = sourceId;
    if (sourceId === 'carto-dark' || sourceId === 'tactical-dark') {
      actualSource = 'carto-dark';
    }

    // Ensure source exists in map
    if (!this.map.getSource(actualSource) && sourceDefs[actualSource]) {
      this.map.addSource(actualSource, sourceDefs[actualSource]);
    }

    if (this.map.getLayer('base-tiles')) {
      this.map.removeLayer('base-tiles');
    }

    const container = this.map.getContainer();
    if (actualSource === 'carto-dark') {
      if (container) container.classList.add('tactical-dark-mode');
    } else {
      if (container) container.classList.remove('tactical-dark-mode');
    }

    // Insert base-tiles before lowest vector layer
    const beforeLayerId = this.map.getLayer('vn-provinces-shadow') ? 'vn-provinces-shadow' : undefined;
    this.map.addLayer(
      {
        id: 'base-tiles',
        type: 'raster',
        source: actualSource,
        minzoom: 0,
        maxzoom: 20
      },
      beforeLayerId
    );

    // Re-order top layers
    const topLayers = [
      'vn-provinces-shadow',
      'vn-provinces-boundary',
      'vn-province-labels',
      'vn-all-wards-fill',
      'vn-all-wards-line',
      'vn-province-highlight-fill',
      'vn-province-highlight-glow',
      'vn-province-highlight-line',
      'ward-boundary-glow',
      'ward-boundary-line',
      'ward-boundary-fill'
    ];
    topLayers.forEach(l => {
      if (this.map.getLayer(l)) this.map.moveLayer(l);
    });
  }

  toggleAllWardsLayer(visible) {
    if (!this.map) return;
    const layers = ['vn-all-wards-line', 'vn-all-wards-fill'];
    layers.forEach(id => {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
      }
    });
    this.allWardsGridVisible = Boolean(visible);
  }

  toggleProvinceBoundaries(visible) {
    if (!this.map) return;
    const layers = ['vn-provinces-shadow', 'vn-provinces-boundary', 'vn-province-labels'];
    layers.forEach(id => {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
      }
    });
    this.provinceBoundariesVisible = Boolean(visible);
  }

  highlightProvinceBoundary(provinceName) {
    if (!this.map) return;
    const layerIdGlow = 'vn-province-highlight-glow';
    const layerIdLine = 'vn-province-highlight-line';
    const layerIdFill = 'vn-province-highlight-fill';

    // Clear highlight if empty
    if (!provinceName) {
      if (this.map.getLayer(layerIdGlow)) this.map.removeLayer(layerIdGlow);
      if (this.map.getLayer(layerIdLine)) this.map.removeLayer(layerIdLine);
      if (this.map.getLayer(layerIdFill)) this.map.removeLayer(layerIdFill);
      return;
    }

    if (!this.map.getSource('vnprov')) return;

    // Matches shapeName or name or name_en in vn-provinces.geojson
    const cleanName = provinceName.trim();
    const shortName = cleanName.replace(/^TP\.\s*/i, '').trim();

    const filter = [
      'any',
      ['==', ['get', 'shapeName'], cleanName],
      ['==', ['get', 'name'], cleanName],
      ['==', ['get', 'shapeName'], shortName],
      ['==', ['get', 'name'], shortName],
      ['==', ['get', 'name_en'], cleanName]
    ];

    // 1. Semi-transparent glowing yellow fill
    if (!this.map.getLayer(layerIdFill)) {
      this.map.addLayer({
        id: layerIdFill,
        type: 'fill',
        source: 'vnprov',
        paint: {
          'fill-color': '#eab308',
          'fill-opacity': 0.18
        },
        filter: filter
      });
    } else {
      this.map.setFilter(layerIdFill, filter);
    }

    // 2. High-Tech Luminous Outer Glow (sapnhap.bando.com.vn Yellow Outline)
    if (!this.map.getLayer(layerIdGlow)) {
      this.map.addLayer({
        id: layerIdGlow,
        type: 'line',
        source: 'vnprov',
        paint: {
          'line-color': '#f59e0b',
          'line-width': 14,
          'line-blur': 8,
          'line-opacity': 0.85
        },
        filter: filter
      });
    } else {
      this.map.setFilter(layerIdGlow, filter);
    }

    // 3. Crisp Bright Yellow Boundary Stroke
    if (!this.map.getLayer(layerIdLine)) {
      this.map.addLayer({
        id: layerIdLine,
        type: 'line',
        source: 'vnprov',
        paint: {
          'line-color': '#fde047',
          'line-width': 3.5,
          'line-opacity': 1.0
        },
        filter: filter
      });
    } else {
      this.map.setFilter(layerIdLine, filter);
    }
  }



  clearWardBoundary() {
    if (!this.map) return;
    const layers = ['ward-boundary-fill', 'ward-boundary-glow', 'ward-boundary-line'];
    layers.forEach(id => {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', 'none');
      }
    });
  }

  toggleWardBoundaryVisibility(visible) {
    if (!this.map) return false;
    const layers = ['ward-boundary-glow', 'ward-boundary-line', 'ward-boundary-fill'];
    const anyLayer = this.map.getLayer('ward-boundary-line');
    if (!anyLayer) return false;

    const currentVis = this.map.getLayoutProperty('ward-boundary-line', 'visibility') !== 'none';
    const newVis = visible !== undefined ? Boolean(visible) : !currentVis;

    layers.forEach(id => {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', newVis ? 'visible' : 'none');
      }
    });
    return newVis;
  }

  toggleStationsLayer(visible) {
    if (this.stationMarkers && Array.isArray(this.stationMarkers)) {
      this.stationMarkers.forEach(m => {
        if (m.getElement()) {
          m.getElement().style.display = visible ? 'block' : 'none';
        }
      });
    }
  }

  async toggleAllWardsLayer(visible) {
    if (!this.map) return;
    this.allWardsVisible = Boolean(visible);
    localStorage.setItem('allWardsVisible', String(this.allWardsVisible));

    const sourceId = 'vn-all-wards-source';
    const layers = [
      { id: 'vn-all-wards-fill', type: 'fill', paint: { 'fill-color': '#0284c7', 'fill-opacity': 0.05 } },
      { id: 'vn-all-wards-glow', type: 'line', paint: { 'line-color': '#38bdf8', 'line-width': 3, 'line-opacity': 0.4, 'line-blur': 2 } },
      { id: 'vn-all-wards-line', type: 'line', paint: { 'line-color': '#facc15', 'line-width': 1.2, 'line-opacity': 0.8 } }
    ];

    if (!this.map.getSource(sourceId)) {
      if (!visible) return;
      try {
        const res = await fetch('/assets/vn-ward-boundaries.json');
        const data = await res.json();
        if (!this.map.getSource(sourceId)) {
          this.map.addSource(sourceId, {
            type: 'geojson',
            data: data
          });

          layers.forEach(l => {
            if (!this.map.getLayer(l.id)) {
              this.map.addLayer({
                id: l.id,
                type: l.type,
                source: sourceId,
                paint: l.paint,
                layout: { visibility: 'visible' }
              });
            }
          });
        }
      } catch (err) {
        console.error('Error loading all-wards boundary data:', err);
      }
    } else {
      layers.forEach(l => {
        if (this.map.getLayer(l.id)) {
          this.map.setLayoutProperty(l.id, 'visibility', visible ? 'visible' : 'none');
        }
      });
    }
  }



  setCitizenMarker(lat, lng, label = 'Vị trí của bạn', shouldFly = false) {
    if (!this.map) return;
    if (this.markers.has('citizen')) {
      this.markers.get('citizen').remove();
    }

    const el = document.createElement('div');
    el.className = 'custom-map-pin citizen-pin';
    el.innerHTML = `
      <div class="pin-ring-pulse"></div>
      <div class="pin-core red">
        <span>📍</span>
      </div>
      <div class="pin-tooltip">${label}</div>
    `;

    const marker = new window.maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(this.map);

    this.markers.set('citizen', marker);
    if (shouldFly) {
      this.map.flyTo({ center: [lng, lat], zoom: 15.5, duration: 1200 });
    }
  }

  setStationMarker(lat, lng, name, agency) {
    if (!this.map) return;
    if (this.markers.has('station')) {
      this.markers.get('station').remove();
    }

    const icon = agency === 'police' ? '👮‍♂️' : (agency === 'hospital' ? '🚑' : '🚒');
    const colorClass = agency === 'police' ? 'blue' : (agency === 'hospital' ? 'green' : 'orange');

    const el = document.createElement('div');
    el.className = `custom-map-pin station-pin`;
    el.innerHTML = `
      <div class="pin-core ${colorClass}">
        <span>${icon}</span>
      </div>
      <div class="pin-tooltip">${name}</div>
    `;

    const marker = new window.maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(this.map);

    this.markers.set('station', marker);
  }

  setVehicleMarker(lat, lng, agency, unitName) {
    if (!this.map) return;
    const icon = agency === 'police' ? '🚓' : (agency === 'hospital' ? '🚑' : '🚒');

    if (this.markers.has('vehicle')) {
      this.markers.get('vehicle').setLngLat([lng, lat]);
      return;
    }

    const el = document.createElement('div');
    el.className = 'custom-map-pin vehicle-pin';
    el.innerHTML = `
      <div class="pin-ring-pulse vehicle"></div>
      <div class="pin-core vehicle">
        <span>${icon}</span>
      </div>
      <div class="pin-tooltip">${unitName || 'Xe cứu hộ đang tiếp cận'}</div>
    `;

    const marker = new window.maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(this.map);

    this.markers.set('vehicle', marker);
  }

  async drawRoute(fromCoords, toCoords) {
    if (!this.map) return;

    let routeCoordinates = [fromCoords, toCoords];

    // Attempt OSRM real street path
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromCoords[0]},${fromCoords[1]};${toCoords[0]},${toCoords[1]}?overview=full&geometries=geojson`;
      const res = await fetch(osrmUrl);
      const data = await res.json();
      if (data && data.routes && data.routes[0] && data.routes[0].geometry) {
        routeCoordinates = data.routes[0].geometry.coordinates;
      }
    } catch (e) {
      console.warn('OSRM fallback to straight line:', e);
    }

    const routeGeoJSON = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: routeCoordinates
      }
    };

    if (this.map.getSource(this.routeSourceId)) {
      this.map.getSource(this.routeSourceId).setData(routeGeoJSON);
    } else {
      this.map.addSource(this.routeSourceId, {
        type: 'geojson',
        data: routeGeoJSON
      });

      // Glow casing line
      this.map.addLayer({
        id: this.routeSourceId + '-glow',
        type: 'line',
        source: this.routeSourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0088ff',
          'line-width': 8,
          'line-opacity': 0.45,
          'line-blur': 3
        }
      });

      // Core animated pulse line
      this.map.addLayer({
        id: this.routeSourceId + '-line',
        type: 'line',
        source: this.routeSourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#00d2ff',
          'line-width': 4
        }
      });
    }

    // Fit bounds
    const bounds = new window.maplibregl.LngLatBounds();
    routeCoordinates.forEach(c => bounds.extend(c));
    this.map.fitBounds(bounds, { padding: 80, maxZoom: 16 });

    return routeCoordinates;
  }


  clearActiveWardPin() {
    if (this.activeWardStationMarker) {
      try { this.activeWardStationMarker.remove(); } catch(e) {}
      this.activeWardStationMarker = null;
    }
  }

  showWardStationPin(wardFeature, overrideStation = null) {
    if (!this.map || !wardFeature) return;
    this.clearActiveWardPin();

    const p = wardFeature.properties || {};
    const wardName = (p.ward || p.name || '').trim();
    const provName = (p.province || '').trim();

    // Compute polygon centroid / center
    let centerLng = null;
    let centerLat = null;
    if (Array.isArray(p.center) && p.center.length === 2) {
      centerLng = Number(p.center[0]);
      centerLat = Number(p.center[1]);
    } else if (wardFeature.geometry) {
      const geom = wardFeature.geometry;
      let allCoords = [];
      if (geom.type === 'Polygon') allCoords = geom.coordinates[0] || [];
      else if (geom.type === 'MultiPolygon') allCoords = (geom.coordinates[0] && geom.coordinates[0][0]) || [];
      if (allCoords.length > 0) {
        const sumLng = allCoords.reduce((acc, c) => acc + c[0], 0);
        const sumLat = allCoords.reduce((acc, c) => acc + c[1], 0);
        centerLng = sumLng / allCoords.length;
        centerLat = sumLat / allCoords.length;
      }
    }

    if (!centerLng || !centerLat) {
      centerLng = 105.783;
      centerLat = 10.033;
    }

    // Lookup station from memory
    let station = overrideStation;
    if (!station && Array.isArray(this.stationsData)) {
      const cleanW = wardName.toLowerCase().replace(/^(phường|xã|thị trấn)s+/i, '').trim();
      station = this.stationsData.find(s => {
        if (!s || s.id === 'st-admin' || s.level === 'national') return false;
        const sW = (s.ward || s.name || '').toLowerCase().replace(/^(phường|xã|thị trấn|công an phường|công an xã)s+/i, '').trim();
        const sProv = (s.province || '').toLowerCase();
        const matchProv = !provName || sProv.includes(provName.toLowerCase()) || provName.toLowerCase().includes(sProv);
        return matchProv && (sW === cleanW || sW.includes(cleanW) || cleanW.includes(sW));
      });
    }

    const isGpsVerified = Boolean(station && station.isGpsVerified === true && station.lat && station.lng);
    const pinLng = isGpsVerified ? Number(station.lng) : centerLng;
    const pinLat = isGpsVerified ? Number(station.lat) : centerLat;

    const baseName = station?.name || ('Công An ' + wardName);
    const displayName = isGpsVerified ? baseName : `${baseName} (chưa xác định GPS)`;

    const el = document.createElement('div');
    el.className = 'custom-map-pin congan-station-pin permanent-station neon-selected active-ward-reveal-pin';
    el.innerHTML = `
      <div class="congan-pin-emblem-wrap" style="filter: drop-shadow(0 0 10px #facc15);">
        <img src="/assets/iconcongan.png" class="congan-pin-emblem" alt="Huy hiệu CAND" />
      </div>
      <div class="congan-pin-label" style="background: rgba(15, 23, 42, 0.95); border: 1.5px solid #facc15; color: #fef08a; font-weight: 800; font-size: 11.5px; box-shadow: 0 4px 14px rgba(0,0,0,0.8);">
        ${displayName}
      </div>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.dispatcherApp && typeof window.dispatcherApp.showWardHud === 'function') {
        window.dispatcherApp.showWardHud(wardFeature, station);
      }
    });

    this.activeWardStationMarker = new window.maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([pinLng, pinLat])
      .addTo(this.map);
  }

  clearStationMarkers() {
    if (this._clusterMoveHandler && this.map) {
      this.map.off('moveend', this._clusterMoveHandler);
      this.map.off('zoomend', this._clusterMoveHandler);
      this._clusterMoveHandler = null;
    }
    if (this.stationMarkers && Array.isArray(this.stationMarkers)) {
      this.stationMarkers.forEach(m => m.remove());
    }
    this.stationMarkers = [];
    if (this.currentSelectedPinEl) {
      this.currentSelectedPinEl.classList.remove('neon-selected');
      this.currentSelectedPinEl = null;
    }
  }

  removeClusteredStationsLayers() {
    if (!this.map) return;
    const clusterLayers = [
      'stations-cluster-count-layer',
      'stations-clusters-layer',
      'stations-unclustered-point-layer'
    ];
    clusterLayers.forEach(l => {
      if (this.map.getLayer(l)) {
        try { this.map.removeLayer(l); } catch(e) {}
      }
    });
    if (this.map.getSource('stations-cluster-source')) {
      try { this.map.removeSource('stations-cluster-source'); } catch(e) {}
    }
  }

  async getStationsData() {
    if (this.cachedStations && Array.isArray(this.cachedStations) && this.cachedStations.length > 0) {
      return this.cachedStations;
    }
    try {
      const res = await fetch('/api/stations/all');
      const data = await res.json();
      if (data.ok && Array.isArray(data.stations)) {
        this.cachedStations = data.stations;
        return this.cachedStations;
      }
    } catch (e) {
      console.warn('Error loading stations:', e);
    }
    return [];
  }

  zoomToCoordinates(lng, lat, targetZoom = null) {
    if (!this.map) return;
    const currentZ = this.map.getZoom();
    const nextZ = targetZoom || Math.min(currentZ + 2.5, 14.5);
    this.map.flyTo({
      center: [lng, lat],
      zoom: nextZ,
      essential: true,
      duration: 750
    });
  }

  createPoliceStationPopupHtml(st) {
    const isNational = st.level === 'national' || st.id === 'st-admin' || (st.name && st.name.toLowerCase().includes('quốc gia'));
    const isPolice = st.agency === 'police' || isNational;
    const emblemHtml = isPolice
      ? `<img src="/assets/iconcongan.png" style="width: 44px; height: 44px; object-fit: contain; filter: drop-shadow(0 0 10px rgba(0, 240, 255, 0.8)); margin-right: 10px; flex-shrink: 0;" />`
      : `<div style="font-size: 32px; margin-right: 10px; flex-shrink: 0;">${st.agency === 'hospital' ? '🏥' : '🚒'}</div>`;

    const badgeText = isNational ? 'CƠ QUAN CHỈ HUY QUỐC GIA' : (isPolice ? 'CÔNG AN NHÂN DÂN VIỆT NAM' : (st.agency === 'hospital' ? 'CẤP CỨU Y TẾ 115' : 'PCCC & CNCH 114'));
    const badgeColor = isPolice ? '#38bdf8' : (st.agency === 'hospital' ? '#34d399' : '#fb923c');
    const badgeBorder = isPolice ? 'rgba(56, 189, 248, 0.4)' : (st.agency === 'hospital' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(251, 146, 60, 0.4)');

    return `
      <div class="tactical-police-popup-card" style="font-family: system-ui, -apple-system, sans-serif; background: rgba(15, 23, 42, 0.96); border: 1.5px solid ${badgeBorder}; border-radius: 12px; padding: 14px; color: #f8fafc; min-width: 290px; max-width: 340px; box-shadow: 0 12px 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(2, 132, 199, 0.4); backdrop-filter: blur(12px);">
        <div style="display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 10px;">
          ${emblemHtml}
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.8px; color: ${badgeColor}; text-transform: uppercase; margin-bottom: 2px;">
              🛡️ ${badgeText}
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #ffffff; line-height: 1.35; word-break: break-word;">
              ${st.name}
            </div>
          </div>
        </div>

        <div style="font-size: 11.5px; line-height: 1.55; color: #cbd5e1; margin-bottom: 12px;">
          <div style="margin-bottom: 5px; display: flex; align-items: flex-start;">
            <span style="color: #94a3b8; width: 85px; flex-shrink: 0;">👮‍♂️ Trực ban:</span>
            <span style="color: #f1f5f9; font-weight: 600;">${st.officerRank || 'Đại úy'} — ${st.officerName || 'Trực ban đơn vị'}</span>
          </div>
          <div style="margin-bottom: 5px; display: flex; align-items: flex-start;">
            <span style="color: #94a3b8; width: 85px; flex-shrink: 0;">📍 Địa chỉ:</span>
            <span style="color: #e2e8f0;">${st.address}</span>
          </div>
          <div style="margin-bottom: 5px; display: flex; align-items: center;">
            <span style="color: #94a3b8; width: 85px; flex-shrink: 0;">☎️ Hotline 113:</span>
            <a href="tel:${st.phone}" style="color: #38bdf8; font-weight: 800; font-size: 12.5px; text-decoration: none; background: rgba(2,132,199,0.15); padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(56,189,248,0.3);">
              📞 ${st.phone}
            </a>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="color: #94a3b8; width: 85px; flex-shrink: 0;">📡 Tác chiến:</span>
            <span style="color: #22c55e; font-weight: 700; font-size: 10.5px;">● Kênh 113 BCA (Trực tuyến 24/7)</span>
          </div>
        </div>

        <div style="display: flex; gap: 6px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${st.lat},${st.lng}&travelmode=driving" target="_blank" rel="noopener" style="flex: 1; text-align: center; background: linear-gradient(135deg, #0284c7, #0369a1); color: white; padding: 7px 4px; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 12px rgba(2,132,199,0.4);" title="Dẫn đường ô tô">
            🚗 Ô tô
          </a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${st.lat},${st.lng}&travelmode=two_wheeler" target="_blank" rel="noopener" style="flex: 1; text-align: center; background: linear-gradient(135deg, #059669, #047857); color: white; padding: 7px 4px; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 12px rgba(5,150,105,0.4);" title="Dẫn đường xe máy">
            🛵 Xe máy
          </a>
          <a href="tel:${st.phone}" style="flex: 0.9; text-align: center; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 7px 4px; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 12px rgba(220,38,38,0.4);" title="Gọi trực ban">
            📞 Gọi
          </a>
        </div>
      </div>
    `;
  }

  createPoliceClusterPopupHtml(cluster) {
    const stationList = cluster.stations || [];
    const displayStations = stationList.slice(0, 5);
    const remainingCount = stationList.length - displayStations.length;

    return `
      <div class="tactical-police-popup-card" style="font-family: system-ui, -apple-system, sans-serif; background: rgba(15, 23, 42, 0.96); border: 1.5px solid rgba(250, 204, 21, 0.6); border-radius: 12px; padding: 14px; color: #f8fafc; min-width: 300px; max-width: 350px; box-shadow: 0 12px 35px rgba(0, 0, 0, 0.8), 0 0 30px rgba(250, 204, 21, 0.35); backdrop-filter: blur(12px);">
        <div style="display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 10px;">
          <img src="/assets/iconcongan.png" style="width: 46px; height: 46px; object-fit: contain; filter: drop-shadow(0 0 12px rgba(250, 204, 21, 0.9)); margin-right: 10px; flex-shrink: 0;" />
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.8px; color: #facc15; text-transform: uppercase; margin-bottom: 2px;">
              🛡️ BỘ CÔNG AN — CỤM LỰC LƯỢNG VŨ TRANG
            </div>
            <div style="font-size: 13.5px; font-weight: 800; color: #ffffff; line-height: 1.35;">
              Cụm Công An (${stationList.length} Đồn Trạm & Trụ Sở)
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; background: rgba(2, 132, 199, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 6px 10px; margin-bottom: 10px; font-size: 11px;">
          <span style="color: #94a3b8;">Tổng đơn vị: <b style="color: #f8fafc;">${stationList.length} cơ quan</b></span>
          <span style="color: #22c55e; font-weight: 700;">● Trực chiến 24/7</span>
        </div>

        <div style="font-size: 10.5px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
          Danh sách đồn trạm trong cụm:
        </div>

        <div style="max-height: 130px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; padding-right: 4px;">
          ${displayStations.map(st => `
            <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 5px 8px; font-size: 11px;">
              <div style="font-weight: 700; color: #38bdf8;">👮‍♂️ ${st.name}</div>
              <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px; margin-top: 2px;">
                <span>📍 ${st.ward || st.province || ''}</span>
                <a href="tel:${st.phone}" style="color: #facc15; text-decoration: none; font-weight: 700;">📞 ${st.phone}</a>
              </div>
            </div>
          `).join('')}
          ${remainingCount > 0 ? `<div style="text-align: center; color: #94a3b8; font-size: 10px; padding: 4px 0; font-style: italic;">... và ${remainingCount} đồn trạm khác</div>` : ''}
        </div>

        <button onclick="window.dispatcherApp?.mapController?.zoomToCoordinates(${cluster.lng}, ${cluster.lat})" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border: 1px solid #38bdf8; border-radius: 8px; padding: 8px 12px; font-size: 11.5px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.5); transition: all 0.2s;">
          🔍 Thu phóng mở rộng cụm này
        </button>
      </div>
    `;
  }

  renderClusterPin(cluster) {
    const el = document.createElement('div');
    el.className = 'custom-map-pin congan-cluster-pin';
    el.innerHTML = `
      <div class="congan-pin-emblem-wrap">
        <img src="/assets/iconcongan.png" class="congan-pin-emblem" alt="Huy hiệu CAND" />
        <span class="congan-count-badge">${cluster.count}</span>
      </div>
      <div class="congan-pin-label">Công An (${cluster.count} đồn)</div>
    `;

    const popupContent = this.createPoliceClusterPopupHtml(cluster);
    const popup = new window.maplibregl.Popup({ offset: 25, closeButton: true })
      .setHTML(popupContent);

    popup.on('close', () => {
      if (this.currentSelectedPinEl === el) {
        el.classList.remove('neon-selected');
        this.currentSelectedPinEl = null;
      }
    });

        el.addEventListener('click', async () => {
      if (this.currentSelectedPinEl) {
        this.currentSelectedPinEl.classList.remove('neon-selected');
      }
      el.classList.add('neon-selected');
      this.currentSelectedPinEl = el;

      // Tự động khoanh vùng tô tím địa bàn phường xã của Công an khu vực khi được chọn
      try {
        const queryParams = new URLSearchParams({
          lat: exactLat,
          lng: exactLng,
          ward: st.ward || '',
          province: st.province || '',
          address: st.address || st.name || ''
        });
        const res = await fetch('/api/geo/locate-ward?' + queryParams.toString());
        const data = await res.json();
        if (data.ok && data.boundary) {
          this.highlightWardBoundary(data.boundary, { fitBounds: false });
          if (window.dispatcherApp && typeof window.dispatcherApp.showWardHud === 'function') {
            window.dispatcherApp.showWardHud(data.boundary);
          }
        }
      } catch (e) {
        console.warn('Could not highlight station ward boundary on click:', e);
      }
    });

    const marker = new window.maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([cluster.lng, cluster.lat])
      .setPopup(popup)
      .addTo(this.map);

    this.stationMarkers.push(marker);
  }

  renderSingleStationPin(st) {
    if (!st || !st.lat || !st.lng || st.id === 'st-admin' || st.level === 'national') {
      return;
    }
    const isNational = st.level === 'national' || st.id === 'st-admin' || (st.name && st.name.toLowerCase().includes('quốc gia'));
    const isPolice = st.agency === 'police' || isNational;

    const el = document.createElement('div');
    if (isPolice) {
      el.className = 'custom-map-pin congan-station-pin permanent-station' + (isNational ? ' pin-national-hq' : '');
      el.innerHTML = `
        <div class="congan-pin-emblem-wrap ${isNational ? 'pin-national-hq' : ''}">
          <img src="/assets/iconcongan.png" class="congan-pin-emblem" alt="Huy hiệu CAND" />
        </div>
        <div class="congan-pin-label">${isNational ? '★ ' : ''}${st.name}</div>
      `;
    } else {
      const icon = st.agency === 'hospital' ? '🏥' : '🚒';
      const colorClass = st.agency === 'hospital' ? 'green' : 'orange';
      el.className = 'custom-map-pin station-pin permanent-station';
      el.innerHTML = `
        <div class="pin-core ${colorClass}">
          <span>${icon}</span>
        </div>
        <div class="pin-tooltip">${st.name}</div>
      `;
    }

    const exactLng = Number(st.lng || st.stationLng);
    const exactLat = Number(st.lat || st.stationLat);

    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (this.currentSelectedPinEl) {
        this.currentSelectedPinEl.classList.remove('neon-selected');
      }
      el.classList.add('neon-selected');
      this.currentSelectedPinEl = el;

      const isProvinceLevel = st.level === 'province' || 
        (st.name && (st.name.includes('Công An TP.') || st.name.includes('Công An Tỉnh') || st.name.includes('Bộ Chỉ Huy')) && !st.name.includes('Phường') && !st.name.includes('Xã')) ||
        (st.ward === 'Toàn Thành Phố' || st.ward === 'Toàn Tỉnh');

      if (isProvinceLevel) {
        // Công an cấp Tỉnh / Thành phố: Khoanh vùng bao trọn TOÀN BỘ thành phố/tỉnh đó!
        this.clearWardBoundary();
        this.highlightProvinceBoundary(st.province);
        if (window.dispatcherApp && typeof window.dispatcherApp.showProvinceHud === 'function') {
          window.dispatcherApp.showProvinceHud(st);
        }
        return;
      }

      // Công an cấp xã/phường: Xóa viền tỉnh cũ & khoanh vùng địa bàn xã/phường sở tại
      this.highlightProvinceBoundary(null);
      try {
        const queryParams = new URLSearchParams({
          id: st.wardId || '',
          lat: exactLat,
          lng: exactLng,
          ward: st.ward || '',
          province: st.province || '',
          address: st.address || st.name || ''
        });
        const res = await fetch('/api/geo/locate-ward?' + queryParams.toString());
        const data = await res.json();
        if (data.ok && data.boundary) {
          this.highlightWardBoundary(data.boundary, { fitBounds: false });
          if (window.dispatcherApp && typeof window.dispatcherApp.showWardHud === 'function') {
            window.dispatcherApp.showWardHud(data.boundary, st);
          }
        } else {
          // Fallback if boundary not located via API
          const fallbackFeature = {
            type: 'Feature',
            properties: {
              ward: st.ward,
              province: st.province,
              police: st.name,
              phone: st.phone,
              sms: st.sms,
              officer: st.officer,
              address: st.address,
              center: [exactLng, exactLat]
            }
          };
          if (window.dispatcherApp && typeof window.dispatcherApp.showWardHud === 'function') {
            window.dispatcherApp.showWardHud(fallbackFeature, st);
          }
        }
      } catch (err) {
        console.warn('Error loading ward HUD on pin click:', err);
      }
    });

    const marker = new window.maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([exactLng, exactLat])
      .addTo(this.map);

    this.stationMarkers.push(marker);
  }

  updateClusterPins() {
    if (!this.map || !this.clusterableStations || this.clusterableStations.length === 0) return;
    
    // Clear existing markers
    if (this.stationMarkers && Array.isArray(this.stationMarkers)) {
      this.stationMarkers.forEach(m => m.remove());
    }
    this.stationMarkers = [];

    const zoom = this.map.getZoom();
    const bounds = this.map.getBounds();
    const west = bounds.getWest() - 0.5;
    const east = bounds.getEast() + 0.5;
    const south = bounds.getSouth() - 0.5;
    const north = bounds.getNorth() + 0.5;

    const visible = this.clusterableStations.filter(st =>
      st.lng >= west && st.lng <= east && st.lat >= south && st.lat <= north
    );

    // When zoom >= 9.2 (viewing a province, city, or district), show all stations at their exact real coordinates!
    if (zoom >= 9.2) {
      visible.forEach(st => this.renderSingleStationPin(st));
      return;
    }

    // Grid clustering by screen pixels (radius 65px)
    const clusterRadius = 65;
    const clusters = [];
    const assigned = new Set();

    for (let i = 0; i < visible.length; i++) {
      if (assigned.has(i)) continue;
      const stA = visible[i];
      const ptA = this.map.project([stA.lng, stA.lat]);
      const group = [stA];
      assigned.add(i);

      for (let j = i + 1; j < visible.length; j++) {
        if (assigned.has(j)) continue;
        const stB = visible[j];
        const ptB = this.map.project([stB.lng, stB.lat]);
        const dx = ptA.x - ptB.x;
        const dy = ptA.y - ptB.y;
        if (Math.hypot(dx, dy) <= clusterRadius) {
          group.push(stB);
          assigned.add(j);
        }
      }

      if (group.length === 1) {
        clusters.push({ isCluster: false, station: group[0] });
      } else {
        const avgLng = group.reduce((sum, s) => sum + s.lng, 0) / group.length;
        const avgLat = group.reduce((sum, s) => sum + s.lat, 0) / group.length;
        clusters.push({
          isCluster: true,
          lng: avgLng,
          lat: avgLat,
          count: group.length,
          stations: group
        });
      }
    }

    clusters.forEach(item => {
      if (item.isCluster) {
        this.renderClusterPin(item);
      } else {
        this.renderSingleStationPin(item.station);
      }
    });
  }

  renderClusteredStations(stations) {
    if (!this.map) return;
    this.clearStationMarkers();
    this.removeClusteredStationsLayers();
    (stations || []).forEach(st => this.renderSingleStationPin(st));
  }

  async loadAllStationsMarkers(filterRegion = null, agency = null, isAdmin = false) {
    if (!this.map) return;

    const allStations = await this.getStationsData();
    if (!allStations || allStations.length === 0) return;

    this.removeClusteredStationsLayers();
    this.clearStationMarkers();

    const isAll = !filterRegion || filterRegion === 'all' || filterRegion === 'Toàn Quốc' || filterRegion === 'Cấp Quốc Gia' || (filterRegion && filterRegion.includes('Quốc'));

    let stationsToRender = allStations.filter(s => {
      // Bỏ qua trạm chưa có toạ độ hoặc trung tâm chỉ huy quốc gia (để chọn sau)
      if (!s.lat || !s.lng || s.id === 'st-admin' || s.level === 'national') return false;
      if (isAdmin || isAll) return true;
      const matchProv = s.level === 'national' || s.id === 'st-admin' || (s.name && s.name.includes('Quốc Gia')) ||
        (s.province || '').toLowerCase().includes(filterRegion.toLowerCase());
      if (!matchProv) return false;
      if (agency && agency !== 'all' && s.level !== 'national' && s.id !== 'st-admin') {
        if (agency === 'fire') return s.agency === 'fire' || s.agency === 'rescue';
        return s.agency === agency;
      }
      return true;
    });

    stationsToRender.forEach(st => {
      this.renderSingleStationPin(st);
    });
  }

  reloadStationsMarkers(region = 'all', agency = null, isAdmin = false) {
    this.loadAllStationsMarkers(region, agency, isAdmin);
  }

  enableAdminAddStationMode(onCoordsSelected) {
    if (!this.map) return;
    this.adminAddStationMode = true;
    this.map.getCanvas().style.cursor = 'crosshair';

    this.adminMapClickHandler = async (e) => {
      if (!this.adminAddStationMode) return;
      const { lng, lat } = e.lngLat;

      // Add temporary dropped pin marker
      if (this.tempAdminPin) this.tempAdminPin.remove();

      const el = document.createElement('div');
      el.className = 'custom-map-pin station-pin pulse-alert';
      el.innerHTML = `
        <div class="pin-core blue" style="width: 34px; height: 34px; font-size: 16px; border: 2px solid #fbbf24; box-shadow: 0 0 16px #eab308;">
          <span>📍</span>
        </div>
        <div class="pin-tooltip" style="font-size: 10px; font-weight: 800; color: #fbbf24;">Ghim Vị Trí Đồn Mới</div>
      `;

      this.tempAdminPin = new window.maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([lng, lat])
        .addTo(this.map);

      this.tempAdminPin.on('dragend', () => {
        const pt = this.tempAdminPin.getLngLat();
        if (onCoordsSelected) {
          onCoordsSelected({ lat: parseFloat(pt.lat.toFixed(6)), lng: parseFloat(pt.lng.toFixed(6)) });
        }
      });

      let detectedAddress = `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      try {
        const res = await fetch(`/api/geo/locate-ward?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        if (data.ok && data.jurisdiction) {
          detectedAddress = `${data.jurisdiction.ward || ''}, ${data.jurisdiction.province || 'Cần Thơ'}`;
        }
      } catch (err) {}

      if (onCoordsSelected) {
        onCoordsSelected({
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          address: detectedAddress
        });
      }
    };

    this.map.once('click', this.adminMapClickHandler);
  }

  disableAdminAddStationMode() {
    this.adminAddStationMode = false;
    if (this.map) this.map.getCanvas().style.cursor = '';
    if (this.tempAdminPin) {
      this.tempAdminPin.remove();
      this.tempAdminPin = null;
    }
  }

  async initAllWardsLayer(onWardClick = null, onWardHover = null) {
    if (!this.map) return;

    try {
      const res = await fetch('/api/geo/all-wards');
      const data = await res.json();
      if (!data.ok || !data.boundaries) return;

      const sourceId = 'vn-all-wards-source';
      const fillLayerId = 'vn-all-wards-fill';
      const lineLayerId = 'vn-all-wards-line';
      const glowLayerId = 'vn-all-wards-glow';
      const labelLayerId = 'vn-all-wards-label';

      const initialVisibility = this.allWardsVisible ? 'visible' : 'none';

      const setupLayers = () => {
        if (this.map.getSource(sourceId)) {
          this.map.getSource(sourceId).setData(data.boundaries);
          this.toggleAllWardsLayer(this.allWardsVisible);
          return;
        }

        this.map.addSource(sourceId, {
          type: 'geojson',
          data: data.boundaries
        });

        const beforeLayer = this.map.getLayer('vn-provinces-shadow') ? 'vn-provinces-shadow' : undefined;

        // 1. All Wards Ambient Outer Glow
        this.map.addLayer({
          id: glowLayerId,
          type: 'line',
          source: sourceId,
          layout: { 'visibility': initialVisibility },
          paint: {
            'line-color': '#f59e0b',
            'line-width': 6,
            'line-blur': 4,
            'line-opacity': 0.5
          }
        }, beforeLayer);

        // 2. All Wards Translucent Pastel Polygon Fill
        this.map.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          layout: { 'visibility': initialVisibility },
          paint: {
            'fill-color': ['coalesce', ['get', 'color'], '#a855f7'],
            'fill-opacity': 0.35
          }
        }, beforeLayer);

        // 3. All Wards Crisp Yellow Boundary Line
        this.map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          layout: { 'visibility': initialVisibility },
          paint: {
            'line-color': '#fbbf24',
            'line-width': 1.8,
            'line-opacity': 0.95
          }
        }, beforeLayer);

        // 4. All Wards Dynamic Text Label Layer
        this.map.addLayer({
          id: labelLayerId,
          type: 'symbol',
          source: sourceId,
          minzoom: 10,
          layout: {
            'visibility': initialVisibility,
            'text-field': ['get', 'ward'],
            'text-font': ['Open Sans Semibold'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10, 14, 13, 17, 16],
            'text-anchor': 'center',
            'text-allow-overlap': false
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(0, 0, 0, 0.85)',
            'text-halo-width': 2
          }
        });

        // Mouse Events
        this.map.on('mouseenter', fillLayerId, (e) => {
          this.map.getCanvas().style.cursor = 'pointer';
          if (e.features && e.features[0] && onWardHover) {
            onWardHover(e.features[0]);
          }
        });

        this.map.on('mouseleave', fillLayerId, () => {
          this.map.getCanvas().style.cursor = '';
        });

        this.map.on('click', fillLayerId, (e) => {
          if (e.features && e.features[0]) {
            const feature = e.features[0];
            this.highlightWardBoundary(feature);
            if (onWardClick) onWardClick(feature);
          }
        });
      };

      if (this.map.loaded()) {
        setupLayers();
      } else {
        this.map.once('load', setupLayers);
      }
    } catch (e) {
      console.warn('Could not init all wards layer:', e);
    }
  }

  toggleAllWardsLayer(visible = true) {
    this.allWardsVisible = visible;
    // Persist state so page reload remembers user preference
    try { localStorage.setItem('allWardsVisible', visible); } catch (e) {}
    if (!this.map) return;
    const visibility = visible ? 'visible' : 'none';
    const layers = ['vn-all-wards-fill', 'vn-all-wards-line', 'vn-all-wards-glow', 'vn-all-wards-label'];
    layers.forEach(l => {
      if (this.map.getLayer(l)) {
        this.map.setLayoutProperty(l, 'visibility', visibility);
        // When making visible, ensure the layer is on top of base tiles
        if (visible) this.map.moveLayer(l);
      }
    });
    // Move province overlay back on top after ward layers
    if (visible) {
      if (this.map.getLayer('vn-provinces-boundary')) this.map.moveLayer('vn-provinces-boundary');
      if (this.map.getLayer('vn-province-labels')) this.map.moveLayer('vn-province-labels');
    }
  }

  highlightWardBoundary(boundaryGeoJSON, options = {}) {
    if (!this.map || !boundaryGeoJSON) return;

    const sourceId = 'ward-boundary-source';
    const fillLayerId = 'ward-boundary-fill';
    const lineLayerId = 'ward-boundary-line';
    const glowLayerId = 'ward-boundary-glow';

    const color = options.color || boundaryGeoJSON.properties?.color || '#facc15';

    const executeRender = () => {
      let featureData = boundaryGeoJSON;
      if (boundaryGeoJSON.type !== 'Feature' && boundaryGeoJSON.type !== 'FeatureCollection') {
        featureData = {
          type: 'Feature',
          properties: boundaryGeoJSON.properties || {},
          geometry: boundaryGeoJSON
        };
      }

      this.currentWardBoundary = featureData;

      if (this.map.getSource(sourceId)) {
        this.map.getSource(sourceId).setData(featureData);
      } else {
        this.map.addSource(sourceId, {
          type: 'geojson',
          data: featureData
        });

        // 1. High-Tech Luminous Outer Glow
        this.map.addLayer({
          id: glowLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#f59e0b',
            'line-width': 12,
            'line-blur': 6,
            'line-opacity': 0.85
          }
        });

        // 2. High-Tech Semi-Transparent Purple/Amber Geofence Fill
        this.map.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': '#a855f7',
            'fill-opacity': 0.30
          }
        });

        // 3. Crisp Bright Yellow Boundary Stroke
        this.map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#facc15',
            'line-width': 3.5,
            'line-opacity': 1.0
          }
        });
      }

      // CRITICAL: Always ensure layers are visible
      [glowLayerId, fillLayerId, lineLayerId].forEach(id => {
        if (this.map.getLayer(id)) {
          this.map.setLayoutProperty(id, 'visibility', 'visible');
        }
      });

      // Move layers to the top of the vector overlays
      if (this.map.getLayer(glowLayerId)) this.map.moveLayer(glowLayerId);
      if (this.map.getLayer(fillLayerId)) this.map.moveLayer(fillLayerId);
      if (this.map.getLayer(lineLayerId)) this.map.moveLayer(lineLayerId);

      // Fit bounds smoothly to ward polygon (only if not explicitly disabled)
      if (options.fitBounds !== false) {
        try {
          const bounds = new window.maplibregl.LngLatBounds();
          const pts = [];
          const extractPoints = (arr) => {
            if (!arr) return;
            if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number' && !isNaN(arr[0]) && !isNaN(arr[1])) {
              pts.push(arr);
            } else if (Array.isArray(arr)) {
              for (let i = 0; i < arr.length; i++) extractPoints(arr[i]);
            }
          };

          const geom = featureData.geometry || featureData.features?.[0]?.geometry;
          if (geom && geom.coordinates) {
            extractPoints(geom.coordinates);
          }

          if (pts.length > 0) {
            pts.forEach(pt => {
              bounds.extend([pt[0], pt[1]]);
            });
            this.map.fitBounds(bounds, { padding: { top: 60, bottom: 90, left: 60, right: 380 }, maxZoom: 14.5, duration: 1000 });
          } else if (featureData.properties?.center) {
            const c = featureData.properties.center;
            this.map.flyTo({ center: [c[0], c[1]], zoom: 14, duration: 1000 });
          }
        } catch (e) {
          console.warn('Could not fit bounds to ward polygon:', e);
        }
      }
    };

    if (this.map.loaded()) {
      executeRender();
    } else {
      this.map.once('load', executeRender);
    }
  }

  clearWardBoundary() {
    this.currentWardBoundary = null;
    if (!this.map) return;
    const sourceId = 'ward-boundary-source';
    if (this.map.getSource(sourceId)) {
      this.map.getSource(sourceId).setData({
        type: 'FeatureCollection',
        features: []
      });
    }
    ['ward-boundary-fill', 'ward-boundary-glow', 'ward-boundary-line'].forEach(id => {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', 'none');
      }
    });
  }
}


