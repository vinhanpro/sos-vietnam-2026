import * as THREE from '../vendor/three/three.module.min.js';

// The caller owns playback. This renderer never starts an independent RAF loop.
export async function createCinematicGlobe(container, geography, onContextLost) {
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x020711);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.className = 'cinematic-globe-canvas';
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .01, 100);
  let disposed = false;
  let lastProgress = 0;
  let texture;
  const resources = [];
  const own = value => { resources.push(value); return value; };
  const geographic = (lon, lat, radius = 1) => {
    const phi = THREE.MathUtils.degToRad(lat);
    const theta = THREE.MathUtils.degToRad(lon);
    return new THREE.Vector3(radius * Math.cos(phi) * Math.cos(theta), radius * Math.sin(phi), -radius * Math.cos(phi) * Math.sin(theta));
  };
  function dispose() {
    if (disposed) return;
    disposed = true;
    renderer.domElement.removeEventListener('webglcontextlost', lost);
    resources.forEach(resource => resource.dispose());
    texture?.dispose(); renderer.dispose(); renderer.domElement.remove();
  }
  function lost(event) {
    event.preventDefault();
    dispose(); onContextLost();
  }
  renderer.domElement.addEventListener('webglcontextlost', lost);
  try {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 12000);
    let blob;
    try {
      const response = await fetch('/assets/cinematic-earth-day.jpg', { signal: abort.signal });
      if (!response.ok) throw new Error('Earth texture unavailable');
      blob = await response.blob();
    } finally { clearTimeout(timeout); }
    const url = URL.createObjectURL(blob);
    try { texture = await new THREE.TextureLoader().loadAsync(url); }
    finally { URL.revokeObjectURL(url); }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    scene.add(new THREE.Mesh(own(new THREE.SphereGeometry(1, 128, 64)), own(new THREE.MeshPhongMaterial({ map: texture, shininess: 8, specular: 0x274654 }))));
    scene.add(new THREE.AmbientLight(0x9dbfe5, 1.6));
    const sun = new THREE.DirectionalLight(0xffeed4, 2.2);
    sun.position.copy(geographic(55, 45, 5)); scene.add(sun);

    const atmosphere = own(new THREE.ShaderMaterial({
      vertexShader: 'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
      fragmentShader: 'varying vec3 n; varying vec3 v; void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(v))),3.);gl_FragColor=vec4(.15,.55,1.,rim*.55);}',
      side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(new THREE.Mesh(own(new THREE.SphereGeometry(1.025, 96, 48)), atmosphere));

    const borders = [];
    for (const feature of geography.features) {
      const g = feature.geometry;
      const polygons = g?.type === 'Polygon' ? [g.coordinates] : g?.type === 'MultiPolygon' ? g.coordinates : [];
      for (const polygon of polygons) for (const ring of polygon) {
        // Retain source coordinates and close rings; batch all provinces in one draw call.
        for (let i = 1; i < ring.length; i++) {
          borders.push(...geographic(...ring[i - 1], 1.001).toArray(), ...geographic(...ring[i], 1.001).toArray());
        }
      }
    }
    const borderGeometry = own(new THREE.BufferGeometry());
    borderGeometry.setAttribute('position', new THREE.Float32BufferAttribute(borders, 3));
    scene.add(new THREE.LineSegments(borderGeometry, own(new THREE.LineBasicMaterial({ color: 0xffd388, transparent: true, opacity: .85 }))));
    const stars = [];
    // Deterministic starfield makes screenshot comparisons reproducible.
    for (let i = 0; i < 420; i++) {
      const lat = Math.asin(2 * (i + .5) / 420 - 1) * 180 / Math.PI;
      stars.push(...geographic(i * 137.508, lat, 25).toArray());
    }
    const starGeometry = own(new THREE.BufferGeometry());
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
    scene.add(new THREE.Points(starGeometry, own(new THREE.PointsMaterial({ color: 0xcce5ff, size: .025, transparent: true, opacity: .65 }))));
    container.prepend(renderer.domElement);

    function render(progress) {
      if (disposed) return;
      lastProgress = progress;
      const t = THREE.MathUtils.smootherstep(progress, 0, 1);
      const narrow = container.clientWidth < 700;
      const direction = geographic(65 + 43 * t, 30 - 14 * t);
      const radius = THREE.MathUtils.lerp(narrow ? 5.4 : 3.9, narrow ? 2.05 : 1.65, t);
      camera.position.copy(direction.multiplyScalar(radius));
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      container.dataset.drawCalls = String(renderer.info.render.calls);
      container.dataset.triangles = String(renderer.info.render.triangles);
    }
    function resize() {
      if (disposed) return;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(2400000 / (width * height))));
      renderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix();
      render(lastProgress);
    }
    resize();
    return { render, resize, dispose };
  } catch (error) { dispose(); throw error; }
}
