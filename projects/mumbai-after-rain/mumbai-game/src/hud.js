import {route} from './route.js';
import edit from './captions.json';

const cream='#fff4df', amber='#ffc075';
const clamp=v=>Math.min(1,Math.max(0,v));
const titleFont=(px,weight=720)=>weight+' '+px+'px Archivo,Arial,sans-serif';
function label(g,text,x,y,size,weight=650,color=cream){
  g.font=titleFont(size,weight);g.fillStyle=color;g.fillText(text,x,y);
}
function scrim(g,w,h,alpha){
  const grad=g.createLinearGradient(0,0,0,h);grad.addColorStop(0,'rgba(5,15,20,'+alpha+')');grad.addColorStop(1,'rgba(5,15,20,0)');g.fillStyle=grad;g.fillRect(0,0,w,h);
}
function panel(g,x,y,w,h){
  g.fillStyle='rgba(9,20,24,.74)';g.beginPath();g.roundRect(x,y,w,h,5);g.fill();
}
function map(g,x,y,state){
  const scale=.27, pos=route.sample((state.progress??0)*route.length);
  g.save();g.translate(x,y);
  panel(g,-28,-38,56,76);g.beginPath();
  for(let s=0;s<=route.length+4;s+=4){
    const p=route.sample(Math.min(s,route.length));
    if(!s)g.moveTo(p.x*scale,-p.z*scale);else g.lineTo(p.x*scale,-p.z*scale);
  }
  g.closePath();g.strokeStyle='#adc1bc';g.lineWidth=2;g.stroke();
  g.fillStyle=amber;g.beginPath();g.arc(pos.x*scale,-pos.z*scale,4,0,Math.PI*2);g.fill();g.restore();
}
function subtitles(g,width,h,t){
  const cap=edit.captions.find(line=>t>=line.start && t<line.end+.035);if(!cap)return;
  let size=33;g.font=titleFont(size);
  while(g.measureText(cap.text).width>width-120 && size>21)g.font=titleFont(--size);
  const gap=g.measureText(' ').width, ws=cap.words.map(w=>g.measureText(w.text).width);
  const len=ws.reduce((a,b)=>a+b,0)+gap*(ws.length-1), y=h*.8;
  let x=(width-len)/2;panel(g,x-16,y-36,len+32,52);
  cap.words.forEach((w,i)=>{label(g,w.text,x,y,size,720,t>=w.start-.02&&t<w.end+.03?amber:cream);x+=gap+ws[i];});
}
export function paintHud(canvas,state,t,mode,brand){
  const g=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);
  const u=Math.min(w/720,h/1080),W=w/u,H=h/u;
  g.scale(u,u);g.textBaseline='alphabetic';g.textAlign='left';
  const isFilm=mode==='capture'||mode==='film', isMenu=mode==='menu';
  const top=isFilm?H*.105:78, left=47;
  if(isFilm && t<4.0){
    g.save();g.globalAlpha=1-clamp((t-3.45)/.53);
    scrim(g,W,H*.43,.78);
    label(g,'GPT-6.2 ASTRA  /  THREE.JS',left,top,22,650,amber);
    label(g,'Mumbai',left-3,top+82,91,800);
    label(g,'After Rain',left-3,top+161,88,780);g.restore();
  }else if(isFilm&&t<8.5){
    g.save();scrim(g,W,H*.35,.66);
    label(g,'GAADI CHUNIYE',left,top,22,650,amber);
    label(g,'Monsoon GT',left-2,top+68,71,740);g.restore();
  }else if(isFilm&&t>=47.3){
    g.save();g.globalAlpha=clamp((t-47.3)/.4);scrim(g,W,H*.65,.87);
    label(g,'GPT-6.2 ASTRA',left,top,23,650,amber);
    label(g,'Comment',left-2,top+72,69,650);
    label(g,'“story”',left-4,top+180,124,820,amber);
    label(g,'DM mein: my repo, 5 repos + skills',left,top+237,32,620);g.restore();
  }else if(!isMenu){
    g.save();scrim(g,W,H*.29,.62);
    label(g,'MUMBAI   /   MONSOON GT',left,top,21,680,amber);
    label(g,state.area||'Cinema Road',left,top+40,37,720);g.restore();
  }
  if(!isMenu&&(!isFilm||(t>=8.5&&t<47.3))){
    map(g,left+29,H*.698,state);
    const sp=Math.round(Math.abs(state.speed||0));
    panel(g,W-153,H*.69-37,104,60);
    label(g,String(sp).padStart(2,'0'),W-143,H*.69+7,39,730);
    label(g,'km/h',W-88,H*.69+7,16,650,amber);
  }
  if(isFilm)subtitles(g,W,H,t);
  const size=Math.min(W*.10,76),x=W-(isFilm?42:24)-size,y=H-(isFilm?H*.08:22)-size;
  if(brand){g.save();g.beginPath();g.roundRect(x,y,size,size,7);g.clip();g.drawImage(brand,x,y,size,size);g.restore();}
}
