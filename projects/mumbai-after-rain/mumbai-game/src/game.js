import {Reflector} from 'three/addons/objects/Reflector.js';
import {route} from './route.js';
import {buildCity} from './city.js';
import {createVehicle} from './vehicles.js';

const clamp = (x,a,b) => Math.min(b,Math.max(a,x));
const TAU = Math.PI * 2;
const positionAt = (s,lane) => {
  const p = route.sample(s);
  return {...p, x:p.x+p.nx*lane, z:p.z+p.nz*lane};
};
function ribbon(T, first,last,a,b,step=1.3) {
  const positions=[], indices=[], laneDistances=[];
  const count=Math.ceil((last-first)/step);
  for(let i=0;i<=count;i++){
    const s=first+(last-first)*i/count;
    for(const lane of [a,b]){
      const p=positionAt(s,lane);
      positions.push(p.x,-p.z,0);laneDistances.push(s,lane);
    }
    if(i<count){const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute("roadCoord",new T.Float32BufferAttribute(laneDistances,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function buildRoad(T,scene){
  const src=Reflector.ReflectorShader;
  const shader={...src, uniforms:{...src.uniforms,headlight:{value:new T.Vector4()}},
    vertexShader:src.vertexShader.replace('void main()', 'attribute vec2 roadCoord; varying vec2 street; varying vec2 road; void main()').replace('vUv =','street = roadCoord; road = position.xy; vUv ='),
    fragmentShader:src.fragmentShader.replace('void main()', `
      uniform vec4 headlight; varying vec2 street; varying vec2 road;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      void main()`).replace(/vec4 base =[^;]+;\s*gl_FragColor =[^;]+;/,`
      float wet=smoothstep(.24,.79,noise(road*vec2(.73,.28))*.74+noise(road*.11)*.26);
      float grit=noise(road*22.);
      vec2 uv=vUv.xy/vUv.w;
      float f=(1.-wet)*.0035+.0007;
      uv+=vec2(noise(road*vec2(1.9,12.))-.5,grit-.5)*f;
      vec3 mirror=texture2D(tDiffuse,uv).rgb*.4+
       (texture2D(tDiffuse,uv+vec2(f,f*2.)).rgb+texture2D(tDiffuse,uv-vec2(f,f*2.)).rgb)*.3;
      float lampIndex=floor((street.x+2.)/16.);
      float side=1.-2.*mod(lampIndex,2.);
      vec2 lamp=vec2((street.x-(6.+16.*lampIndex))*.19,(street.y-side*6.6)*.22);
      float glow=exp(-dot(lamp,lamp));
      vec2 delta=vec2(road.x,-road.y)-headlight.xy;
      float longi=dot(delta,headlight.zw),lat=delta.x*headlight.w-delta.y*headlight.z;
      float beam=smoothstep(1.75,3.8,longi)*exp(-max(0.,longi-3.)*.15)*exp(-pow((abs(lat)-.68)/(.55+.12*max(longi,0.)),2.));
      vec3 asphalt=vec3(.010,.015,.023)*(.65+.55*grit);
      vec3 lights=glow*vec3(.26,.108,.035)+beam*vec3(.18,.23,.27);
      gl_FragColor=vec4(asphalt+lights*(.43+.57*wet)+mirror*(.28+.75*wet),1.);`)};
  const surface=new Reflector(ribbon(T,0,route.length,-7.5,7.5),{shader,textureWidth:256,textureHeight:384,multisample:0,clipBias:.002});
  surface.rotation.x=-Math.PI/2;scene.add(surface);
  const all=[];
  function mark(start,end,lo,hi){
    const g=ribbon(T,start,end,lo,hi,.85).toNonIndexed();
    for(const v of g.attributes.position.array)all.push(v);
    g.dispose();
  }
  for(let s=0;s<route.length-3;s+=8.4) mark(s,s+2.8,-.08,.08);
  for(const lane of [-7,7]) mark(0,route.length,lane-.065,lane+.065);
  for(const s of [39,151,226,375]){
    for(let l=-6.7;l<6.5;l+=1.03)mark(s,s+2.7,l,l+.46);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(all,3));
  const marks=new T.Mesh(g,new T.MeshBasicMaterial({color:0xa9b4b0,transparent:true,opacity:.53,depthWrite:false}));
  marks.rotation.x=-Math.PI/2;marks.position.y=.021;scene.add(marks);
  return surface.material.uniforms.headlight.value;
}
function atmosphericRain(T,scene){
  const points=[], phases=[];let seed=421;
  const rnd=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<480;i++){
    const x=(rnd()-.5)*34,z=(rnd()-.5)*34,y=rnd()*20;
    points.push(x,y,z,x+.038,y+.27,z-.012);phases.push(y,y);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));
  g.setAttribute('phase',new T.Float32BufferAttribute(phases,1));
  const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{t:{value:0}},
    vertexShader:'attribute float phase; uniform float t; void main(){vec3 p=position;p.y=mod(phase-t*13.,20.)+position.y-phase;p.x+=p.y*.12;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
    fragmentShader:'void main(){gl_FragColor=vec4(.57,.69,.75,.19);}'});
  const mesh=new T.LineSegments(g,mat);mesh.frustumCulled=false;scene.add(mesh);
  return (t,c)=>{mat.uniforms.t.value=t;mesh.position.set(c.x,0,c.z);};
}
function makeEnvironment(T,renderer){
  const sky=new T.Scene();sky.background=new T.Color(0x6f858e);
  const uniforms={};
  const box=new T.Mesh(new T.BoxGeometry(40,40,40),new T.ShaderMaterial({uniforms,side:T.BackSide,
    vertexShader:'varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 dir;void main(){vec3 d=normalize(dir);vec3 c=mix(vec3(.047,.061,.072),vec3(.56,.7,.85),smoothstep(-.12,.86,d.y));
    c+=vec3(2.6,1.72,.91)*smoothstep(.78,.98,d.x)*smoothstep(-.15,.23,d.y)*(1.-smoothstep(.31,.5,d.y));
    c+=vec3(1.5,1.7,2.)*smoothstep(.88,.99,-d.x)*smoothstep(-.1,.06,d.y)*(1.-smoothstep(.24,.37,d.y));gl_FragColor=vec4(c,1.);}`}));
  sky.add(box);
  const gen=new T.PMREMGenerator(renderer);const rt=gen.fromScene(sky,0,.1,100);gen.dispose();box.geometry.dispose();box.material.dispose();return rt.texture;
}
export function createGame(T,canvas){
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(1);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(56,1,.13,270);
  scene.background=new T.Color(0x111d32);scene.fog=new T.FogExp2(0x26384b,.011);
  const dome=new T.Mesh(new T.SphereGeometry(1,18,10),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,
    vertexShader:'varying vec3 d;void main(){d=position;vec4 p=projectionMatrix*vec4(mat3(viewMatrix)*position,1.);gl_Position=p.xyww;}',
    fragmentShader:'varying vec3 d;void main(){vec3 v=normalize(d);float h=smoothstep(-.04,.62,v.y);gl_FragColor=vec4(mix(vec3(.027,.045,.082),vec3(.002,.006,.019),h),1.);\n#include <colorspace_fragment>\n}'
  }));
  dome.frustumCulled=false;dome.renderOrder=-100;scene.add(dome);
  scene.environment=makeEnvironment(T,renderer);scene.environmentIntensity=.46;
  const hemi=new T.HemisphereLight(0x7295d6,0x403044,.63);scene.add(hemi);
  const sun=new T.DirectionalLight(0xa4bcff,.88);sun.position.set(-48,67,30);scene.add(sun);
  const floor=new T.Mesh(new T.PlaneGeometry(900,900),new T.MeshStandardMaterial({color:0x363d42,roughness:.92}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.055;scene.add(floor);
  const headlight=buildRoad(T,scene);
  const city=buildCity(T,scene,route);
  const rain=atmosphericRain(T,scene);
  const garage=new T.Scene();garage.background=new T.Color(0x172530);garage.environment=scene.environment;
  garage.add(hemi.clone(),sun.clone());
  for(const [color,power,x,y,z] of [[0xffad68,95,-3,3,2],[0x70dfff,72,3,2,-2]]){
    const softbox=new T.PointLight(color,power,16);softbox.position.set(x,y,z);garage.add(softbox);
  }
  const block=(w,h,d,x,y,z,color,emissive=false)=>{
    const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),emissive?new T.MeshBasicMaterial({color}):new T.MeshStandardMaterial({color,roughness:.66,metalness:.28}));
    mesh.position.set(x,y,z);garage.add(mesh);
  };
  block(24,.12,29,0,-.061,0,0x35444d);block(24,8,.3,0,4,-7,0x384754);
  for(let i=-10;i<=10;i+=.48)block(.05,6,.09,i,3,-6.8,0x63727a);
  for(const z of [-5,3]){block(23,.09,.12,0,3.8,z,0xffc782,true);block(23,.14,.18,0,4,z,0x28343a);}
  for(const x of [-6,6]){block(.6,6,.6,x,3,-4,0x63717a);block(.62,.22,.62,x,1.25,-4,0xd89a47);}
  for(let x=-9;x<=9;x+=3){block(.075,3.2,.08,x,2.1,-6.64,x<0?0xffa458:0x62bdeb,true);}
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=96;shadowCanvas.height=96;
  const ctx=shadowCanvas.getContext('2d'), shade=ctx.createRadialGradient(48,48,8,48,48,47);
  shade.addColorStop(0,'rgba(0,0,0,0.75)');shade.addColorStop(.68,'rgba(0,0,0,0.47)');shade.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=shade;ctx.fillRect(0,0,96,96);
  const contact=new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false});
  function withShadow(vehicle,type){
    const shadow=new T.Mesh(new T.PlaneGeometry(type==='bus'?3.05:2.45,type==='bus'?10.1:5.1),contact);
    shadow.rotation.x=-Math.PI/2;shadow.position.y=.024;vehicle.group.add(shadow);return vehicle;
  }
  let player,display,paint;
  const trafficSpec=[['taxi',1,33,-3.8],['bus',1,103,-3.55],['auto',1,185,-3.7],['taxi',1,292,-3.7],['bus',-1,70,3.8],['auto',-1,138,3.55],['taxi',-1,239,3.6],['bus',-1,382,3.75]];
  const traffic=trafficSpec.map(([type,dir,offset,lane])=>{
    const model=withShadow(createVehicle(T,type),type);scene.add(model.group);
    return {model,type,dir,offset,lane:-lane,s:offset,v:0};
  });
  function setPaint(value='#b1bdc5'){
    if(value===paint)return;
    paint=value;
    if(player){scene.remove(player.group);garage.remove(display.group);}
    player=withShadow(createVehicle(T,'coupe',paint),'coupe');display=withShadow(createVehicle(T,'coupe',paint),'coupe');
    scene.add(player.group);garage.add(display.group);
  }
  setPaint();
  const live={};let mode='';
  function reset(){
    Object.assign(live,{s:0,lane:3.7,v:0,t:0,heading:0,steer:0});
    traffic.forEach(a=>{a.s=a.offset;a.v=a.dir>0?8:9;});mode='play';
  }
  reset();
  function pose(model,s,lane,dir,time,brake=0,steer=0,heading=0){
    const p=positionAt(s,lane);
    model.group.position.set(p.x,.035,p.z);
    model.group.rotation.y=p.angle+(dir<0?Math.PI:0)+heading;
    const q=route.sample(s+1);
    const curve=Math.atan2(Math.sin(q.angle-p.angle),Math.cos(q.angle-p.angle));
    const cumulativeAngle=Math.floor(s/route.length)*TAU+p.angle;
    model.update?.((s-lane*cumulativeAngle)*dir,steer+dir*curve*2.55,brake,time);
    return p;
  }
  const v3=new T.Vector3();
  function shot(s,lane,back,side,height,look,lookHeight,fov){
    const p=positionAt(s,lane),a=positionAt(s+look,lane);
    camera.position.set(p.x-p.tx*back+p.nx*side,height,p.z-p.tz*back+p.nz*side);
    camera.lookAt(v3.set(a.x,lookHeight,a.z));camera.fov=fov;camera.updateProjectionMatrix();
  }
  function state(s,v,t){
    const d=route.wrap(s);
    const area=d<55?'REGAL CINEMA':d<90?'COLABA CAUSEWAY':d<155?'RAILWAY VIADUCT':d<246?'CRAWFORD MARKET':d<350?'MARINE LINES':'CHURCHGATE';
    return {speed:Math.round(v*3.6),progress:d/route.length,distance:Math.max(0,Math.round(s)),area,gear:clamp(Math.ceil(v/4.5),1,6),lap:Math.max(1,1+Math.floor(s/route.length)),time:t};
  }
  function draw(t,p){
    headlight.set(p.x,p.z,p.tx,p.tz);rain(t,p);city?.update?.(t);renderer.render(scene,camera);
  }
  function film(time){
    mode='film';
    const t=clamp(time,0,56);
    if(t>=4 && t<8.5){
      const a=1.02-(t-4)*.19;
      camera.position.set(Math.sin(a)*9.6,1.36+(t-4)*.07,Math.cos(a)*9.6);
      camera.lookAt(0,.68,0);camera.fov=48;camera.updateProjectionMatrix();display.update?.(0,0,0,t);
      renderer.render(garage,camera);return state(0,0,t);
    }
    const drive=t<4?t:t-4.5;
    const s=-45+drive*8.75+4.8*Math.sin(drive*.32)-2.1*Math.sin(drive*.67);
    const speed=8.75+1.536*Math.cos(drive*.32)-1.407*Math.cos(drive*.67);
    const p=pose(player,s,3.7,1,t);
    traffic.forEach(a=>pose(a.model,a.dir>0?s+a.offset+3.4*Math.sin(drive*.21+a.offset):a.offset-drive*8.8+2.5*Math.sin(drive*.24+a.offset),a.lane,a.dir,t));
    if(t<4)shot(s,3.7,-7.7+t*.32,-2.75-t*.17,1.22+t*.09,-.35,.74,55);
    else if(t>=11.7 && t<15.1){
      const slide=(t-11.7)/3.4;
      const eye=positionAt(3+2.1*slide,-3.6-1.5*slide);
      const poster=positionAt(26,-7.25);
      camera.position.set(eye.x,3.6+.32*slide,eye.z);
      camera.lookAt(poster.x+.5,7.25,poster.z);camera.fov=49;camera.updateProjectionMatrix();
    }
    else if(t<20)shot(s,3.7,7.5,.45,2.85,3.3,.85,57);
    else if(t<29)shot(s,3.7,-.60,.02,1.43,22,1.62,66);
    else if(t<40)shot(s,3.7,4.4+(t-29)*.23,-4.7+(t-29)*.09,1.34+(t-29)*.09,.22,.76,62);
    else if(t<49)shot(s,3.7,7.65,.22,3.05,3.6,.87,58);
    else shot(s,3.7,7.6+(t-49)*1.16,1.0+(t-49)*.35,3.2+(t-49)*.74,4,1,54);
    draw(t,p);return state(s,speed,t);
  }
  function playStep(dt,keys={}){
    if(mode!=='play')reset();
    const pressed=(...codes)=>codes.some(k=>keys.has?.(k)||keys[k]);
    const throttle=pressed('KeyW','ArrowUp','w','up','accelerate'),brake=pressed('Space','KeyS','ArrowDown','s','down','brake');
    const turn=Number(pressed('KeyD','ArrowRight','d','right'))-Number(pressed('KeyA','ArrowLeft','a','left'));
    const interval=clamp(dt||0,0,.15),count=Math.max(1,Math.ceil(interval/.0167)),h=interval/count;
    for(let i=0;i<count;i++){
      const l=live;l.t+=h;l.v=clamp(l.v+h*((throttle?5.9:0)-(brake?12:0)-.43-.008*l.v*l.v),0,24);
      l.steer+=(-turn*.40-l.steer)*(1-Math.exp(-h*7));
      l.heading=clamp(l.heading+(l.steer*l.v*.24-l.heading*2.5)*h,-.46,.46);
      const lane=clamp(l.lane+Math.sin(l.heading)*l.v*h,1.15,6.24);
      if(Math.abs(lane-l.lane)<1e-6 && turn)l.heading*=Math.exp(-5*h);
      let move=l.v*Math.cos(l.heading)*h;
      let allowLane=true;
      for(const a of traffic){
        if(a.dir<0)continue;
        const separation=route.wrap(a.s-l.s+route.length/2)-route.length/2;
        const clearance=a.type==='bus'?8.7:5.5;
        if(Math.abs(a.lane-lane)>2.2)continue;
        if(Math.abs(separation)<clearance) allowLane=false;
        if(separation>=0 && separation<clearance+move){
          move=Math.min(move,Math.max(0,separation-clearance));l.v=Math.min(l.v,a.v);
        }
      }
      if(allowLane)l.lane=lane;l.s+=move;
      for(const a of traffic){
        const target=a.dir>0?8:9;
        a.v=Math.min(target,a.v+2*h);let advance=a.v*h;
        if(a.dir>0){
          const gap=route.wrap(l.s-a.s);
          if(Math.abs(l.lane-a.lane)<2.3)advance=Math.min(advance,Math.max(0,gap-(a.type==='bus'?8.7:5.5)));
          for(const b of traffic)if(b!==a&&b.dir>0)advance=Math.min(advance,Math.max(0,route.wrap(b.s-a.s)-12));
          if(h>0)a.v=advance/h;
        }
        a.s+=advance*a.dir;
      }
    }
    const l=live,p=pose(player,l.s,l.lane,1,l.t,Number(brake),l.steer,l.heading);
    traffic.forEach(a=>pose(a.model,a.s,a.lane,a.dir,l.t,Number(a.v<1)));
    shot(l.s,l.lane,7.5,0,2.7,3.2,.9,56+l.v*.17);
    draw(l.t,p);return state(l.s,l.v,l.t);
  }
  function resize(w,h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  return {film,playStep,reset,resize,setPaint,renderer};
}



