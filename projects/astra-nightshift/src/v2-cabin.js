// Two monsoon cutscenes. The train, glass, wiper, road reflections and cabin illumination
// all respond to scene time; the commuter carriages are independent of the bridge plate.
(() => {
  const W = 1080, H = 1920;
  const scene = {};
  window.cabinV2Ready = Promise.all(['pilot', 'bridge', 'train'].map(async name => {
    const image = new Image();
    image.src = 'public/v2-cabin/' + name + '.webp';
    await image.decode();
    scene[name] = image;
  }));
  const clamp = x => Math.min(1, Math.max(0,x));
  const smooth = x => {x=clamp(x); return x*x*(3-2*x);};
  const mod = (x,y) => ((x%y)+y)%y;
  const lerp = (x,y,a) => x+(y-x)*a;
  function rng(seed) {
    return function () {seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296;};
  }
  const rand=rng(943);
  const drops=Array.from({length:210},()=>({x:rand()*W,y:rand()*H*.86,r:1+rand()**2*8.8,s:4+rand()**3*83,f:rand()*6.28}));
  function plate(ctx,image) {
    const scale = Math.max(W/image.width,H/image.height);
    const w = image.width*scale, h=image.height*scale;
    ctx.drawImage(image,(W-w)/2,(H-h)/2,w,h);
  }
  function path(ctx,pts) {
    ctx.beginPath();ctx.moveTo(...pts[0]);
    pts.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();
  }
  function wiperAngle(t) {
    const u = mod(t+.14,2.04);
    if(u<.81)return lerp(-.19,-1.94,smooth(u/.81));
    if(u<1.57)return lerp(-1.94,-.19,smooth((u-.81)/.76));
    return -.19;
  }
  const pivotX=101,pivotY=1636;
  function glass(ctx,t,wiping) {
    const a=wiperAngle(t);
    // Trace recent sweeps to keep the cleared sector attached to the moving blade at any seek.
    const angles = Array.from({length:21},(_,i)=>wiperAngle(t-i*.038));
    for (const drop of drops) {
      const y = mod(drop.y + t * drop.s, 1645);
      const x = drop.x + 4 * Math.sin(drop.f+.8*t);
      let amount=1;
      if(wiping) {
        const theta=Math.atan2(y-pivotY,x-pivotX);
        const d=Math.hypot(y-pivotY,x-pivotX);
        if(d>308 && d<1450 && theta<-0.15 && theta>-1.99){
          const i=angles.findIndex((ang,j)=>j>0 && theta >= Math.min(ang,angles[j-1])-.035 && theta <= Math.max(ang,angles[j-1])+.035);
          if(i>=0)amount=.04+.010*i;
        }
      }
      const r=drop.r;
      ctx.fillStyle='rgba(7,20,22,'+(amount*.30)+')';
      ctx.beginPath();ctx.ellipse(x,y+r*.25,r,r*(1.24+drop.s*.006),-.13,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(248,225,167,'+(amount*(r>4?.42:.29))+')';
      ctx.lineWidth=Math.max(.9,r*.24);
      ctx.beginPath();ctx.ellipse(x,y,r*.84,r*1.17,-.13,.3,1.92);ctx.stroke();
      ctx.fillStyle='rgba(207,235,232,'+(amount*.60)+')';
      ctx.beginPath();ctx.ellipse(x-r*.23,y-r*.49,Math.max(.5,r*.23),Math.max(.6,r*.37),.3,0,Math.PI*2);ctx.fill();
    }
    return a;
  }
  function drawWiper(ctx,angle) {
    ctx.save();ctx.translate(pivotX,pivotY);ctx.rotate(angle);
    // The rubber blade sits on an offset frame connected to a steel crank arm.
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.strokeStyle='rgba(2,6,8,.54)';ctx.lineWidth=27;
    ctx.beginPath();ctx.moveTo(9,6);ctx.lineTo(535,3);ctx.lineTo(733,-28);ctx.stroke();
    ctx.strokeStyle='#14191b';ctx.lineWidth=17;
    ctx.beginPath();ctx.moveTo(8,2);ctx.lineTo(533,-3);ctx.lineTo(733,-31);ctx.stroke();
    ctx.strokeStyle='#777b75';ctx.lineWidth=2.3;
    ctx.beginPath();ctx.moveTo(17,-5);ctx.lineTo(524,-9);ctx.lineTo(720,-34);ctx.stroke();
    ctx.strokeStyle='#12181a';ctx.lineWidth=11;
    ctx.beginPath();ctx.moveTo(472,-34);ctx.quadraticCurveTo(849,-58,1384,-39);ctx.stroke();
    ctx.strokeStyle='#536265';ctx.lineWidth=2.2;
    ctx.beginPath();ctx.moveTo(483,-38);ctx.quadraticCurveTo(844,-59,1378,-42);ctx.stroke();
    ctx.restore();
  }
  function train(ctx,t) {
    const im=scene.train, width=826, height=186;
    const left=1105 - (t+.50)*539;
    const baseline=756;
    // The lead car uses the cab, middle coaches use the side body, and the last cab faces homeward.
    const coaches=4, bodyStart=.115*im.width;
    for(let i=coaches-1;i>=0;i--){
      const bodyWidth=width*(1-.115), x=left+(i ? width+(i-1)*(bodyWidth-2)-2 : 0);
      if(x>W+110 || x+width<-110)continue;
      const y=baseline-height+1.15*Math.sin(t*12+i*.51);
      if(i===0){ctx.drawImage(im,x,y,width,height);}
      else if(i===coaches-1){ctx.save();ctx.translate(x+width,y);ctx.scale(-1,1);ctx.drawImage(im,0,0,width,height);ctx.restore();}
      else{ctx.drawImage(im,bodyStart,0,im.width-bodyStart,im.height,x,y,bodyWidth,height);}
    }
  }
  function road(ctx,t) {
    const z=1+.042*t;
    ctx.save();ctx.translate(567,942);ctx.scale(z,z);ctx.translate(-567,-942);
    plate(ctx,scene.bridge);train(ctx,t);
    // Amber headlamps skim the puddles around the approaching taxi.
    ctx.save();ctx.globalCompositeOperation='screen';
    const lamp = (x,y,r,power)=>{
      const bloom=ctx.createRadialGradient(x,y,0,x,y,r);
      bloom.addColorStop(0,'rgba(255,207,111,'+power+')');
      bloom.addColorStop(.18,'rgba(255,169,55,'+(.44*power)+')');bloom.addColorStop(1,'rgba(220,84,19,0)');
      ctx.fillStyle=bloom;ctx.fillRect(x-r,y-r,2*r,2*r);
    };
    const power=.24 + .27*(.5+.5*Math.sin(2.9*t-.4));
    lamp(274,1171,67,power);lamp(332,1170,72,power*.9);
    ctx.restore();ctx.restore();
    // A fixed foreground section separates the cockpit from the approaching world.
    ctx.save();path(ctx,[[0,1622],[148,1602],[358,1606],[557,1616],[758,1600],[867,1584],[1080,1595],[1080,H],[0,H]]);ctx.clip();plate(ctx,scene.bridge);ctx.restore();
    ctx.save();ctx.beginPath();ctx.rect(0,0,W,1641);ctx.clip();
    const a=glass(ctx,t,true);drawWiper(ctx,a);ctx.restore();
  }
  function pilot(ctx,t) {
    const p=scene.pilot;
    const shift=smooth((t-.26)/.48)*(1-smooth((t-1.32)/.70));
    ctx.save();ctx.translate(738,650);const z=1.006+.011*t;ctx.scale(z,z);ctx.translate(-738,-650);
    plate(ctx,p);
    // The grip and leather shift boot lean into gear, held at the wrist and dashboard edges.
    // Consecutive horizontal strips avoid separating the hand from the sleeve.
    ctx.save();path(ctx,[[20,1488],[72,1408],[199,1348],[365,1340],[576,1418],[629,1470],[570,1562],[422,1606],[303,1703],[38,1699]]);ctx.clip();
    const scale = H/p.height, origin=(W-p.width*scale)/2;
    for(let y=1330;y<1710;y+=4) {
      const bell = Math.sin(Math.PI*clamp((y-1330)/380));
      const dx=-16*shift*bell*bell, dy=5.8*shift*bell;
      ctx.drawImage(p,0,(y-dy)/scale,p.width,4.8/scale,origin+dx,y,p.width*scale,4.8);
    }
    ctx.restore();
    // A reflection from an oncoming car traverses the side glass while the driver changes gear.
    ctx.save();path(ctx,[[0,111],[76,137],[261,239],[394,384],[142,844],[0,824]]);ctx.clip();
    glass(ctx,t,false);
    const xx=-329+t*515, sweep=ctx.createLinearGradient(xx,0,xx+114,0);
    sweep.addColorStop(0,'rgba(255,168,64,0)');sweep.addColorStop(.57,'rgba(255,190,89,.18)');sweep.addColorStop(.65,'rgba(246,213,146,.3)');sweep.addColorStop(1,'rgba(255,165,77,0)');
    ctx.fillStyle=sweep;ctx.fillRect(0,120,440,811);ctx.restore();
    // Light from the same passing headlamp falls across the passenger compartment and her cheek.
    ctx.globalCompositeOperation='soft-light';
    const strength=.42*Math.exp(-((t-1.43)**2)/.29);
    const g=ctx.createRadialGradient(770,661,25,684,764,650);
    g.addColorStop(0,'rgba(255,202,100,'+strength+')');g.addColorStop(.65,'rgba(250,151,64,'+strength*.60+')');g.addColorStop(1,'rgba(249,151,63,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.restore();
  }
  window.paintCabinV2=(canvas,t,mode)=>{
    const ctx=canvas.getContext('2d');ctx.save();
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    ctx.fillStyle='#09171c';ctx.fillRect(0,0,W,H);
    if (scene.pilot && scene.bridge && scene.train) {
      if(mode==='pilot')pilot(ctx,Math.max(0,t));else road(ctx,Math.max(0,t));
    }
    ctx.restore();
  };
})();
