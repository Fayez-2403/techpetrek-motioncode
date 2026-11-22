/* Canvas text lives in 1080 x 1920 design coordinates, including the phone preview. */
(() => {
  const surface = document.querySelector('#picture');
  const overlay = document.createElement('canvas');
  const logo = new Image();
  logo.src = 'public/brand/techpe-trek.jpg';
  const cream = '#fff6e8', amber = '#ffb64c', ice = '#bde9e4';
  const clamp = t => Math.max(0, Math.min(1,t));
  const ease = t => 1 - (1-clamp(t))**3;

  function type(g, value, x, y, size, {font='Archivo',weight=650,color=cream,track=0}={}) {
    g.font = weight+' '+size+'px "'+font+'"';
    g.letterSpacing = track+'px';
    g.fillStyle = color;
    g.fillText(value,x,y);
  }
  function mono(g,text,x,y,size,color=cream) {
    type(g,text,x,y,size,{font:'JetBrains Mono',weight:600,color,track:1.3});
  }
  function scrim(g, from, to, a, b) {
    const shade = g.createLinearGradient(0,from,0,to);
    shade.addColorStop(0,'rgba(3,12,16,'+a+')');
    shade.addColorStop(1,'rgba(3,12,16,'+b+')');
    g.fillStyle=shade;
    g.fillRect(0,from,1080,to-from);
  }
  function openTitle(g,t) {
    scrim(g,0,840,.85,0);
    g.save();
    g.globalAlpha=.82+.18*ease(t/.4);
    g.translate(0,14*(1-ease(t/.45)));
    g.fillStyle=amber; g.fillRect(96,242,38,4);
    mono(g,'GPT-6.2 ASTRA  /  BUILD IDEA',96,303,36);
    type(g,'Nightshift',85,480,174,{weight:840,track:-9.2});
    g.restore();
  }
  function identify(g,t) {
    scrim(g,970,1570,0,.73);
    scrim(g,1570,1920,.73,.43);
    const progress=ease((t+.03)/.46);
    g.save();g.globalAlpha=progress;g.translate((1-progress)*-34,0);
    g.fillStyle=amber;g.fillRect(95,1199,34,4);
    mono(g,t<2.8?'DRIVER SELECT':'DRIVER LOCKED',94,1260,29,t<2.8?ice:amber);
    type(g,'The Courier',89,1380,120,{weight:790,track:-5.5});
    g.restore();
  }
  function chapter(g,heading,sub,t) {
    // Each camera direction appears briefly, leaving the driving shot to play clean.
    const a=ease((t+.08)/.32)*(1-clamp((t-2.35)/.4));
    if(a<=0)return;
    g.save();g.globalAlpha=a;scrim(g,0,540,.79,0);
    mono(g,sub,96,235,25,ice);
    type(g,heading,92,330,80,{weight:700,track:-3.6});
    g.restore();
  }
  function captions(g,t) {
    const line=window.nightshiftEdit.captions.find(l=>t>=l.start-.045 && t<=l.end+.19);
    if(!line) return;
    let first=0;
    const words=line.words;
    if(words.length>5 && t>words[2].end+.06)first=3;
    const shown=words.length>5?words.slice(first,first===0?3:words.length):words;
    const size=43;
    g.font='650 '+size+'px Inter';g.letterSpacing='-1px';
    const widths=shown.map(w=>g.measureText(w.text).width);
    const gap=12;
    const width=widths.reduce((s,w)=>s+w,0)+(widths.length-1)*gap;
    const left=(1080-width)/2, baseline=1560;
    g.fillStyle='rgba(5,14,19,.89)';
    g.beginPath();g.roundRect(left-25,baseline-49,width+50,69,10);g.fill();
    let x=left;
    for(let i=0;i<shown.length;i++){
      const w=shown[i];
      g.fillStyle=t>=w.start && t<w.end+.045?amber:cream;
      g.fillText(w.text,x,baseline);x+=widths[i]+gap;
    }
  }
  function brand(g) {
    // The supplied mark has a black ground. Keep the entire source image intact.
    const size=108, x=1080-62-size, y=1920-150-size;
    g.save();g.beginPath();g.roundRect(x,y,size,size,12);g.clip();
    g.drawImage(logo,x,y,size,size);g.restore();
  }
  window.setPictureSize=(width,height)=>{
    surface.width=width;surface.height=height;
    overlay.width=width;overlay.height=height;
  };
  window.setPictureSize(1080,1920);
  function render(t) {
    const shot=window.nightshiftEdit.shots.find(s=>t<s.end) || window.nightshiftEdit.shots.at(-1);
    const local=t-shot.start;
    if(shot.id==='pilot') window.paintDriver(surface,local);
    else {
      const camera=shot.id==='rain'?'rain':shot.id==='run'?'run':'chase';
      window.paintDrive(surface,t,camera);
    }
    const g=surface.getContext('2d');
    g.save();g.setTransform(surface.width/1080,0,0,surface.height/1920,0,0);
    g.textAlign='left';g.textBaseline='alphabetic';
    if(shot.id==='hook') openTitle(g,local);
    if(shot.id==='pilot') identify(g,local);
    if(shot.id==='rain') chapter(g,'Lens rain','WINDSHIELD',local);
    if(shot.id==='run') chapter(g,'Low angle','CHASE CAMERA',local);
    if(shot.id==='cta') {
      window.paintEndcard(overlay,local);
      g.drawImage(overlay,0,0,1080,1920);
    }
    captions(g,t);
    brand(g);
    g.restore();
  }
  const fonts=[['800','Archivo'],['600','JetBrains Mono'],['650','Inter']].map(([weight,f])=>document.fonts.load(weight+' 64px "'+f+'"'));
  window.nightshiftReady=Promise.all([logo.decode(),window.driverReady,...fonts]).then(()=>{
    window.seek=render;
    render(0);
    const clock={t:0}, timeline=gsap.timeline({paused:true});
    timeline.to(clock,{t:24.8,duration:24.8,ease:'none',onUpdate:()=>render(clock.t)},0);
    window.__timelines=window.__timelines||{};
    window.__timelines.nightshift=timeline;
  });
})();
