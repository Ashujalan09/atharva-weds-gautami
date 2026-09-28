/**
 * Generic Chrome DevTools Protocol helper: load a URL, optionally click an element
 * with TRUSTED input, report console/network errors, and screenshot.
 *
 *   node tools/cdp-shot.mjs <url> <out.png> [clickSelector] [width] [height]
 *
 * Kept because verifying this page needs a real browser (the layout is
 * IntersectionObserver- and animation-driven) and headless Chrome's file://
 * behaviour differs from HTTP.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [url, out, clickArg, wArg, hArg] = process.argv.slice(2);
const clickSel = clickArg && clickArg.trim() && clickArg.trim() !== '-'
  ? clickArg.trim()
  : null;
if (!url || !out) {
  console.error('usage: node tools/cdp-shot.mjs <url> <out.png> [clickSelector] [width] [height]');
  process.exit(1);
}
const W = Number(wArg || 1440);
const H = Number(hArg || 900);
const CHROME = process.env.DSH_CHROME ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DP = 9300 + Math.floor(Math.random() * 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-crash-reporter', '--disable-breakpad', '--no-first-run',
  '--disable-gpu', '--hide-scrollbars', '--mute-audio',
  `--remote-debugging-port=${DP}`,
  `--user-data-dir=${process.env.TEMP}\\dsh-cdp-${DP}`,
  `--window-size=${W},${H}`,
  url,
], { stdio: 'ignore' });

let page;
for (let i = 0; i < 60; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${DP}/json/list`)).json();
    page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
    if (page) break;
  } catch {}
  await sleep(250);
}
if (!page) { console.error('devtools endpoint never came up'); chrome.kill(); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let id = 0;
const pending = new Map();
const problems = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') {
    problems.push('EXCEPTION: ' +
      (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]);
  }
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
    problems.push('ERROR: ' + m.params.entry.text.slice(0, 140));
  }
};

const send = (method, params = {}) => {
  const i = ++id;
  ws.send(JSON.stringify({ id: i, method, params }));
  return new Promise((r) => pending.set(i, r));
};
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return r.result?.value ?? (r.exceptionDetails ? 'THREW' : undefined);
};

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
await sleep(1600);
problems.length = 0; // drop load-time noise gathered before we attached

if (clickSel) {
  const rect = await evaluate(`(function(){
    var el = document.querySelector('${clickSel}');
    if (!el) return null;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return 'ZERO';
    return JSON.stringify({x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2)});
  })()`);
  if (rect && rect !== 'ZERO') {
    const { x, y } = JSON.parse(rect);
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', {
        type, x, y, button: 'left', clickCount: 1, buttons: type === 'mousePressed' ? 1 : 0,
      });
    }
    await sleep(2600);
  } else {
    console.log(`click target ${clickSel}: ${rect === 'ZERO' ? 'zero-size (not visible)' : 'not found'}`);
  }
}

const shot = await send('Page.captureScreenshot', {
  format: 'png',
  clip: { x: 0, y: 0, width: W, height: H, scale: 1 },
  captureBeyondViewport: true,
});
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('problems:', problems.length ? JSON.stringify(problems, null, 1) : 'none');
console.log('screenshot:', out);

ws.close();
chrome.kill();
process.exit(0);
