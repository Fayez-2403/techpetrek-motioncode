/* Mumbai monsoon race sequence. Paints a depth-warped street, independently
   tracked traffic, wet reflections, wheel spray and a two-angle hero car. */
(() => {
  'use strict';
  const W = 540, H = 960;
  const end = (v, min=0, max=1) => Math.max(min, Math.min(max, v));
  const mix = (a,b,t) => a + (b-a)*t;
  const smooth = t => { const x=end(t); return x*x*(3-2*x); };
  const assets = {};
  const names = ['regal','curb','rear','quarter','rickshaw'];
  window.roadV2Ready = Promise.all(names.map(async key => {
    const img = new Image();
    img.src = 'public/v2-road/'+key+'.webp';
    await img.decode();
    assets[key] = img;
  }));
  const bounds = {
    rear: [188,95,1162,840],
    quarter: [26,150,1460,768],
    rickshaw: [68,7,567,670]
  };
  // Broad grids at distance and narrow ground cells close to the lens keep
  // the screen-space parallax smooth without rendering an animated movie plate.
  const cols = [0,.10,.22,.36,.50,.64,.78,.90,1];
  const rows = [0,.13,.29,.40,.46,.49,.515,.54,.565,.595,.63,.68,.74,.81,.90,1];
  const textureCorners = [];
  for (let r=0;r<rows.length;r++) for (let c=0;c<cols.length;c++)
    textureCorners.push([cols[c],rows[r]]);
  function sceneCamera(t, mode) {
    const hook=mode==='hook', turn=mode==='turn', finish=mode==='cta';
    const p=end(t/(hook?3.5:turn?4:5.3));
    const drift = Math.sin((p*.89+.09)*Math.PI);
    return {
      turn, finish, p, image:hook?'regal':'curb',
      vx:hook?.512:.685, vy:hook?.512:.512,
      travel:(hook?.77:turn?.93:.60)*p,
      pan: (turn?-.09*drift+.026*p:hook?.032*Math.sin(p*4)-.024*p:-.038*p),
      roll:(turn?-.039*Math.sin(p*6.2):hook?.012*Math.sin(p*5):.009*Math.sin(p*3)),
      bob: .0017*Math.sin(t*12.7)+.0009*Math.cos(t*18)
    };
  }
  function project(u,v,cam){
    const dx=u-cam.vx,dy=v-cam.vy;
    const ground=Math.max(0,dy)*2.05;
    // The depth of façades follows angular distance to the street's bearing.
    const facade=Math.max(0,Math.abs(dx)-.06)*.73;
    const depth=Math.max(ground,facade,.04);
    const perspective=1.055+cam.travel*depth;
    const px=cam.vx+dx*perspective+cam.pan*(.45+depth);
    const py=cam.vy+dy*perspective+cam.bob;
    const sx=(px-.5)*W,sy=(py-.5)*H;
    return [W*.5+sx*Math.cos(cam.roll)-sy*Math.sin(cam.roll),
      H*.5+sx*Math.sin(cam.roll)+sy*Math.cos(cam.roll)];
  }
  function triangle(g,img,a,b,c,A,B,C){
    const sw=img.naturalWidth,sh=img.naturalHeight;
    const u1=(b[0]-a[0])*sw, v1=(b[1]-a[1])*sh, u2=(c[0]-a[0])*sw, v2=(c[1]-a[1])*sh;
    const x1=B[0]-A[0],y1=B[1]-A[1],x2=C[0]-A[0],y2=C[1]-A[1],d=u1*v2-u2*v1;
    const aa=(x1*v2-x2*v1)/d,bb=(y1*v2-y2*v1)/d,cc=(x2*u1-x1*u2)/d,dd=(y2*u1-y1*u2)/d;
    g.save(); g.beginPath();
    const mx=(A[0]+B[0]+C[0])/3,my=(A[1]+B[1]+C[1])/3;
    [A,B,C].forEach((pt,k)=>{
      const xx=pt[0]-mx,yy=pt[1]-my,len=Math.hypot(xx,yy)||1;
      const x=pt[0]+xx*.52/len,y=pt[1]+yy*.52/len;
      if(k)g.lineTo(x,y);else g.moveTo(x,y);
    });
    g.closePath();g.clip();
    g.transform(aa,bb,cc,dd,A[0]-aa*a[0]*sw-cc*a[1]*sh,A[1]-bb*a[0]*sw-dd*a[1]*sh);
    const left=Math.min(a[0],b[0],c[0])*sw,top=Math.min(a[1],b[1],c[1])*sh;
    const w=(Math.max(a[0],b[0],c[0])*sw-left),h=(Math.max(a[1],b[1],c[1])*sh-top);
    g.drawImage(img,left,top,w,h,left,top,w,h);g.restore();
  }
  function paintStreet(g,cam){
    const image=assets[cam.image], count=cols.length;
    g.drawImage(image,0,0,W,H);
    const projected=textureCorners.map(([u,v])=>project(u,v,cam));
    for(let r=0;r<rows.length-1;r++)for(let c=0;c<count-1;c++){
      const i=r*count+c, j=i+1,k=i+count,l=k+1;
      const q=[projected[i],projected[j],projected[k],projected[l]];
      if(q.every(pt=>pt[0]<0)||q.every(pt=>pt[0]>W)||q.every(pt=>pt[1]<0)||q.every(pt=>pt[1]>H))continue;
      triangle(g,image,textureCorners[i],textureCorners[j],textureCorners[l],q[0],q[1],q[3]);
      triangle(g,image,textureCorners[i],textureCorners[l],textureCorners[k],q[0],q[3],q[2]);
    }
  }
  function noise(i,k){
    let h=Math.imul(i+3571,2654435761)^Math.imul(k+8123,1597334677);
    h=Math.imul(h^(h>>>16),2246822507); return ((h^(h>>>13))>>>0)/4294967296;
  }
  function pool(g,x,y,rx,ry,color,alpha){
    g.save();g.translate(x,y);g.scale(rx,ry);
    const grd=g.createRadialGradient(0,0,.01,0,0,1);
    grd.addColorStop(0,'rgba('+color+','+alpha+')');grd.addColorStop(.42,'rgba('+color+','+alpha*.50+')');grd.addColorStop(1,'rgba('+color+',0)');
    g.fillStyle=grd;g.fillRect(-1,-1,2,2);g.restore();
  }
  function sprite(g,key,x,y,width,height){
    const src=bounds[key];g.drawImage(assets[key],...src,x,y,width,height);
  }
  function traffic(g,t,cam){
    const fast=cam.turn, p=end(t/(fast?4:cam.finish?5.3:3.5));
    // Oncoming rickshaw clears the hero on its right; reciprocal distance gives
    // acceleration in the camera rather than a linear screen translation.
    const inv=1/(1-(fast?.82:.80)*p);
    const x0=cam.finish?.81:cam.turn?.805:.65, y0=cam.turn?.58:.568;
    const v=project(cam.vx+(x0-cam.vx)*inv,cam.vy+(y0-cam.vy)*inv,cam);
    const width=(cam.turn?23:24)*inv*(1+.11*p),height=width*1.18;
    if(v[0]-width>W||v[1]-height>H)return;
    const bump=.15*Math.sin(t*24)*inv;
    pool(g,v[0],v[1]+2,width*.62,height*.096,'9,11,12',.68);
    g.save();g.translate(v[0],v[1]+bump);g.rotate(.015*Math.sin(t*5.1));sprite(g,'rickshaw',-width*.5,-height,width,height);g.restore();
    pool(g,v[0],v[1]+height*.16,width*.12,height*.18,'233,208,148',.24);
  }
  function water(g,t,x,y,width,angle){
    // A stable cycle parameterizes each physical droplet between wheel and road.
    g.save(); g.translate(x,y);g.rotate(angle);
    for(const side of [-1,1])for(let i=0;i<62;i++){
      const life=(t*(.9+noise(i,1)*1.9)+noise(i,side+6))%1;
      const jitter=noise(i,side+7), kick=width*(.03+.25*noise(i,side+3));
      const xx=side*(width*.40+life*kick);
      const yy=width*(.006+.085*life*life-.19*life*(1-life)*jitter)-width*.035;
      g.strokeStyle='rgba(194,214,210,'+(1-life)*(.12+.27*jitter)+')';g.lineWidth=.65+.65*jitter;
      g.beginPath();g.moveTo(xx,yy);g.lineTo(xx+side*(.7+2.5*life),yy+.5+2.5*life);g.stroke();
    }
    g.restore();
  }
  function coupe(g,t,cam){
    const p=cam.p, turn=cam.turn, cta=cam.finish;
    const sm=smooth(p), weave=Math.sin(t*2.6);
    const key=turn?'quarter':'rear';
    const x=turn?mix(348,263,sm)+36*Math.sin(p*5.45):cta?mix(276,341,sm)+8*weave:mix(235,288,sm)+14*Math.sin(p*5.1);
    const width=turn?mix(352,241,sm)+15*Math.sin(p*3.6):cta?mix(251,103,sm):mix(316,244,sm)+8*Math.sin(p*5.5);
    const height=width*bounds[key][3]/bounds[key][2];
    const y=(turn?mix(783,689,sm):cta?mix(728,588,sm):mix(786,704,sm))+.9*Math.sin(t*17);
    const angle=turn?-.035*Math.sin(p*5.3):.014*Math.sin(p*5.9);
    pool(g,x,y-2,width*.52,height*.12,'4,9,11',.92);
    // A rippled reflection of the car includes the number plate and red lamp.
    // Horizontal slices prevent a hard mirrored edge on broken asphalt.
    const src=bounds[key];
    for(let j=0;j<24;j++){
      const s=j/24, e=(j+1)/24;
      const sy=src[1]+src[3]*(1-e),sh=(e-s)*src[3];
      const yy=y+s*height*.56;
      const offset=Math.sin(s*61-t*3.1)*2+s*Math.sin(s*140-t*5)*5;
      g.save();g.globalAlpha=.27*Math.pow(1-s,.82);
      g.translate(x+offset,yy);g.scale(1,-1);
      g.drawImage(assets[key],src[0],sy,src[2],sh,-width*.5,-Math.max(.8,(e-s)*height*.53),width,Math.max(.8,(e-s)*height*.53));
      g.restore();
    }
    const tailX=x+(turn?width*.15:0);
    for(const side of [-1,1]){
      const xx=tailX+side*width*(turn?.22:.27);
      pool(g,xx,y+height*.24,width*.071,height*.38,'249,39,21',.49);
      for(let j=0;j<25;j++){
        const f=(noise(j,4)+t*.20)%1;
        g.fillStyle='rgba(254,77,39,'+(.43*(1-f))+')';
        g.fillRect(xx+(noise(j,3)-.5)*width*.12,y+height*(.025+.64*f),1+noise(j,2)*width*.052,.6+1.6*f);
      }
    }
    water(g,t,x,y,width,angle);
    g.save();g.translate(x,y);g.rotate(angle);
    const skew=turn?Math.sin(p*5.2)*.080:Math.sin(p*5.9)*.040;
    g.transform(1,0,skew,1,0,0);sprite(g,key,-width*.5,-height,width,height);g.restore();
    return [x,y,width];
  }
  function rain(g,t,cam){
    g.lineCap='round';
    for(let j=0;j<99;j++){
      const depth=noise(j,7),speed=65+depth*315;
      const xx=((noise(j,3)*662+28*t*(.4+depth))%662+662)%662-49;
      const yy=(noise(j,9)*1100+t*speed)%1100-46, length=2+11*depth;
      g.strokeStyle='rgba(206,223,216,'+(.07+depth*.18)+')';g.lineWidth=.35+.65*depth;
      g.beginPath();g.moveTo(xx,yy);g.lineTo(xx+length*.15,yy+length);g.stroke();
    }
    // Windshield beads occupy the extreme edges of the virtual camera.
    for(let j=0;j<16;j++){
      const rad=1+noise(j,33)*2.0,x=(j%2?W:0)+(j%2?-1:1)*noise(j,31)*43;
      const y=(noise(j,4)*H+(j%5?0:t*(1+noise(j,8)*4)))%H;
      g.strokeStyle='rgba(227,229,210,.33)';g.lineWidth=.53;g.beginPath();g.ellipse(x,y,rad*.68,rad*1.27,-.12,3.0,5);g.stroke();
    }
  }
  window.paintRoadV2=(canvas,t,mode='hook')=>{
    if(!assets.rickshaw||!assets.curb||!assets.regal||!assets.rear||!assets.quarter)return;
    const g=canvas.getContext('2d'),cam=sceneCamera(Math.max(0,t),mode);
    g.save();g.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    paintStreet(g,cam);traffic(g,t,cam);coupe(g,t,cam);rain(g,t,cam);g.restore();
  };
})();
