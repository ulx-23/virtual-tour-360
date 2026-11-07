import { createHash } from 'node:crypto';
import { open, fromBuffer, type ZipFile, type Entry } from 'yauzl';
import { parseTourDataScript, relativeAssetPath, validateManifest } from './manifest';

const MAX_TEXT_BYTES = 8 * 1024 * 1024;
const MAX_PACKAGE_BYTES = 4 * 1024 * 1024 * 1024;
export const RUNTIME_FILES = ['index.html', 'app.js', 'style.css', 'vendor/marzipano.js', 'tour-data.js', 'README.txt'];
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value >>> 0;
});

export interface ArchiveFile { bytes: number; sha256: string }
export interface ValidationReport {
  valid: true;
  sceneCount: number;
  assetCount: number;
  totalBytes: number;
  warnings: string[];
  files: Record<string, ArchiveFile>;
}

/** Stream every entry, check CRC and content hashes, then resolve all manifest links. */
export async function validateStandaloneZip(source: string | Buffer): Promise<ValidationReport> {
  const zip = await new Promise<ZipFile>((resolve, reject) => {
    const callback = (error: Error | null, file?: ZipFile) => error || !file ? reject(error || new Error('ZIP tidak terbaca')) : resolve(file);
    const options = { lazyEntries: true, validateEntrySizes: true, strictFileNames: true };
    if (typeof source === 'string') open(source, options, callback);
    else fromBuffer(source, options, callback);
  });
  const files: Record<string, ArchiveFile> = Object.create(null);
  const text: Record<string, string> = Object.create(null);
  const seen = new Set<string>();
  let totalBytes = 0;
  try {
    await new Promise<void>((resolve, reject) => {
      zip.on('error', reject);
      zip.on('end', resolve);
      zip.on('entry', (entry: Entry) => {
        void (async () => {
          const name = entry.fileName;
          relativeAssetPath(`./${name.replace(/\/$/, '')}`);
          if (seen.has(name.toLowerCase())) throw new Error(`Path ZIP duplikat: ${name}`);
          seen.add(name.toLowerCase());
          if (seen.size > 10000) throw new Error('ZIP terlalu banyak file.');
          if ((entry.externalFileAttributes >>> 16 & 0xf000) === 0xa000) throw new Error(`Symlink ZIP ditolak: ${name}`);
          if (name.endsWith('/')) { zip.readEntry(); return; }
          if (/(^|\/)(\.env[^/]*|[^/]*\.(pem|key|sql))$/i.test(name)) throw new Error(`File privat ditolak: ${name}`);
          totalBytes += entry.uncompressedSize;
          if (totalBytes > MAX_PACKAGE_BYTES) throw new Error('Paket melebihi batas 4 GiB.');
          const keepText = ['tour-data.js', 'tour.json', 'integrity.json', 'index.html', 'style.css', 'app.js'].includes(name);
          if (keepText && entry.uncompressedSize > MAX_TEXT_BYTES) throw new Error(`File konfigurasi terlalu besar: ${name}`);
          const stream = await new Promise<NodeJS.ReadableStream>((res, rej) => zip.openReadStream(entry, (err, value) => err || !value ? rej(err) : res(value)));
          const chunks: Buffer[] = [];
          const hash = createHash('sha256');
          let crc = 0xffffffff;
          let bytes = 0;
          for await (const raw of stream) {
            const chunk = Buffer.from(raw);
            bytes += chunk.length;
            if (bytes > entry.uncompressedSize) throw new Error(`Ukuran ZIP tidak cocok: ${name}`);
            hash.update(chunk);
            for (const byte of chunk) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
            if (keepText) chunks.push(chunk);
          }
          if (bytes !== entry.uncompressedSize || ((crc ^ 0xffffffff) >>> 0) !== entry.crc32) throw new Error(`Integritas ZIP gagal: ${name}`);
          files[name] = { bytes, sha256: hash.digest('hex') };
          if (keepText) text[name] = Buffer.concat(chunks).toString('utf8');
          zip.readEntry();
        })().catch(reject);
      });
      zip.readEntry();
    });
  } finally { zip.close(); }

  for (const name of RUNTIME_FILES) {
    if (!files[name]?.bytes) throw new Error(`Arsip tidak lengkap: ${name}`);
  }
  const checked = validateManifest(parseTourDataScript(text['tour-data.js']));
  if (checked.manifest.manifestVersion) {
    if (!text['tour.json'] || !text['integrity.json']) throw new Error('Manifest atau laporan integritas tidak tersedia.');
    if (JSON.stringify(JSON.parse(text['tour.json'])) !== JSON.stringify(parseTourDataScript(text['tour-data.js']))) {
      throw new Error('tour.json tidak cocok dengan TOUR_DATA.');
    }
  }
  for (const name of checked.assets) {
    if (!files[name]?.bytes) throw new Error(`Arsip tidak lengkap: ${name}`);
  }
  // Automatic HTML/CSS references are local. External links are user actions only.
  const refs = [
    ...[...text['index.html'].matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]),
    ...[...text['style.css'].matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/gi)].map((match) => match[1]),
  ];
  for (const url of refs) {
    if (url.startsWith('#') || url.startsWith('data:')) continue;
    if (!files[relativeAssetPath(url)]?.bytes) throw new Error(`Resource template tidak tersedia: ${url}`);
  }
  if (/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/.test(text['app.js']) || /@import\s/i.test(text['style.css'])) {
    throw new Error('Runtime standalone mengandung dependensi jaringan yang tidak didukung.');
  }
  if (text['integrity.json']) {
    const expected = JSON.parse(text['integrity.json']) as { files: Record<string, ArchiveFile> };
    for (const [name, actual] of Object.entries(files)) {
      if (name === 'integrity.json') continue;
      if (expected.files?.[name]?.sha256 !== actual.sha256 || expected.files[name].bytes !== actual.bytes) {
        throw new Error(`Checksum aset tidak cocok: ${name}`);
      }
    }
    for (const name of Object.keys(expected.files || {})) if (!files[name]) throw new Error(`File checksum tidak tersedia: ${name}`);
  }
  return { valid: true, sceneCount: checked.manifest.scenes.length, assetCount: checked.assets.length, totalBytes, warnings: checked.warnings, files };
}
