/* NIGHTSHIFT. Original perspective renderer for a rain-slick expressway.
   The surface atlas, buildings, rain and bodywork are generated locally. */
(() => {
  "use strict";
  const W = 540, H = 960, TAU = 2 * Math.PI;
  const lerp = (a,b,p) => a + (b-a)*p;
  const clamp = (v,lo,hi) => Math.max(lo,Math.min(v,hi));
  function hash(...keys) {
    let h = 2166136261;
    for (const key of keys) { h = Math.imul(h ^ (key|0),16777619); h ^= h >>> 15; }
    h = Math.imul(h ^ h >>> 13, 1597334677);
    return ((h ^ h >>> 15) >>> 0) / 4294967296;
  }
  function surface(w,h) { const c = document.createElement("canvas"); c.width=w; c.height=h; return c; }
  const facades=[], signs=[];
  let cloudTile, asphalt;
  const accents = ["#ffb454","#8dd5d4","#ff8762","#b4d6ed","#e5d8a4","#eedaa7"];
  const signWords = [
    ["\u5730\u4e0b\u9244","METRO / EAST"],["\u591c\u884c","NIGHT SERVICE"],["\u4e2d\u592e","CENTRAL"],["\u6c7d\u4fee","SERVICE BAY"],
    ["\u96fb\u529b","POWER GRID"],["\u6e2f\u6e7e","PORT AUTH."],["\u30db\u30c6\u30eb","HOTEL 47"],["\u6620\u756b","CINEMA"],["03","LINE THREE"]
  ];
  function atlases() {
    if (facades.length) return;
    for(let n=0;n<12;n++) {
      const img=surface(256,640), c=img.getContext("2d");
      const g=c.createLinearGradient(0,0,256,0);
      g.addColorStop(0,"#273a41"); g.addColorStop(.12,"#18242e"); g.addColorStop(.58,"#25333c"); g.addColorStop(1,"#142129");
      c.fillStyle=g; c.fillRect(0,0,256,640);
      const cols=6+(n%5), rows=21+(n%3)*2, bw=256/cols,bh=640/rows;
      for(let r=0;r<rows;r++){
        for(let col=0;col<cols;col++){
          const a=hash(n,r,col), b=hash(n+40,r,col), x=col*bw+3,y=r*bh+3;
          c.fillStyle="#0d1822"; c.fillRect(x,y,bw-5,bh-6);
          const lit=a>.52;
          c.fillStyle=lit ? (b>.77?"#d3a570":b>.44?"#739b9b":"#adbdad") : (b>.5?"#354349":"#23323c");
          c.globalAlpha=lit ? .45+.52*hash(n,r+7,col) : 1;
          c.fillRect(x+1,y+1,bw-8,(bh-9)*(a>.78?.43:.82));
          c.globalAlpha=1; c.fillStyle="rgba(10,15,22,.8)"; c.fillRect(x+bw*.49,y+1,2,bh-7);
          if(lit&&b>.6) {c.fillRect(x+4+bw*.24,y+bh*.35,3,bh*.3); c.fillRect(x+4,y+5,bw-9,1);}
          if(r%5===2 && b>.6){c.fillStyle="#4f595b";c.fillRect(x+1,y+bh-6,bw*.7,5);c.fillStyle="#17252c";c.fillRect(x+5,y+bh-5,bw*.47,1);}
        }
        c.fillStyle="#101b25";c.fillRect(0,r*bh,256,2);
      }
      for(let k=0;k<10;k++){const x=hash(n,k,88)*256;c.fillStyle=k%3?"#17252e":"#3b494d";c.fillRect(x,0,k%3?1.5:3,640);}
      // A street-level retail strip behind a thick service canopy.
      c.fillStyle="#111b22";c.fillRect(0,583,256,57);
      for(let j=0;j<5;j++){let x=j*52;c.fillStyle=j%2?"#455854":"#514b40"; c.fillRect(x+3,598,44,38);c.fillStyle="#a8976b";c.fillRect(x+5,602,40,3);c.fillStyle="#17222b";c.fillRect(x+20,598,4,41);}
      facades.push(img);
    }
    // Fine, anisotropic wet tarmac. The texture is locked to road distance.
    asphalt=surface(256,256);
    const tc=asphalt.getContext("2d"),pixels=tc.createImageData(256,256);
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){
      const n=hash(x,y,997),n2=hash(x>>2,y>>1,3),idx=4*(x+y*256);
      pixels.data[idx]=pixels.data[idx+1]=pixels.data[idx+2]=128+(n-.5)*88+(n2-.5)*34;
      pixels.data[idx+3]=255;
    }
    tc.putImageData(pixels,0,0);
    cloudTile=surface(256,168);
    const cc=cloudTile.getContext("2d");
    for(let k=0;k<85;k++){
      const x=36+hash(k,20)*181,y=43+Math.sin(x/37)*16+hash(k,9)*55,r=14+hash(k,3)*28;
      const g=cc.createRadialGradient(x,y,1,x,y,r);
      g.addColorStop(0,"rgba(157,183,183,.07)");g.addColorStop(1,"rgba(157,183,183,0)");
      cc.fillStyle=g;cc.fillRect(x-r,y-r,r*2,r*2);
    }
    signWords.forEach(([word,subtitle],i)=>{
      const img=surface(144,248),c=img.getContext("2d"), ac=accents[i%accents.length];
      c.fillStyle="#141d20";c.fillRect(0,0,144,248);
      c.strokeStyle=ac;c.lineWidth=3;c.strokeRect(5,5,134,238);
      c.fillStyle=ac;c.fillRect(13,14,48,4);c.fillRect(124,14,7,4);
      c.textAlign="center";c.textBaseline="middle";c.font='bold 57px "Yu Gothic", "Microsoft YaHei", sans-serif';
      const chars=Array.from(word), step=146/chars.length;
      c.shadowColor=ac;c.shadowBlur=6;
      chars.forEach((ch,k)=>c.fillText(ch,72,45+step*(k+.5),115));c.shadowBlur=0;
      c.fillRect(13,207,118,1);c.font="bold 11px Consolas, monospace";c.fillText(subtitle,72,225,120);
      signs.push(img);
    });
  }
  const streets = new Map();
  function block(i,side) {
    const key=i*2+(side===1?1:0);
    if(streets.has(key)) return streets.get(key);
    const h=(j)=>hash(i,side,j), item={z:i*14,x:side*(7.6+h(1)*2.3),depth:10+3*h(2),width:4+h(3)*7,height:9+Math.pow(h(4),.65)*31,
      atlas:Math.floor(h(5)*12),sign:Math.floor(h(6)*9), signY:4+h(7)*7, signH:3+h(8)*3, signW:1.2+1.1*h(9),side};
    streets.set(key,item);return item;
  }
  function quad(c,points,color){
    c.fillStyle=color;c.beginPath();c.moveTo(points[0][0],points[0][1]);for(let j=1;j<points.length;j++)c.lineTo(points[j][0],points[j][1]);c.closePath();c.fill();
  }
  function wire(c,a,b,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}
  function glow(c,x,y,rx,ry,rgb,strength) {
    if(rx<.3||ry<.3||x+rx<0||x-rx>W||y+ry<0||y-ry>H)return;
    c.save();c.translate(x,y);c.scale(rx,ry);
    const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba('+rgb+','+strength+')');g.addColorStop(.19,'rgba('+rgb+','+strength*.5+')');g.addColorStop(1,'rgba('+rgb+',0)');
    c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
  }
  // Upright planes project to vertical screen edges. Splitting their depth axis
  // keeps lettering, windows and signs perspective-correct at street level.
  function plane(c,tex,pr,a,b,low,high,parts,fog){
    for(let j=0;j<parts;j++){
      const s=j/parts,e=(j+1)/parts;
      const l=pr(lerp(a[0],b[0],s),high,lerp(a[1],b[1],s)),r=pr(lerp(a[0],b[0],e),high,lerp(a[1],b[1],e));
      const bl=pr(lerp(a[0],b[0],s),low,lerp(a[1],b[1],s)),br=pr(lerp(a[0],b[0],e),low,lerp(a[1],b[1],e));
      if(!l||!r||!bl||!br)continue;
      if(Math.max(l[0],r[0])<0||Math.min(l[0],r[0])>W||Math.max(l[1],r[1],bl[1],br[1])<0||Math.min(l[1],r[1],bl[1],br[1])>H)continue;
      const sw=tex.width/parts,sh=tex.height;
      const width=r[0]-l[0],dy=r[1]-l[1],dh=(br[1]-r[1]+bl[1]-l[1])*.5;
      // Both verticals converge close to the vanishing point. Use two exact affine triangles.
      function tri(bottom) {
        const p=bottom?[br,bl,l]:[l,r,br];
        c.save();c.beginPath();p.forEach((q,k)=>k?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.clip();
        if(bottom)c.transform(width/sw,(br[1]-bl[1])/sw,0,(bl[1]-l[1])/sh,l[0],l[1]);
        else c.transform(width/sw,dy/sw,0,(br[1]-r[1])/sh,l[0],l[1]);
        c.drawImage(tex,s*tex.width,0,sw,sh,0,0,sw,sh);c.restore();
      }
      if(Math.abs(dy)<.3||Math.abs(br[1]-bl[1]-(r[1]-l[1]))<.8) {
        c.save();c.transform(width/sw,dy/sw,0,dh/sh,l[0],l[1]);c.drawImage(tex,s*tex.width,0,sw,sh,0,0,sw,sh);c.restore();
      } else {tri(false);tri(true);}
      if(fog>.015) quad(c,[l,r,br,bl],'rgba(75,104,113,'+fog+')');
    }
  }
  // Closed loft rings let the haunches, roof, rear fascia and the shoulders
  // retain their geometry as the camera crosses the centerline.
  function car(pr,c,state,t,hood) {
    const q=[], xx=state.carX, zz=state.travel, turn=Math.sin(t*.91)*.045;
    const sn=Math.sin(turn),cs=Math.cos(turn);
    function p(pt){let [x,y,z]=pt;return [xx+x*cs+z*sn,y,zz+z*cs-x*sn];}
    function face(verts,color,edge){
      const pp=verts.map(p),pts=pp.map(v=>pr(...v));if(pts.includes(null))return;
      const dep=pp.reduce((a,v)=>a+(v[2]-state.cz)*state.cyaw+(v[0]-state.cx)*state.syaw,0)/pp.length;
      q.push({pts,color,edge,dep});
    }
    function part(verts,fill){face(verts,fill);}
    function sideRect(side,z1,z2,y1,y2,x,color){part([[side*x,y1,z1],[side*x,y1,z2],[side*x,y2,z2],[side*x,y2,z1]],color);}
    // Body sections: z, half-width, sill height, shoulder, crown.
    const loft=[[-2.25,.86,.26,.65,.72],[-2.08,1.03,.20,.78,.83],[-1.72,1.09,.18,.87,.90],[-1.18,1.075,.18,.93,.94],[-.57,1.00,.17,.84,.89],[.4,.99,.17,.74,.79],[1.13,1.055,.18,.75,.79],[1.78,1.03,.19,.66,.73],[2.18,.85,.23,.50,.60]];
    const ring=([z,w,bot,sh,top])=>[[-w*.89,bot,z],[-w,bot+.14,z],[-w,sh-.105,z],[-w*.92,sh,z],[-w*.68,top,z],[0,top+.035,z],[w*.68,top,z],[w*.92,sh,z],[w,sh-.105,z],[w,bot+.14,z],[w*.89,bot,z]];
    const rings=loft.map(ring);
    // Metallic shoulder reflections and side glazing carry the cyan/amber light
    // of the street across the car as the camera angle changes.
    function metallic(points,col,k,segment){
      const projected=points.map(v=>pr(...p(v)));
      if(projected.some(v=>!v))return col;
      const a=projected[0],b=projected[3],mid=clamp(.50+.18*Math.sin(t*.80+segment*.33),.19,.8);
      if(Math.hypot(a[0]-b[0],a[1]-b[1])<.3)return col;
      const grad=c.createLinearGradient(a[0],a[1],b[0]+.01,b[1]+.01);
      grad.addColorStop(0,col);grad.addColorStop(mid,k%2?"#c3d1cf":"#abb9b8");
      grad.addColorStop(1,k===6||k===3?"#e4d1b5":col);
      return grad;
    }
    const shades=["#151f26","#52616a","#a1a8a5","#d4cfba","#858e93","#94a2a0","#c3bb9f","#777e7c","#374247","#192328"];
    for(let z=0;z<rings.length-1;z++)for(let k=0;k<10;k++) {
      let col=shades[k];if((z===1||z===2)&&k===2)col="#f0a073";
      const pts=[rings[z][k],rings[z+1][k],rings[z+1][k+1],rings[z][k+1]];
      part(pts,k>=2&&k<=7?metallic(pts,col,k,z):col);
    }
    part(rings[0],"#2c373c");part(rings[rings.length-1],"#596264");
    // Glasshouse from the broad swept rear glass up over an integrated roof to windscreen.
    const cab=[[-1.45,.79,.94],[-.45,.65,1.40],[.40,.62,1.39],[1.13,.74,.80]];
    const cabin=cab.map(([z,w,h])=>[[-.88,.84,z],[-w,h-.055,z],[-w*.72,h,z],[w*.72,h,z],[w,h-.055,z],[.88,.84,z]]);
    const colors=[["#15313b","#324750","#304249","#405659","#203138"],["#1b333e","#a7b6af","#a7aba1","#788c8b","#142934"],["#112b34","#405c65","#38525c","#3d5252","#122b32"]];
    for(let j=0;j<3;j++)for(let k=0;k<5;k++)part([cabin[j][k],cabin[j+1][k],cabin[j+1][k+1],cabin[j][k+1]],colors[j][k]);
    // Three uninterrupted streaks glide across the swept glass.
    const glass=[[-.77,.963,-1.39],[-.65,1.348,-.57],[.65,1.348,-.57],[.77,.963,-1.39]];
    const gp=glass.map(v=>pr(...p(v)));
    if(gp.every(Boolean)){
      const gl=c.createLinearGradient(gp[0][0],gp[0][1],gp[2][0],gp[2][1]);
      gl.addColorStop(0,"#253941");gl.addColorStop(.27,"#344a51");gl.addColorStop(.36,"#778f93");gl.addColorStop(.39,"#8fa6a6");gl.addColorStop(.44,"#52676e");gl.addColorStop(.67,"#263c47");gl.addColorStop(.78,"#496169");gl.addColorStop(1,"#243741");
      part(glass,gl);
    }
    // Vent perforations run along the mid-engine deck below the rear screen.
    for(let j=0;j<5;j++){
      const z=-1.82+j*.057,yy=.91+(z+1.72)*.07;
      for(const s of [-1,1])part([[s*.26,yy,z],[s*.62,yy,z],[s*.61,yy+.008,z+.024],[s*.26,yy+.008,z+.024]],"#36454b");
    }
    for(let k=0;k<9;k++){const z=-1.34+k*.084,y=lerp(.979,1.38,(z+1.45)/1.0),w=lerp(.74,.61,(z+1.45)/1.0);
      part([[-w,y,z],[w,y,z],[w-.005,y+.011,z+.017],[-w+.005,y+.011,z+.017]],k%3===0?"#638083":"#455a5d");}
    // The rear brake bar curves out to the quarters, with a second optical core.
    const rear=-2.261;
    part([[-.90,.68,rear],[-.72,.53,rear],[.72,.53,rear],[.90,.68,rear]],"#10191f");
    part([[-.80,.43,rear],[-.67,.27,rear],[.67,.27,rear],[.8,.43,rear]],"#0e151a");
    for(let i=-7;i<=7;i++)part([[i*.098-.014,.257,rear-.011],[i*.098+.012,.257,rear-.011],[i*.098+.012,.385,rear-.010],[i*.098-.014,.385,rear-.010]],"#566062");
    for(const s of [-1,1]){
      sideRect(s,-2.07,-1.54,.748,.783,1.033,"#fd724a");
      sideRect(s,-.73,.49,.275,.303,1.004,"#869593");
      // Side intake, roof-edge mirror and carbon rear-view pod.
      part([[s*1.006,.77,-.84],[s*1.064,.67,-.86],[s*1.02,.40,-.35],[s*1.005,.67,-.49]],"#19262c");
      part([[s*.81,1.0,.64],[s*1.08,1.02,.52],[s*1.08,1.10,.62],[s*.85,1.06,.70]],"#afb7ac");
      for(const wz of [-1.34,1.30]){
        const wx=s*1.045, r=.365;
        for(let j=0;j<24;j++){const a=TAU*j/24,b=TAU*(j+1)/24;
          function wp(rad,an,dx=0){return [wx+s*dx,.385+Math.sin(an)*rad,wz+Math.cos(an)*rad];}
          part([wp(r,a),wp(r,b),wp(r*.70,b,.009),wp(r*.70,a,.009)],j<11?"#0e1820":"#20272b");
          part([wp(r*.68,a,.014),wp(r*.68,b,.014),wp(.04,b,.015),wp(.04,a,.015)],"#343e42");
          if(j%3===0)part([wp(.052,a,.02),wp(r*.64,a+.06,.024),wp(r*.64,a+.32,.024),wp(.052,b+.35,.02)],"#a3a7a1");
        }
      }
    }
    // Deck spoiler, struts and beveled leading edge.
    for(const s of [-1,1])part([[s*.65,.83,-1.98],[s*.69,1.005,-2.01],[s*.69,1.01,-1.81],[s*.65,.84,-1.80]],"#27363b");
    part([[-1.04,.995,-2.07],[1.04,.995,-2.07],[1.01,1.025,-1.84],[-1.01,1.025,-1.84]],"#808b88");
    part([[-1.04,.967,-2.075],[1.04,.967,-2.075],[1.04,.995,-2.07],[-1.04,.995,-2.07]],"#293237");
    q.sort((a,b)=>b.dep-a.dep);
    // A faint subpixel stroke seals polygons sharing a projected edge.
    for(const v of q){quad(c,v.pts,v.color);c.strokeStyle=v.color;c.lineWidth=.32;c.stroke();}
    if(!hood){
      // The luminous optic sits forward of the recessed grille. Render its
      // continuous surface after the body so coplanar depth cannot split it.
      const lightPts=[[-.84,.688],[-.68,.66],[-.20,.655],[.20,.655],[.68,.66],[.84,.688]].map(([x,y])=>pr(...p([x,y,rear-.035])));
      c.lineJoin="round";c.lineCap="round";
      for(const [width,color] of [[7,"rgba(255,48,19,.20)"],[3.8,"#fa422a"],[1.2,"#ffb187"]]){
        c.lineWidth=width;c.strokeStyle=color;c.beginPath();lightPts.forEach((a,i)=>i?c.lineTo(...a):c.moveTo(...a));c.stroke();
      }
      const plate=[[-.135,.47],[.135,.47],[.135,.402],[-.135,.402]].map(([x,y])=>pr(...p([x,y,rear-.04])));
      quad(c,plate,"#a7aa97");
      c.strokeStyle="#343d3d";c.lineWidth=.7;
      for(let k=0;k<8;k++){const px=lerp(plate[0][0],plate[1][0],.14+k*.10);c.beginPath();c.moveTo(px,plate[0][1]+2);c.lineTo(px,plate[2][1]-2);c.stroke();}
    }
    if(!hood)for(const s of [-1,0,1]){
      const pos=pr(...p([s*.68,.676,rear-.03]));if(pos)glow(c,pos[0],pos[1],s?26:56,s?10:5,"255,51,26",s?.52:.32);
    }
  }
  const backdrop=surface(W,H);
  let skyReady=false;
  function skyline(){
    if(skyReady)return;skyReady=true;
    const c=backdrop.getContext("2d"),g=c.createLinearGradient(0,0,0,565);
    g.addColorStop(0,"#101a29");g.addColorStop(.37,"#253b49");g.addColorStop(.72,"#566a75");g.addColorStop(1,"#8b9995");
    c.fillStyle=g;c.fillRect(0,0,W,H);
    glow(c,335,347,245,212,"166,200,191",.31);
    for(let k=0;k<3;k++)for(let i=0;i<49;i++){
      const x=i*14-42+hash(k,i,7)*18,y=220+hash(k,i,32)*134+k*36,w=8+hash(k,i,5)*17;
      c.fillStyle=["#566a72","#445b64","#344b56"][k];c.fillRect(x,y,w,540-y);
      if(i%3===0)c.fillRect(x+w*.49,y-11,w*.065,12);
      if(i%7===0){c.fillStyle="#e6ac88";c.fillRect(x+w*.49,y-11,1,1);}
      for(let j=0;j<16;j++)for(let a=0;a<4;a++)if(hash(i,j,k*5+a)>.67){
        c.fillStyle=hash(j,a,k)>.5?"rgba(220,198,151,.49)":"rgba(162,200,204,.37)";
        c.fillRect(x+2+a*w*.21,y+4+j*6,1.3,1.6);}
    }
  }
  function paintDrive(canvas,t,shot="chase"){
    atlases();skyline();
    const c=canvas.getContext("2d");c.save();c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    const run=shot==="run",hood=shot==="rain",travel=t*(run?15.1:10.7)+36;
    const carX=.58*Math.sin(t*.68)+.28*Math.sin(t*.24+1.1);
    const cx=carX+(run?2.25+.65*Math.sin(t*.7):hood?.12:-.82+.38*Math.sin(t*.52));
    const cz=travel+(hood?.16:run?-5.58:-6.36);
    const cy=hood?1.49:run?1.82+.17*Math.sin(t*.53):2.32+.14*Math.sin(t*.74);
    const yaw=hood?-.013+.013*Math.sin(t*.6):Math.atan2(carX-cx,(run?5.95:7.3));
    const cyaw=Math.cos(yaw),syaw=Math.sin(yaw),f=hood?425:run?585:680;
    const horizon=hood?458:run?450:458;
    const pr=(x,y,z)=>{
      const X=x-cx,Z=z-cz,dep=X*syaw+Z*cyaw;
      if(dep<.22)return null;
      return [W/2+(X*cyaw-Z*syaw)*f/dep,horizon-(y-cy)*f/dep];
    };
    function face(pts,color){const p=pts.map(a=>pr(...a));if(!p.includes(null))quad(c,p,color);}
    function rod(A,B,col,w){const a=pr(...A),b=pr(...B);if(a&&b)wire(c,a,b,col,w);}
    c.drawImage(backdrop,0,horizon-540,W,H);
    c.drawImage(cloudTile,64+Math.sin(t*.071)*15,horizon-266,340,250);
    c.drawImage(cloudTile,-59+Math.sin(t*.04)*12,horizon-178,390,182);
    // Damp asphalt. Its pale patches are projected signage, lane markers and sky.
    const road=c.createLinearGradient(0,horizon,0,H);road.addColorStop(0,"#657981");road.addColorStop(.08,"#374950");road.addColorStop(.34,"#28373e");road.addColorStop(1,"#17212b");c.fillStyle=road;c.fillRect(0,horizon,W,H-horizon);
    const start=Math.floor((cz-9)/14), end=start+16;
    // Distorted reflections of signs and facade windows carry the bright skyline
    // across the rain film. Reflection height and perspective match their source.
    c.save();c.beginPath();c.rect(0,horizon,W,H-horizon);c.clip();
    for(let i=end;i>=start;i--)for(const s of [-1,1]){
      const b=block(i,s),z=b.z+2.1;
      if(z<=cz+2)continue;
      const nx=b.x-s*.25,fx=nx-s*b.signW;
      const l=s===1?[fx,z]:[nx,z],r=s===1?[nx,z]:[fx,z];
      c.globalAlpha=.13;
      plane(c,signs[b.sign],pr,l,r,-b.signY,-(b.signY+b.signH),1,0);
      const iz=Math.max(b.z,cz+2),endZ=b.z+b.depth;
      if(iz>=endZ)continue;
      const a=s===1?[b.x,iz]:[b.x,endZ],e=s===1?[b.x,endZ]:[b.x,iz];
      c.globalAlpha=.16;
      plane(c,facades[b.atlas],pr,a,e,0,-b.height,2,0);
    }
    c.globalAlpha=1;c.restore();
    for(let i=end;i>=start;i--)for(const s of [-1,1]){
      const b=block(i,s),z=b.z+2,ac=accents[b.sign%accents.length];
      for(let j=0;j<11;j++){
        const iz=z+j*1.7,ix=s*(3.15+hash(i,s,j)*4.75);
        const sz=.04+hash(j,i,s)*.27;
        c.globalAlpha=.04+.14*hash(j,i+9,s);
        face([[ix,0,iz],[ix+sz,0,iz],[ix+sz+.10,0,iz+1.2],[ix-.06,0,iz+1.2]],ac);
      }
      c.globalAlpha=1;
    }
    for(let i=Math.floor((cz+1)/5);i<Math.ceil((cz+175)/5);i++)for(const x of [-3.65,0,3.65]){
      const z=i*5+.4;
      face([[x-.045,.003,z],[x+.045,.003,z],[x+.045,.003,z+2.1],[x-.045,.003,z+2.1]],x===0?"#b2aa8a":"#8c9996");
    }
    // Glints stretch across puddles and run with the road, never with the screen.
    for(let i=0;i<185;i++){
      const z=cz+1.4+((hash(i,4)*48-travel)%48+48)%48,x=(hash(i,3)-.5)*15;
      const p=pr(x,.014,z);if(!p||p[1]>H)continue;
      c.fillStyle=i%5===0?"rgba(227,188,143,.20)":"rgba(171,197,200,.13)";
      const len=(16+hash(i,7)*21)/(z-cz);
      c.fillRect(p[0],p[1],len,clamp(len*.14,.3,1.8));
    }
    // Perspective compression changes from subpixel grain at the skyline to
    // stretched glassy flecks beneath the lens.
    c.save();c.globalCompositeOperation="overlay";c.globalAlpha=.22;
    const scroll=((travel*9)%256+256)%256;
    for(let y=Math.floor(horizon+2);y<H;y+=6){
      const d=y-horizon, ty=Math.floor((19600/d+scroll)%256);
      const magn=clamp(d/230,.28,2.1),width=256*magn;
      for(let x=-(width*(.5+Math.sin(y*.003)*.15));x<W;x+=width)
        c.drawImage(asphalt,0,ty,256,Math.min(3,256-ty),x,y,width+.4,6);
    }
    c.restore();
    function building(b){
      const {side:s,x,z,width:w,depth:d,height:h}=b,outer=x+s*w,far=z+d;
      if(z<cz-7)return;
      const near=Math.max(z,cz+1.65), center=z+d*.45;
      if(far<near)return;
      const fog=clamp((center-cz-25)/245,0,.68),tex=facades[b.atlas],sc=pr(x,h*.55,center);
      if(!sc)return;
      if(z>cz+.8){
        const a=s===1?[x,z]:[outer,z],e=s===1?[outer,z]:[x,z];
        plane(c,tex,pr,a,e,0,h,1,fog);
        // Roof antennas, abandoned billboard gantry, AC boxes.
        for(let u=1;u<4;u++) {
          const xx=x+s*w*u*.21, hh=h+(u%2?1.2:.75);
          face([[xx,h,z+.4],[xx+s*.6,h,z+.4],[xx+s*.6,hh,z+.4],[xx,hh,z+.4]],"#354650");
        }
        if(b.atlas%3===1)rod([x+s*w*.4,h,z+.65],[x+s*w*.4,h+3.2,z+.65],"#64747a",.7);
      }
      const a=s===1?[x,near]:[x,far],e=s===1?[x,far]:[x,near];
      plane(c,tex,pr,a,e,0,h,center-cz<38?5:2,fog);
      if(z>cz+1){
        const sx=x-s*.26, zz=z+2.1, sx2=sx-s*b.signW;
        const left=s===1?[sx2,zz]:[sx,zz],right=s===1?[sx,zz]:[sx2,zz];
        const sh=b.signH, y=b.signY;
        rod([x,y+sh*.8,zz],[sx2,y+sh*.8,zz],"#263238",1.3);
        rod([x,y+sh*.2,zz],[sx2,y+sh*.2,zz],"#263238",1.3);
        plane(c,signs[b.sign],pr,left,right,y,y+sh,1,fog*.6);
        const foot=pr(sx2,y,zz),top=pr(sx2,y+sh,zz);
        if(foot&&top){const rr=Math.abs(foot[1]-top[1]);glow(c,foot[0],(foot[1]+top[1])/2,rr*.34,rr*.63,b.sign%3?"195,185,126":"254,151,54",.10);}
      }
      // Louvered awnings and luminous horizontal shop fronts break the tower grid.
      if(z>cz+1){
        const zz=z+1.2,y=2.35,farZ=z+d-.9,edge=x-s*.72;
        face([[x,y+.3,zz],[edge,y,zz],[edge,y,farZ],[x,y+.3,farZ]],"#18252c");
        rod([edge,y,zz],[edge,y,farZ],accents[(b.sign+3)%6],clamp(22/(zz-cz),.4,2.1));
        const sgn=pr(edge,y,zz);
        if(sgn){const size=clamp(140/(zz-cz),2,37);glow(c,sgn[0],sgn[1],size*1.7,size*.55,"252,175,89",.29);}
        // Service cables swing gently between adjacent tower brackets.
        if(b.atlas%3===0){
          const a=pr(x,10.5,zz),d=pr(-x*.84,9.1,zz+4.1),m=pr(0,7.6,zz+2);
          if(a&&d&&m){c.strokeStyle="#202d33";c.lineWidth=clamp(17/(zz-cz),.45,2.3);c.beginPath();c.moveTo(...a);c.quadraticCurveTo(...m,...d);c.stroke();}
        }
      }
      const pavement=x-s*1.3;
      face([[x,0,near],[x,0,far],[pavement,.12,far],[pavement,.12,near]],"#445152");
      rod([pavement,.14,near],[pavement,.14,far],"#82908d",.68);
      if(z>cz+1&&b.atlas%2===0){
        const px=x-s*.95,pz=z+3.6;
        rod([px,0,pz],[px,5.1,pz],"#263238",clamp(18/(pz-cz),.5,3.5));
        rod([px,5.1,pz],[px-s*1.3,5.45,pz],"#87918f",1.25);
        const pos=pr(px-s*1.3,5.43,pz);
        if(pos){const rad=clamp(95/(pz-cz),1.3,18);glow(c,pos[0],pos[1],rad*2.5,rad,"255,190,116",.53);c.fillStyle="#ffe6a4";c.fillRect(pos[0]-rad/2,pos[1]-1,rad,1.6);}
      }
    }
    for(let i=end;i>=start;i--){
      building(block(i,-1));building(block(i,1));
      const z=i*14+5;
      if(i%5===2&&z>cz+5){
        // Overhead railway frames articulate the camera's motion through depth.
        for(const side of [-1,1]){
          const x=side*7.45;face([[x-.13,0,z],[x+.13,0,z],[x+.13,6.5,z],[x-.13,6.5,z]],"#38474a");
        }
        face([[-7.55,6.25,z],[7.55,6.25,z],[7.55,6.68,z],[-7.55,6.68,z]],"#293b43");
        for(let k=-6;k<7;k+=2)rod([k,6.24,z],[k+1.4,6.68,z],"#698084",clamp(21/(z-cz),.6,2.3));
        for(let k=-1;k<2;k++){const sx=k*.29+.69, light=pr(sx,5.99,z);if(light){const r=clamp(15/(z-cz),.6,2.8);glow(c,light[0],light[1],r*5,r*5,"132,255,189",.49);c.fillStyle="#a4ecc6";c.beginPath();c.arc(light[0],light[1],r,0,TAU);c.fill();}}
      }
    }
    if(!hood){
      const carTail=pr(carX,0,travel-2.18),contact=pr(carX,.06,travel-.25);
      if(carTail&&contact){
        glow(c,contact[0],contact[1],run?116:118,27,"2,8,13",.95);
        glow(c,carTail[0],carTail[1]+16,run?105:119,42,"246,65,32",.17);
        for(const side of [-1,1]){
          // Twin streaks flare toward the lens. A discontinuous mirror image
          // and the sharper ripples sit atop each broad pool of red.
          const x0=carX+side*.66;
          const head=pr(x0,.005,travel-2.12),tail=pr(x0+side*.10,.005,travel-3.45);
          if(head&&tail){
            const g=c.createLinearGradient(0,head[1],0,tail[1]+18);
            g.addColorStop(0,"rgba(255,57,27,0)");g.addColorStop(.19,"rgba(249,59,30,.47)");g.addColorStop(.59,"rgba(247,59,26,.24)");g.addColorStop(1,"rgba(255,48,25,0)");
            c.save();
            for(let spread=0;spread<5;spread++){
              const a=4+spread*2.9,b=7+spread*4.1;
              c.globalAlpha=.22-spread*.027;
              quad(c,[[head[0]-a,head[1]],[head[0]+a,head[1]],[tail[0]+b,tail[1]+18],[tail[0]-b,tail[1]+18]],g);
            }
            c.restore();
            glow(c,lerp(head[0],tail[0],.48),lerp(head[1],tail[1],.48),30,Math.max(11,(tail[1]-head[1])*.66),"255,53,24",.48);
          }
          for(let i=0;i<69;i++){
            const k=hash(i,side,8),z=travel-2.18-k*1.65;
            const x=x0+side*.09*k+(hash(i,side,9)-.5)*(.13+.13*k);
            const pt=pr(x,.01,z);if(!pt)continue;
            const intensity=(1-k*.77)*(.24+.59*hash(i,4));
            c.fillStyle='rgba(255,'+Math.round(73+54*(1-k))+',54,'+intensity+')';
            c.fillRect(pt[0]-3,pt[1],1.2+hash(i,2)*11,clamp(1.15+1.1*k,1,2.35));
          }
        }
      }
      car(pr,c,{carX,travel,cz,cx,cyaw,syaw},t,false);
    }else{
      // A low bonnet camera with actual perspective on the bonnet's creases.
      const g=c.createLinearGradient(0,772,0,H);g.addColorStop(0,"#56656c");g.addColorStop(.17,"#9ba6a6");g.addColorStop(.48,"#445963");g.addColorStop(1,"#1e3442");
      quad(c,[[-80,H],[26,852],[146,818],[395,818],[510,850],[620,H]],g);
      quad(c,[[15,H],[88,862],[170,828],[102,884],[84,H]],"#69828b");
      quad(c,[[448,H],[428,873],[375,829],[471,863],[544,H]],"#77776a");
      wire(c,[104,895],[173,827],"#b6c0bc",1.15);wire(c,[438,896],[373,827],"#d2c8ae",1.15);
    }
    // Lens beads, each lit by the sky along one rim; fine rain crosses the focus plane.
    const rainCount=hood?151:74;
    c.lineCap="round";
    for(let i=0;i<rainCount;i++){
      const speed=111+hash(i,32)*220,x=(hash(i,1)*620+t*17*(.4+hash(i,9)))%620-40;
      const y=(hash(i,2)*1060+t*speed)%1060-60,l=1.6+hash(i,5)*7;
      wire(c,[x,y],[x-l*.25,y+l],"rgba(187,214,216,"+(.058+.14*hash(i,24))+")",.52+hash(i,21)*.56);
    }
    if(hood)for(let i=0;i<50;i++){
      const x=hash(i,30)*W,y=(hash(i,31)*H+Math.pow(hash(i,33),8)*t*12)%H;
      const rr=1+Math.pow(hash(i,13),2)*3.7;
      c.fillStyle="rgba(20,31,38,.37)";c.beginPath();c.ellipse(x,y,rr*.81,rr*1.22,-.19,0,TAU);c.fill();
      c.strokeStyle="rgba(226,232,222,.64)";c.lineWidth=.55;c.beginPath();c.ellipse(x,y-.25,rr*.71,rr*.99,-.19,3.55,4.95);c.stroke();
    }
    const vig=c.createRadialGradient(W*.5,H*.51,125,W*.5,H*.51,580);vig.addColorStop(0,"rgba(5,9,15,0)");vig.addColorStop(1,"rgba(1,5,13,.36)");c.fillStyle=vig;c.fillRect(0,0,W,H);
    c.restore();
  }
  window.paintDrive=paintDrive;
})();
