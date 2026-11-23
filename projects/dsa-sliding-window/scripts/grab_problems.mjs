// Opens every problem the reel and the DM name, records the page title + the first lines of the statement (proof the
// title/number is real), and screenshots the LeetCode ones used on the quiz cards.
import {createRequire} from 'node:module'; import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const {chromium} = createRequire(path.join(os.homedir(), '.claude/skills/teardown/x.js'))('playwright');
const P = [
  ['lc643', 'https://leetcode.com/problems/maximum-average-subarray-i/'],
  ['lc3', 'https://leetcode.com/problems/longest-substring-without-repeating-characters/'],
  ['lc209', 'https://leetcode.com/problems/minimum-size-subarray-sum/'],
  ['lc438', 'https://leetcode.com/problems/find-all-anagrams-in-a-string/'],
  ['lc239', 'https://leetcode.com/problems/sliding-window-maximum/'],
  ['lc76', 'https://leetcode.com/problems/minimum-window-substring/'],
  ['lc1004', 'https://leetcode.com/problems/max-consecutive-ones-iii/'],
  ['gfg_firstneg', 'https://www.geeksforgeeks.org/problems/first-negative-integer-in-every-window-of-size-k3345/1'],
  ['gfg_maxsumk', 'https://www.geeksforgeeks.org/problems/max-sum-subarray-of-size-k5313/1'],
  ['gfg_anagram', 'https://www.geeksforgeeks.org/problems/count-occurences-of-anagrams5839/1'],
  ['cf279b', 'https://codeforces.com/problemset/problem/279/B'],
  ['cf1354b', 'https://codeforces.com/problemset/problem/1354/B'],
];
const b = await chromium.launch(); const out = {};
for (const [id, url] of P) {
  const p = await b.newPage({viewport: {width: 900, height: 1200}, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'});
  try {
    await p.goto(url, {waitUntil: 'domcontentloaded', timeout: 60000}); await p.waitForTimeout(6000);
    const title = await p.title(); const text = (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 1500);
    if (id.startsWith('lc')) await p.screenshot({path: `public/receipts/${id}.png`});
    out[id] = {url, title, text}; console.log(id, '|', title, '|', text.slice(0, 160));
  } catch (e) { out[id] = {url, error: e.message.slice(0, 100)}; console.log(id, 'FAILED', e.message.slice(0, 100)); }
  await p.close();
}
await b.close(); fs.writeFileSync('docs/problems.json', JSON.stringify(out, null, 1));
