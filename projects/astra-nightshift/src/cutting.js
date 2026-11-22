/* Original editorial layer. Each picture and every line of dialogue shares this clock. */
(() => {
  'use strict';
  const canvas=document.querySelector('#picture');
  const logo=new Image();logo.src='public/brand/techpe-trek.jpg';
  const edit=window.cuttingEdit;
  const ivory='#fff5de', turmeric='#ffd575', mint='#afdbcc', ink='#172922';
  const clamp=x=>Math.max(0,Math.min(x,1));
  const ease=x=>1-(1-clamp(x))**3;

  function letters(g,s,x,y,font,color,tracking=0){
    g.font=font;g.fillStyle=color;g.letterSpacing=tracking+'px';g.fillText(s,x,y);
  }
  function shade(g,y0,y1,a0,a1){
    const fill=g.createLinearGradient(0,y0,0,y1);
    fill.addColorStop(0,'rgba(6,16,19,'+a0+')');fill.addColorStop(1,'rgba(6,16,19,'+a1+')');
    g.fillStyle=fill;g.fillRect(0,y0,1080,y1-y0);
  }
  function title(g,t){
    const opacity=1-clamp((t-2.46)/.48);
    if(opacity<=0)return;
    g.save();g.globalAlpha=opacity;
    shade(g,0,820,.78,0);
    g.translate(0,14*(1-ease(t/.6)));
    letters(g,'मुंबई  /  रात १२:४०',78,182,'400 42px Tiro',turmeric);
    letters(g,'आख़िरी कटिंग',71,345,'400 132px Tiro',ivory);
    g.restore();
  }
  function route(g,t){
    // The route closes the distance to the tapri as the friends turn toward its light.
    const p=clamp((t-7)/8.5);
    const way=[[0,38],[46,38],[66,18],[115,18],[135,-2],[191,-2]];
    const lengths=way.slice(1).map((pt,i)=>Math.hypot(pt[0]-way[i][0],pt[1]-way[i][1]));
    let distance=p*lengths.reduce((a,b)=>a+b,0), x=0,y=38;
    for(let i=0;i<lengths.length;i++){
      const part=clamp(distance/lengths[i]);x=way[i][0]+part*(way[i+1][0]-way[i][0]);y=way[i][1]+part*(way[i+1][1]-way[i][1]);
      if(distance<=lengths[i])break;
      distance-=lengths[i];
    }
    g.save();
    g.translate(83,1340);g.globalAlpha=.9*ease((t-7)/.26)*(1-clamp((t-15.05)/.45));
    g.fillStyle='rgba(9,22,25,.79)';g.beginPath();g.roundRect(-19,-38,232,126,10);g.fill();
    g.lineJoin='round';g.lineWidth=4;g.strokeStyle='#bfe3ce';g.beginPath();way.forEach(([u,v],i)=>i?g.lineTo(u,v):g.moveTo(u,v));g.stroke();
    g.strokeStyle=turmeric;g.lineWidth=3;g.strokeRect(185,-8,12,12);
    g.fillStyle=turmeric;g.beginPath();g.arc(x,y,8,0,Math.PI*2);g.fill();
    letters(g,'Chai ki tapri',0,70,'600 25px "JetBrains Mono"',ivory);
    g.restore();
  }
  function subtitle(g,t){
    const line=edit.captions.find(c=>t>=c.start-.023 && t<c.end+.035);
    if(!line)return;
    const font='680 52px Inter';g.font=font;g.letterSpacing='-1.25px';
    const space=g.measureText(' ').width, widths=line.words.map(w=>g.measureText(w.text).width);
    const width=widths.reduce((a,b)=>a+b,0)+(widths.length-1)*space, left=(1080-width)/2;
    g.fillStyle='rgba(8,16,16,.85)';g.beginPath();g.roundRect(left-23,1517,width+46,84,12);g.fill();
    let x=left;
    line.words.forEach((w,i)=>{
      const hot=t>=w.start-.025&&t<=w.end+.045;
      letters(g,w.text,x,1576,font,hot?(line.who==='driver'?mint:turmeric):ivory,-1.25);x+=widths[i]+space;
    });
  }

  // A chai-stall receipt carries the game prompt, with cut edges and printed black ink.
  // Its stock and small ink marks are created once, keeping frame seeks deterministic.
  const paper=document.createElement('canvas');
  paper.width=891;paper.height=680;
  function paperStock(){
    const g=paper.getContext('2d');
    const paperPath=new Path2D();paperPath.moveTo(0,7);
    for(let x=0;x<891;x+=13)paperPath.lineTo(x,4+3*Math.sin(x*.53));
    paperPath.lineTo(890,663);
    for(let x=890;x>=0;x-=10)paperPath.lineTo(x,663+(Math.floor(x/10)%2)*8);
    paperPath.closePath();g.clip(paperPath);
    const grad=g.createLinearGradient(0,0,840,690);grad.addColorStop(0,'#f6edcf');grad.addColorStop(.55,'#f0e8c9');grad.addColorStop(1,'#dbd5b4');
    g.fillStyle=grad;g.fillRect(0,0,891,680);
    for(let i=0;i<13000;i++){
      const x=(i*14741%8909)/10,y=(i*4001%6799)/10;
      g.fillStyle=i%3?'rgba(77,59,32,.055)':'rgba(255,255,246,.25)';g.fillRect(x,y,1+i%3,1);
    }
    const rule=(y)=>{g.strokeStyle='#687363';g.lineWidth=2;g.setLineDash([7,7]);g.beginPath();g.moveTo(46,y);g.lineTo(845,y);g.stroke();g.setLineDash([]);};
    letters(g,'चाय की पर्ची',44,84,'400 53px Tiro',ink);
    g.save();g.translate(706,64);g.rotate(-.082);g.strokeStyle='#a64d2c';g.lineWidth=3;g.strokeRect(-57,-32,174,51);
    letters(g,'दो कटिंग',-46,6,'400 36px Tiro','#a64d2c');g.restore();
    rule(112);
    letters(g,'GPT-6.2 Astra',41,245,'790 103px Archivo',ink,-4);
    letters(g,'ko yeh bol',48,327,'670 75px Archivo','#a34c2c',-2);
    rule(372);
    letters(g,'“Meri gali ka driving game banao.',45,462,'580 43px Inter',ink,-1.1);
    letters(g,'Baarish ho. Aur chai ki tapri pe',45,530,'580 43px Inter',ink,-1.1);
    letters(g,'gaadi ruke.”',45,598,'580 43px Inter',ink,-1.1);
  }
  function receipt(g,t){
    shade(g,0,1000,.31*ease(t/.32),0);
    const p=ease((t+.015)/.57);
    g.save();g.translate(541+(1-p)*320,631-(1-p)*790);g.rotate(-.027-(1-p)*.14);
    g.shadowColor='rgba(0,6,6,.58)';g.shadowBlur=28;g.shadowOffsetY=20;
    g.drawImage(paper,-445,-340);g.restore();
  }
  function brand(g){
    const x=910,y=1662,s=108;
    g.save();g.beginPath();g.roundRect(x,y,s,s,12);g.clip();g.drawImage(logo,x,y,s,s);g.restore();
  }
  window.setPictureSize=(w,h)=>{canvas.width=w;canvas.height=h;};
  function draw(t){
    let index=edit.scenes.findIndex((s,i)=>i+1===edit.scenes.length||t<edit.scenes[i+1].start);
    const shot=edit.scenes[index], local=t-shot.start;
    if(shot.id==='pilot'||shot.id==='train')window.paintCabinV2(canvas,local,shot.id);
    else if(shot.id==='chai')window.paintChaiV2(canvas,local);
    else window.paintRoadV2(canvas,local,shot.id);
    const g=canvas.getContext('2d');g.save();
    g.setTransform(canvas.width/1080,0,0,canvas.height/1920,0,0);g.textAlign='left';g.textBaseline='alphabetic';
    if(shot.id==='hook')title(g,local);
    if(shot.id==='train'||shot.id==='turn')route(g,t);
    if(shot.id==='cta')receipt(g,local);
    subtitle(g,t);brand(g);g.restore();
  }
  const fonts=['400 72px Tiro','790 100px Archivo','680 52px Inter','600 34px "JetBrains Mono"'].map(f=>document.fonts.load(f));
  const clock={t:0}, tl=gsap.timeline({paused:true});
  let ready=false;
  tl.to(clock,{t:edit.duration,duration:edit.duration,ease:'none',onUpdate:()=>{if(ready)draw(clock.t);}},0);
  window.__timelines=window.__timelines||{};window.__timelines['aakhri-cutting']=tl;
  window.nightshiftReady=Promise.all([logo.decode(),window.chaiV2Ready,window.cabinV2Ready,window.roadV2Ready,...fonts]).then(()=>{
    paperStock();window.seek=draw;ready=true;draw(clock.t);
  });
  window.__hf=window.__hf||{};
  window.__hf.buildReady=window.__hf.buildReady||{};
  window.__hf.buildReady['aakhri-cutting-art']=window.nightshiftReady;
})();
