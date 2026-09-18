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

  clearStationMarkers() {
    if (this.stationMarkers && Array.isArray(this.stationMarkers)) {
      this.stationMarkers.forEach(m => m.remove());
    }
    this.stationMarkers = [];
  }

  async loadAllStationsMarkers(filterRegion = null) {
    if (!this.map) return;
    this.clearStationMarkers();

    try {
      const res = await fetch('/api/stations/all');
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.stations)) return;

      let stationsToRender = data.stations;
      if (filterRegion && filterRegion !== 'all') {
        stationsToRender = stationsToRender.filter(s =>
          s.level === 'national' || s.id === 'st-admin' || (s.name && s.name.includes('Quốc Gia')) ||
          (s.province || '').toLowerCase().includes(filterRegion.toLowerCase())
        );
      }

      stationsToRender.forEach(st => {
        const isNational = st.level === 'national' || st.id === 'st-admin' || (st.name && st.name.toLowerCase().includes('quốc gia'));
        const icon = isNational ? '⭐' : (st.agency === 'police' ? '👮‍♂️' : (st.agency === 'hospital' ? '🏥' : '🚒'));
        const colorClass = isNational ? 'gold' : (st.agency === 'police' ? 'blue' : (st.agency === 'hospital' ? 'green' : 'orange'));

        const el = document.createElement('div');
        el.className = 'custom-map-pin station-pin permanent-station' + (isNational ? ' pin-national-hq' : '');
        el.innerHTML = `
          <div class="pin-core ${colorClass}" style="${isNational ? 'width: 38px; height: 38px; font-size: 18px; border: 2.5px solid #facc15; box-shadow: 0 0 25px #eab308, 0 8px 20px rgba(0,0,0,0.9); background: radial-gradient(circle at 35% 30%, #fef08a 0%, #b45309 65%, #451a03 100%); animation: pulseHqPin 2.2s infinite ease-in-out;' : 'width: 30px; height: 30px; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.6);'}">
            <span>${icon}</span>
          </div>
          <div class="pin-tooltip" style="font-size: 10px; font-weight: 800; ${isNational ? 'color: #fef08a; border-color: #facc15; background: rgba(15,23,42,0.95);' : ''}">${isNational ? '⭐ ' : ''}${st.name}</div>
        `;

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; padding: 6px; max-width: 220px; color: #0f172a;">
            <div style="font-weight: 800; font-size: 12px; color: ${st.agency === 'police' ? '#0066cc' : (st.agency === 'hospital' ? '#059669' : '#d97706')}; margin-bottom: 3px;">
              ${icon} ${st.name}
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px; line-height: 1.4;">
              📍 <b>Địa chỉ:</b> ${st.address}
            </div>
            <div style="font-size: 11px; color: #0f172a; margin-bottom: 6px;">
              ☎️ <b>Trực ban:</b> <a href="tel:${st.phone}" style="color: #0284c7; font-weight: 700; text-decoration: none;">${st.phone}</a>
            </div>
            <div style="display: flex; gap: 4px; margin-top: 6px;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${st.lat},${st.lng}&travelmode=driving" target="_blank" rel="noopener" style="flex: 1; text-align: center; background: #0088ff; color: white; padding: 5px 6px; border-radius: 6px; font-size: 10px; font-weight: 700; text-decoration: none;" title="Dẫn đường ô tô nhanh nhất">
                🚗 Ô tô
              </a>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${st.lat},${st.lng}&travelmode=two_wheeler" target="_blank" rel="noopener" style="flex: 1; text-align: center; background: #059669; color: white; padding: 5px 6px; border-radius: 6px; font-size: 10px; font-weight: 700; text-decoration: none;" title="Dẫn đường xe máy nhanh nhất">
                🛵 Xe máy
              </a>
            </div>
          </div>
        `;

        const popup = new window.maplibregl.Popup({ offset: 20, closeButton: false })
          .setHTML(popupContent);

        const marker = new window.maplibregl.Marker({ element: el })
          .setLngLat([st.lng, st.lat])
          .setPopup(popup)
          .addTo(this.map);

        this.stationMarkers.push(marker);
      });
    } catch (e) {
      console.warn('Could not load station pins:', e);
    }
  }

  reloadStationsMarkers(region = 'all') {
    this.loadAllStationsMarkers(region);
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
