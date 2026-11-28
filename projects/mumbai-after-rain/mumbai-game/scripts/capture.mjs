import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdir, rename, writeFile} from 'node:fs/promises';
import {once} from 'node:events';
import {dirname, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const gameDir=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const localRequire=createRequire(resolve(gameDir,'package.json'));
const studioRequire=createRequire(resolve(gameDir,'../../../tools/motion-studio/package.json'));
let puppeteer;
try {puppeteer=localRequire('puppeteer-core');}
catch {puppeteer=studioRequire('puppeteer-core');}
const out=resolve(gameDir,'../out/mumbai-drive-preview');
const url=pathToFileURL(resolve(gameDir,'play-mumbai.html')).href;
const action=process.argv[2]||'stills';
const width=Number(process.argv[3]||720), height=width*16/9;
const fps=Number(process.argv[4]||30), duration=56;
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const seekTimes=[1.2,5.7,10.5,13.4,16.6,22.8,27.6,33.5,39.5,44.3,50.5,55.1];
const errors=[];
await mkdir(out,{recursive:true});
let browser,page;
let encoder;
async function launch(angle){
  browser=await puppeteer.launch({executablePath:chrome,headless:true,protocolTimeout:180000,args:[
    '--enable-gpu','--ignore-gpu-blocklist','--use-gl=angle','--use-angle='+angle,'--enable-unsafe-swiftshader',
    '--disable-background-timer-throttling','--disable-renderer-backgrounding','--force-color-profile=srgb','--hide-scrollbars'
  ]});
  page=await browser.newPage();
  await page.setViewport({width,height,deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'?capture=1',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>window.mumbaiReady);
  // the game caps its render at 1440 px for live play; a capture asks for the full requested size (sharp 1080x1920)
  if(action!=='test')await page.evaluate(([w,h])=>driveCapture.resize(w,h),[width,height]);
  console.log('GPU:',await page.evaluate(()=>{
    const gl=driveCapture.game.renderer.getContext(), ext=gl.getExtension('WEBGL_debug_renderer_info');
    return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
  }));
}
async function grab(t){
  const result=await page.evaluate(t=>{
    const cap=window.driveCapture;
    const state=cap.draw(t);
    return {image:cap.frame.toDataURL('image/jpeg',.945).split(',')[1],state};
  },t);
  return {bytes:Buffer.from(result.image,'base64'),state:result.state};
}
try{
  try{await launch('d3d11')}catch(e){
    await browser?.close();errors.length=0;console.warn('Hardware initialization:',e.message);
    await launch('swiftshader');
  }
  if(action==='test'){
    const a=await grab(32), b=await grab(2), c=await grab(32);
    assert.deepEqual(a.bytes,c.bytes,'Seeking must reproduce the exact picture');
    assert.notDeepEqual(a.bytes,b.bytes);
    await page.evaluate(()=>driveCapture.resize(180,320));
    const physics=await page.evaluate(()=>{
      const game=driveCapture.game;game.reset();
      const render=game.renderer.render.bind(game.renderer);
      let cameraX;
      game.renderer.render=(scene,camera)=>{
        if(camera.parent===null)cameraX=camera.position.x;
        return render(scene,camera);
      };
      const run=(keys,count)=>{let s;for(let i=0;i<count;i++)s=game.playStep(.14,new Set(keys));return s;};
      const start=run([],1), moving=run(['KeyW'],19), steering=run(['KeyW','KeyD'],8), stopped=run(['KeyS'],16);
      game.reset();run(['KeyW'],18);const straightX=cameraX;
      game.reset();run(['KeyW','KeyA'],18);const leftX=cameraX;
      game.reset();run(['KeyW','KeyD'],18);const rightX=cameraX;
      game.renderer.render=render;
      game.reset();const reset=run([],1);
      return {start,moving,steering,stopped,reset,straightX,leftX,rightX};
    });
    assert.equal(physics.start.speed,0);assert.ok(physics.moving.speed>25);
    assert.ok(physics.steering.distance>physics.moving.distance);assert.equal(physics.stopped.speed,0);assert.equal(physics.reset.distance,0);
    assert.ok(physics.leftX>physics.straightX+1 && physics.rightX<physics.straightX-1,'Steering must move the car sideways in both directions');
    await page.goto(url,{waitUntil:'domcontentloaded'});await page.evaluate(()=>window.mumbaiReady);
    await page.click('[aria-label="Petrol blue"]');assert.equal(await page.$eval('[aria-label="Petrol blue"]',b=>b.getAttribute('aria-pressed')),'true');
    await page.click('#drive');assert.equal(await page.$eval('body',b=>b.dataset.mode),'play');
    await page.keyboard.press('Escape');await page.click('#watch');assert.equal(await page.$eval('body',b=>b.dataset.mode),'film');
    await page.waitForFunction(()=>document.querySelector('#score').currentTime>0.25,{timeout:10000});
    await page.click('#back');assert.equal(await page.$eval('body',b=>b.dataset.mode),'menu');
    assert.equal(await page.$eval('#score',s=>s.paused),true);
    console.log('Seek, controls, throttle, steering, braking, reset, paint, menu and voiced replay passed.',JSON.stringify(physics.moving));
  }else if(action==='stills'){
    const start=Date.now();
    for(const t of seekTimes){
      const {bytes,state}=await grab(t);await writeFile(resolve(out,'frame-'+t.toFixed(1)+'.jpg'),bytes);
      console.log(t,state.area,state.speed+' km/h');
    }
    console.log('Seconds per still:',((Date.now()-start)/1000/seekTimes.length).toFixed(2));
  }else if(action==='record'){
    const temp=resolve(out,'mumbai-drive-preview.partial.mp4');
    encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','mjpeg','-i','pipe:0',
      '-i',resolve(gameDir,'../public/audio/mumbai-drive.m4a'),'-map','0:v:0','-map','1:a:0',
      '-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-preset','fast','-crf','17',
      '-color_primaries','bt709','-colorspace','bt709','-color_trc','bt709','-bsf:v','h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1',
      '-c:a','copy','-t',String(duration),'-movflags','+faststart+write_colr',temp],{stdio:['pipe','ignore','inherit']});
    const finished=once(encoder,'exit');
    for(let i=0;i<duration*fps;i++){
      const {bytes}=await grab(i/fps);
      if(!encoder.stdin.write(bytes))await once(encoder.stdin,'drain');
      if(i%(fps*3)===0)console.log('Captured',i/fps,'/',duration,'s');
    }
    encoder.stdin.end();const [code]=await finished;assert.equal(code,0);
    await rename(temp,resolve(out,'mumbai-drive-preview.mp4'));console.log('Finished preview.');
  }else throw Error('Expected test, stills or record');
  assert.deepEqual(errors,[]);
}finally{if(encoder?.exitCode===null)encoder.kill();await browser?.close();}
