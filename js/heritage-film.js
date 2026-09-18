import * as THREE from '../vendor/three/three.module.min.js';

// One renderer, caller-owned timeline, no independent animation loop.
export async function createHeritageFilm(host, onLost) {
  const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});
  renderer.setClearColor(0x03080d); renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.01,180);
  const resources=[],own=value=>{resources.push(value);return value;};
  let disposed=false,current=0,currentReduced=false;
  const geographic=(lon,lat,radius=1)=>{
    const a=THREE.MathUtils.degToRad(lon),b=THREE.MathUtils.degToRad(lat);
    return new THREE.Vector3(Math.cos(b)*Math.cos(a)*radius,Math.sin(b)*radius,-Math.cos(b)*Math.sin(a)*radius);
  };
  async function texture(url) {
    const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),12000);let blob;
    try {const response=await fetch(url,{signal:abort.signal});if(!response.ok)throw new Error('Media unavailable');blob=await response.blob();}
    finally {clearTimeout(timeout);}
    const objectURL=URL.createObjectURL(blob);
    try {const result=own(await new THREE.TextureLoader().loadAsync(objectURL));result.colorSpace=THREE.SRGBColorSpace;return result;}
    finally {URL.revokeObjectURL(objectURL);}
  }
  function dispose(){if(disposed)return;disposed=true;renderer.domElement.removeEventListener('webglcontextlost',lost);resources.forEach(r=>r.dispose());renderer.dispose();renderer.domElement.remove();}
  function lost(event){event.preventDefault();dispose();onLost();}
  renderer.domElement.addEventListener('webglcontextlost',lost);
  try {
    const earthTexture=await texture('/assets/cinematic-earth-day.jpg');
    const portraitTexture=await texture('/assets/heritage-portrait.jpg');
    const earth=new THREE.Mesh(own(new THREE.SphereGeometry(1,96,48)),own(new THREE.MeshPhongMaterial({map:earthTexture,shininess:6})));
    scene.add(earth,new THREE.AmbientLight(0xa2bfdd,1.8));
    const light=new THREE.DirectionalLight(0xffefd5,2.5);light.position.copy(geographic(60,40,5));scene.add(light);
    const atmosphere=new THREE.Mesh(own(new THREE.SphereGeometry(1.028,64,32)),own(new THREE.ShaderMaterial({
      vertexShader:'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
      fragmentShader:'varying vec3 n;varying vec3 v;void main(){float r=pow(1.-abs(dot(normalize(n),normalize(v))),3.);gl_FragColor=vec4(.15,.5,1.,r*.7);}',
      side:THREE.BackSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false
    })));scene.add(atmosphere);
    const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),12000);let geography;
    try {const response=await fetch('/assets/vn-provinces.geojson',{signal:abort.signal});if(!response.ok)throw new Error('Geography unavailable');geography=await response.json();}
    finally {clearTimeout(timeout);}
    if(!Array.isArray(geography.features)||!geography.features.length)throw new Error('Invalid geography');
    const points=[];
    for(const feature of geography.features){const g=feature.geometry,polygons=g?.type==='Polygon'?[g.coordinates]:g?.type==='MultiPolygon'?g.coordinates:[];
      for(const polygon of polygons)for(const ring of polygon)for(let i=1;i<ring.length;i++)points.push(...geographic(...ring[i-1],1.002).toArray(),...geographic(...ring[i],1.002).toArray());}
    const borders=own(new THREE.BufferGeometry());borders.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    scene.add(new THREE.LineSegments(borders,own(new THREE.LineBasicMaterial({color:0xffd284,transparent:true,opacity:.9}))));
    const starPoints=[];
    for(let i=0;i<1000;i++){const v=geographic(i*137.508,Math.asin(2*(i+.5)/1000-1)*180/Math.PI,35);starPoints.push(v.x+10,v.y,v.z);}
    const starGeo=own(new THREE.BufferGeometry());starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPoints,3));
    scene.add(new THREE.Points(starGeo,own(new THREE.PointsMaterial({size:.035,color:0xbdd9ed,transparent:true,opacity:.7}))));
    const memory=new THREE.Group();memory.position.x=20;scene.add(memory);
    const portraitMaterial=own(new THREE.ShaderMaterial({
      uniforms:{map:{value:portraitTexture},reveal:{value:0},fade:{value:0}},
      vertexShader:'varying vec2 uvP;void main(){uvP=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`uniform sampler2D map;uniform float reveal;uniform float fade;varying vec2 uvP;
        void main(){vec3 c=texture2D(map,uvP).rgb;float l=dot(c,vec3(.299,.587,.114));
        float edge=clamp(length(vec2(dFdx(l),dFdy(l)))*95.,0.,1.);
        vec3 ink=vec3(1.,.74,.36)*edge;vec3 photo=vec3(l)*vec3(1.,.93,.8);
        float scan=smoothstep(1.-reveal-.06,1.-reveal,uvP.y);
        float border=smoothstep(0.,.06,uvP.x)*smoothstep(0.,.06,1.-uvP.x)*smoothstep(0.,.04,uvP.y)*smoothstep(0.,.04,1.-uvP.y);
        gl_FragColor=vec4(mix(ink,photo,smoothstep(.72,1.,reveal)),scan*border*fade);
        #include <colorspace_fragment>
      }`,transparent:true,depthWrite:false,side:THREE.DoubleSide
    }));
    const portrait=new THREE.Mesh(own(new THREE.PlaneGeometry(3.2,3.2*2560/1918)),portraitMaterial);memory.add(portrait);
    const ringMaterial=own(new THREE.MeshBasicMaterial({color:0xb58b42,transparent:true,opacity:.24})),rings=[];
    for(let i=0;i<4;i++){const ring=new THREE.Mesh(own(new THREE.TorusGeometry(3.4+i*.65,.008,4,128)),ringMaterial);ring.rotation.set(.3+i*.2,.3+i*.25,i*.3);ring.position.z=-4.5-i;memory.add(ring);rings.push(ring);}
    const yearPlanes=[];
    for(const [i,year]of ['1890','1911','1920','1930','1941','1945','1954','1969'].entries()){
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
      ctx.font='130px Georgia';ctx.fillStyle='#eacb8d';ctx.textAlign='center';ctx.fillText(year,256,165);
      const map=own(new THREE.CanvasTexture(canvas));map.colorSpace=THREE.SRGBColorSpace;
      const plane=new THREE.Mesh(own(new THREE.PlaneGeometry(3.6,1.8)),own(new THREE.MeshBasicMaterial({map,transparent:true,opacity:0,depthWrite:false})));
      memory.add(plane);yearPlanes.push(plane);
    }
    host.append(renderer.domElement);
    function render(seconds,reduced=false){
      if(disposed)return;current=seconds;currentReduced=reduced;
      const intro=THREE.MathUtils.smootherstep(seconds/12,0,1),narrow=host.clientWidth<600;
      const globeEye=geographic(65+43*intro,30-14*intro,THREE.MathUtils.lerp(narrow?5.5:3.9,narrow?2.3:1.62,intro));
      const transition=THREE.MathUtils.smootherstep((seconds-12)/6,0,1),drift=reduced?0:Math.sin((seconds-18)*.085);
      camera.position.copy(globeEye).lerp(new THREE.Vector3(20+drift*.8,narrow?.5:.15,narrow?10.5:7.5),transition);
      camera.lookAt(20*transition,narrow?-.45*transition:-.3*transition,0);
      memory.visible=seconds>12;earth.visible=seconds<20;atmosphere.visible=seconds<20;
      portraitMaterial.uniforms.reveal.value=THREE.MathUtils.clamp((seconds-15)/6,0,1);portraitMaterial.uniforms.fade.value=THREE.MathUtils.smoothstep(seconds,13,17);
      portrait.position.set(narrow?0:1.15,narrow?1.4:.35,0);
      portrait.scale.setScalar(narrow?.78:.9);
      const chapter=Math.max(0,Math.min(7,Math.floor((seconds-20)/11)));
      yearPlanes.forEach((plane,i)=>{plane.material.opacity=seconds<20?0:i===chapter?.65:.045;plane.position.set(narrow?0:i===chapter?-2.1:i%2?-4.7:4.7,narrow?3.7:i===chapter?1.65:.7+(i%3)*.8,i===chapter?-.5:-2-(i%3)*.7);});
      rings.forEach((ring,i)=>{ring.rotation.z=(reduced?0:seconds*.008)*(i%2?-1:1)+i*.3;});renderer.render(scene,camera);
      host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.seconds=seconds.toFixed(2);host.dataset.scene=seconds<12?'orbit':seconds<20?'portrait-reveal':seconds<108?'life-story':'ending';
    }
    function resize(){if(disposed)return;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5,Math.sqrt(1800000/(w*h))));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();render(current,currentReduced);}
    resize();return {render,resize,dispose};
  }catch(error){dispose();throw error;}
}
