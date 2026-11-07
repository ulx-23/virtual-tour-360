import fsp from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { open, type ZipFile, type Entry } from 'yauzl';
import { relativeAssetPath } from './manifest';
import { validateStandaloneZip } from './validate-zip';

export async function extractVerifiedTour(zipPath: string, destination: string) {
  await validateStandaloneZip(zipPath);
  await fsp.mkdir(destination); // Exclusive new directory: no existing files can be replaced.
  const root = await fsp.realpath(destination);
  const zip = await new Promise<ZipFile>((resolve, reject) => open(zipPath, { lazyEntries: true, strictFileNames: true }, (error, value) => error || !value ? reject(error) : resolve(value)));
  try {
    await new Promise<void>((resolve, reject) => {
      zip.on('error', reject);
      zip.on('end', resolve);
      zip.on('entry', (entry: Entry) => {
        void (async () => {
          const relative = relativeAssetPath(`./${entry.fileName.replace(/\/$/, '')}`);
          const target = path.resolve(root, relative);
          if (!target.startsWith(root + path.sep)) throw new Error('Path ekstraksi tidak aman.');
          if (entry.fileName.endsWith('/')) await fsp.mkdir(target, { recursive: true });
          else {
            await fsp.mkdir(path.dirname(target), { recursive: true });
            const stream = await new Promise<import('node:stream').Readable>((res, rej) => zip.openReadStream(entry, (error, value) => error || !value ? rej(error) : res(value)));
            await pipeline(stream, fs.createWriteStream(target, { flags: 'wx' }));
          }
          zip.readEntry();
        })().catch(reject);
      });
      zip.readEntry();
    });
  } finally { zip.close(); }
}
