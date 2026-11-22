// Deterministic phone proof from the same canvas that HyperFrames seeks.
import {createServer} from 'node:http';
import {createReadStream, existsSync, mkdirSync, writeFileSync, statSync} from 'node:fs';
import {dirname, extname, join, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(join(root,'../../tools/motion-studio/package.json'));
const puppeteer=require('puppeteer-core');
const chrome=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome'].find(path=>path&&existsSync(path));
const mime={'.html':'text/html','.js':'application/javascript','.ttf':'font/ttf','.woff2':'font/woff2','.webp':'image/webp','.jpg':'image/jpeg','.wav':'audio/wav'};
const server=createServer((req,res)=>{
  const urlPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const archives={'/nightshift-v1.html':'docs/nightshift-v1.html.txt','/aakhri-cutting-v2.html':'docs/aakhri-cutting-v2.html.txt'};
  const path=Object.hasOwn(archives,urlPath)?join(root,archives[urlPath]):resolve(root,'.'+urlPath);
  if(!path.startsWith(root+sep)||!existsSync(path)||!statSync(path).isFile()){res.writeHead(404).end();return}
  res.setHeader('Content-Type',mime[extname(urlPath)]||'application/octet-stream');createReadStream(path).pipe(res);
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--force-color-profile=srgb','--hide-scrollbars']});
const oldCut=process.argv.includes('--v1');
const out=join(root,'out',oldCut?'preview':'cutting-preview');mkdirSync(out,{recursive:true});
try{
  const page=await browser.newPage();
  page.on('pageerror',e=>console.error(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+(oldCut?'/nightshift-v1.html':'/aakhri-cutting-v2.html'));
  await page.evaluate(()=>window.nightshiftReady);
  await page.evaluate(old=>window.setPictureSize(old?540:720,old?960:1280),oldCut);
  async function frame(t,mime,quality){
    const encoded=await page.evaluate(({t,mime,quality})=>{window.seek(t);return document.querySelector('canvas').toDataURL(mime,quality).split(',')[1]},{t,mime,quality});
    return Buffer.from(encoded,'base64');
  }
  if(process.argv.includes('--stills')){
    for(const t of oldCut?[0,.9,3.35,5.6,8.7,12.6,17.3,20.45,22.7,24.76]:[0,1.12,4.62,8.15,10.15,12.72,14.9,17.5,20.55,24.76]){
      const filename='frame-'+String(Math.round(t*100)).padStart(4,'0')+'.jpg';
      writeFileSync(join(out,filename),await frame(t,'image/jpeg',.94));
    }
    console.log('Wrote ten review frames to '+out);
  } else {
    const fps=30,seconds=await page.evaluate(()=>(window.cuttingEdit??window.nightshiftEdit).duration);
    const target=join(out,oldCut?'nightshift-preview.mp4':'aakhri-cutting-preview.mp4');
    const soundtrack=join(root,'public/audio',oldCut?'mix_nightshift.wav':'aakhri-cutting.wav');
    const child=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-c:v','mjpeg','-framerate',String(fps),'-i','pipe:0','-i',soundtrack,'-map','0:v','-map','1:a','-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-preset','fast','-crf','17','-color_primaries','bt709','-colorspace','bt709','-color_trc','bt709','-color_range','tv','-c:a','aac','-b:a','192k','-movflags','+faststart','-t',String(seconds),target],{stdio:['pipe','inherit','inherit']});
    const closed=once(child,'close');
    for(let f=0;f<Math.round(fps*seconds);f++){
      if(!child.stdin.write(await frame(f/fps,'image/jpeg',.95)))await once(child.stdin,'drain');
      if(f%120===0)console.log('Frame '+f+' / '+Math.round(fps*seconds));
    }
    child.stdin.end();const [code]=await closed;
    if(code!==0)throw new Error('ffmpeg returned '+code);
    console.log(target);
  }
}finally{await browser.close();server.close();}
