import {createRequire} from 'node:module'; import os from 'node:os'; import path from 'node:path';
const {chromium} = createRequire(path.join(os.homedir(), '.claude/skills/teardown/x.js'))('playwright');
const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1280, height: 900}, colorScheme: 'dark'});
await p.goto('https://github.com/posts-design/mcp/tree/main/breakdown', {waitUntil: 'domcontentloaded', timeout: 60000}); await p.waitForTimeout(3000);
await p.screenshot({path: 'public/page/repo_tree.png'});
await p.mouse.wheel(0, 900); await p.waitForTimeout(1500); await p.screenshot({path: 'public/page/repo_readme.png'});
await b.close(); console.log('ok');
