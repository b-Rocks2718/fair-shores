import { existsSync } from 'node:fs';
import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const path of ['index.html', 'src']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
if (existsSync('public')) {
  await cp('public', 'dist', { recursive: true });
}
console.log('Built static site in dist/');
