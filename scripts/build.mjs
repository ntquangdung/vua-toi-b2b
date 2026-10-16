import { mkdir, readFile, copyFile, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
if (dirname(output) !== root || relative(root, output) !== 'dist') {
  throw new Error('Build output must stay inside the project dist folder.');
}
const publicFiles = new Set([
  'index.html', 'styles.css', 'script.js', 'gift-picker.js', 'orders.js', 'site-config.js', '_headers',
  'assets/fonts/manrope-OFL.txt', 'assets/fonts/redrose-OFL.txt', 'assets/fonts/playfair-OFL.txt',
]);
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const css = await readFile(resolve(root, 'styles.css'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="(assets\/[^"?#]+)(?:[?#][^"]*)?"/g)) {
  publicFiles.add(match[1]);
}
for (const match of css.matchAll(/url\(['"]?(assets\/[^'"\s)]+)['"]?\)/g)) {
  publicFiles.add(match[1]);
}
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
for (const match of html.matchAll(/\bhref="#([^"]+)"/g)) {
  if (!ids.has(match[1])) throw new Error('Missing internal anchor: ' + match[1]);
}
// Check every source before replacing the generated output.
for (const name of publicFiles) {
  const source = resolve(root, name);
  if (relative(root, source).startsWith('..') || !(await stat(source)).isFile()) {
    throw new Error('Invalid public asset: ' + name);
  }
}
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
let bytes = 0;
for (const name of publicFiles) {
  const target = resolve(output, name);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(root, name), target);
  bytes += (await stat(target)).size;
}
console.log(`Built ${publicFiles.size} public files (${(bytes / 1024 / 1024).toFixed(2)} MB) into dist/.`);
console.log('Apps Script sources, tests and project documentation stay outside the public output.');
