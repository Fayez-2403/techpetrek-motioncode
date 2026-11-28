import {spawnSync} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'mumbai-bundle-'));
async function dataUrl(relative, mime) {
  const bytes = await readFile(resolve(root, relative));
  return 'data:' + mime + ';base64,' + bytes.toString('base64');
}
try {
  const bundle = join(temp, 'game.js');
  const built = spawnSync('bun', ['build', 'src/main.js', '--target=browser', '--format=iife', '--minify', '--outfile', bundle], {cwd:root, stdio:'inherit'});
  if (built.error || built.status !== 0) throw built.error || Error('Bundling failed');
  const js = (await readFile(bundle, 'utf8')).replace('BRAND_DATA', await dataUrl('../public/brand/techpe-trek.jpg','image/jpeg'));
  const shell = await readFile(join(root,'game-shell.html'),'utf8');
  const font = await dataUrl('../public/fonts/Archivo-VF.ttf','font/ttf');
  const audio = await dataUrl('../public/audio/mumbai-drive.m4a','audio/mp4');
  const license = await readFile(join(root,'node_modules/three/LICENSE'),'utf8');
  const fontLicense = await readFile(resolve(root,'../public/fonts/OFL-Archivo.txt'),'utf8');
  const html = shell.replace('FONT_DATA',()=>font).replace('AUDIO_DATA',()=>audio)
    .replace('SCRIPT_DATA',()=>js.replace(/<\/script/gi,'<\\/script'))
    .replace('</html>',()=>'<!-- Third-party notices\n'+license+'\n'+fontLicense+'\n-->\n</html>');
  await writeFile(join(root,'play-mumbai.html'),html);
  console.log('Built offline game ('+(Buffer.byteLength(html)/1048576).toFixed(1)+' MiB).');
} finally {
  await rm(temp,{recursive:true,force:true});
}
