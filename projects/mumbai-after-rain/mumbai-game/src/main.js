import * as THREE from 'three';
import {createGame} from './game.js';
import {paintHud} from './hud.js';
import {makeEngineSound} from './engine-audio.js';

const scene=document.querySelector('#scene'), hud=document.querySelector('#hud');
const preview=new URLSearchParams(location.search).has('capture');
const keys=new Set();let game,mode='menu',clock=0,last=0,raf=0,brand;
let engine;
const dom=id=>document.getElementById(id);
const frame=document.createElement('canvas');
const buttons=[...document.querySelectorAll('[data-paint]')];
function modeTo(value){
  mode=value;document.body.dataset.mode=value;dom('menu').hidden=value!=='menu';dom('tools').hidden=value==='menu'||preview;
  keys.clear();clock=0;last=0;
  const score=dom('score');
  if(value==='film'){score.currentTime=0;score.play().catch(()=>{});}
  else if(!score.paused)score.pause();
  if(value==='play'){
    game.reset();
    if(window.AudioContext){engine??=makeEngineSound();engine.start();}
  }else engine?.quiet();
}
function resize(w,h){
  for(const c of [hud,frame]){c.width=w;c.height=h}
  game.resize(w,h);
}
function drawFilm(t){
  const state=game.film(t);
  paintHud(hud,state,t,'capture',brand);
  const g=frame.getContext('2d');g.drawImage(scene,0,0,frame.width,frame.height);g.drawImage(hud,0,0);
  return state;
}
function tick(now){
  if(preview)return;
  const dt=last?Math.min(.06,(now-last)/1000):0;last=now;clock+=dt;
  let state;
  if(mode==='film'&&!dom('score').paused)clock=dom('score').currentTime;
  if(mode==='play'){
    state=game.playStep(dt,keys);
    engine?.update(state.speed,keys.has('KeyW')||keys.has('ArrowUp'));
  }
  else state=game.film(mode==='menu'?5.6+.65*Math.sin(clock*.22):Math.min(clock,55.99));
  paintHud(hud,state,clock,mode,brand);
  if(mode==='film'&&clock>=56)modeTo('menu');
  raf=requestAnimationFrame(tick);
}
function showError(e){
  const msg=dom('error');msg.hidden=false;msg.textContent='This drive needs WebGL 2. Enable hardware acceleration in your browser and reopen it. '+e.message;
}
window.mumbaiReady=(async()=>{
  try{
    await document.fonts.load('700 36px Archivo');
    brand=new Image();brand.src='BRAND_DATA';await brand.decode();
    game=createGame(THREE,scene);
    const fit=()=>{const scale=Math.min(1,1440/Math.max(innerWidth,innerHeight));resize(Math.round(innerWidth*scale),Math.round(innerHeight*scale));};
    fit();if(!preview)addEventListener('resize',fit);
    window.driveCapture={resize,draw:drawFilm,frame,game,keys};
    if(preview){modeTo('capture');return true;}
    dom('drive').onclick=()=>modeTo('play');dom('back').onclick=()=>modeTo('menu');
    dom('restart').onclick=()=>modeTo('play');dom('watch').onclick=()=>modeTo('film');
    buttons.forEach(b=>b.onclick=()=>{game.setPaint(b.dataset.paint);buttons.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
    addEventListener('keydown',e=>{if(mode==='play'&&['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)){e.preventDefault();keys.add(e.code);}if(e.code==='Escape')modeTo('menu');});
    addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
    document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);};b.onlostpointercapture=()=>keys.delete(b.dataset.key);});
    raf=requestAnimationFrame(tick);return true;
  }catch(e){showError(e);throw e;}
})();
