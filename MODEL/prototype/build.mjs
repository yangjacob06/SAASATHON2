// Publish only browser assets. Never copy server code, environment files or docs.
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
const allowed = new Set(['.html', '.js', '.css', '.svg', '.woff2', '.ttf', '.csv', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.txt']);
async function copyDirectory(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const from = path.join(source, entry.name), to = path.join(destination, entry.name);
    if (entry.isDirectory()) await copyDirectory(from, to);
    else if (allowed.has(path.extname(entry.name))) await copyFile(from, to);
  }
}
// Only clean this generated directory, after checking its resolved boundary.
if (path.relative(root, output) !== 'dist' || path.dirname(output) !== root) throw new Error('Invalid build output directory');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && ['.html', '.css', '.js'].includes(path.extname(entry.name))) await copyFile(path.join(root, entry.name), path.join(output, entry.name));
}
for (const directory of ['assets', 'synthetic-data']) await copyDirectory(path.join(root, directory), path.join(output, directory));
// Pitch fixture samples are optional and are not tracked in this repository.
try { await copyDirectory(path.join(root, 'samples'), path.join(output, 'samples')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
console.log('Mandate browser assets prepared in dist; API deployed separately.');
