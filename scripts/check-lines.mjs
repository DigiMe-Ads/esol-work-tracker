// Fails if any source file is longer than MAX lines. Run with: npm run check:lines
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const MAX = 200;
const ROOTS = ['src', 'supabase', 'scripts'];
const EXT = /\.(tsx?|css|sql|mjs|js|html)$/;
const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (EXT.test(name)) yield path;
  }
}

const files = ROOTS.flatMap((r) => [...walk(join(decodeURIComponent(root), r))]);
const rows = files.map((f) => ({ file: relative(decodeURIComponent(root), f), lines: readFileSync(f, 'utf8').split('\n').length }));
const tooLong = rows.filter((r) => r.lines > MAX);

const longest = [...rows].sort((a, b) => b.lines - a.lines).slice(0, 5);
console.log(`${rows.length} files checked. Longest:`);
for (const r of longest) console.log(`  ${String(r.lines).padStart(4)}  ${r.file}`);

if (tooLong.length) {
  console.error(`\n${tooLong.length} file(s) over ${MAX} lines:`);
  for (const r of tooLong) console.error(`  ${r.lines}  ${r.file}`);
  process.exit(1);
}
console.log(`\nAll files are ${MAX} lines or fewer.`);
