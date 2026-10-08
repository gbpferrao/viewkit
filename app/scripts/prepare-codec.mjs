import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const destination = new URL('../public/codec/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const name of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  await copyFile(new URL('../node_modules/@ffmpeg/core/dist/esm/' + name, import.meta.url), new URL(name, destination));
}
console.log('prepared local codec assets at ' + fileURLToPath(destination));

