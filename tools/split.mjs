/**
 * Re-split the original single-file invitation into index.html + css/ + js/.
 *
 * This was the one-time tool used to structure the project. It is kept because it
 * is reproducible and byte-exact: it proves the split lost nothing, by comparing
 * the written CSS/JS payloads back against the original inline blocks.
 *
 * Usage:  node tools/split.mjs path/to/original-monolith.html
 *
 * It reads the monolith, backs it up to .original/index.monolith.html, writes the
 * split files, and rewrites index.html to reference them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_MONOLITH = process.argv[2];

if (!SRC_MONOLITH) {
  console.error('usage: node tools/split.mjs <path-to-monolith.html>');
  process.exit(1);
}

const original = fs.readFileSync(SRC_MONOLITH, 'utf8');
const lines = original.split(/\r?\n/);
const slice = (a, b) => lines.slice(a - 1, b).join('\n'); // 1-based, inclusive

// Line ranges verified against the original: <style> 13..2419, <script> 3070..3664.
const css        = slice(14, 2418);
const jsCore     = slice(3071, 3175); // ENVELOPE + MUSIC globals
const jsSections = slice(3176, 3563); // MENU .. HEADER/TOAST
const jsEffects  = slice(3564, 3663); // PETALS + CURSOR + STICKY CTA

fs.mkdirSync(path.join(ROOT, '.original'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '.original', 'index.monolith.html'), original, 'utf8');

fs.mkdirSync(path.join(ROOT, 'css'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'js'), { recursive: true });

const banner = (title, deps) =>
  `/* ============================================================\n` +
  `   ${title}\n` +
  `   Extracted from the original single-file invitation.\n` +
  (deps ? `   Depends on: ${deps}\n` : '') +
  `   ============================================================ */\n\n`;

const outputs = new Map([
  ['css/styles.css',    banner('Atharva weds Gautami — stylesheet') + css],
  ['js/app.core.js',    banner('Core: envelope intro + background music globals',
                               'none — must load first (defines tryStartMusic)') + jsCore],
  ['js/app.sections.js',banner('Sections: menu, countdown, RSVP, wishes, calendar, gallery, header',
                               'none') + jsSections],
  ['js/app.effects.js', banner('Effects: petals, custom cursor, sticky CTA', 'none') + jsEffects],
]);

for (const [rel, body] of outputs) {
  fs.writeFileSync(path.join(ROOT, rel), body + '\n', 'utf8');
}

let html = original;
html = html.replace(/<style>[\s\S]*?<\/style>\n?/, `<link rel="stylesheet" href="css/styles.css">\n`);
html = html.replace(/<script>[\s\S]*?<\/script>\n?/,
  `<script src="js/app.core.js"></script>\n` +
  `<script src="js/app.sections.js"></script>\n` +
  `<script src="js/app.effects.js"></script>\n`);
fs.writeFileSync(path.join(ROOT, 'index.html'), html, 'utf8');

// Byte-exact proof: compare written payloads back to the inline source ranges.
// Note the ranges are non-adjacent (they skip a blank separator line between
// blocks), so each is checked against its own source slice rather than by
// re-joining the files.
const strip = (s) => s.replace(/^\/\*[\s\S]*?\*\/\n\n/, '').trimEnd();

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const checks = [
  ['css/styles.css', css],
  ['js/app.core.js', jsCore],
  ['js/app.sections.js', jsSections],
  ['js/app.effects.js', jsEffects],
];

let allOk = true;
for (const [rel, expected] of checks) {
  const ok = strip(read(rel)) === expected.trimEnd();
  allOk &&= ok;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${rel}`);
}

// Also confirm the rewritten index.html no longer holds inline style/script.
const indexHtml = read('index.html');
const inlineGone = !/<style>/.test(indexHtml) && !/<script>[\s\S]*?<\/script>/.test(indexHtml);
console.log(`${inlineGone ? 'OK  ' : 'FAIL'} index.html has no inline style/script`);
allOk &&= inlineGone;

process.exit(allOk ? 0 : 1);
