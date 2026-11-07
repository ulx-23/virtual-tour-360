import fs from 'fs';
import path from 'path';
import { convertStandaloneZipToHtml } from '../src/server/standalone/single-html';

const input = process.argv[2];
if (!input) {
  console.error('Penggunaan: npm run export:html -- <paket-standalone.zip> [output.html]');
  process.exit(1);
}

const inputPath = path.resolve(input);
const outputPath = path.resolve(process.argv[3] || path.join(path.dirname(inputPath), 'virtual-tour.html'));
if (!fs.existsSync(inputPath)) throw new Error(`ZIP tidak ditemukan: ${inputPath}`);
if (fs.existsSync(outputPath)) throw new Error(`Output sudah ada, tidak ditimpa: ${outputPath}`);

const html = convertStandaloneZipToHtml(fs.readFileSync(inputPath));
fs.writeFileSync(outputPath, html, { flag: 'wx' });
console.log(`Single HTML dibuat: ${outputPath} (${Buffer.byteLength(html)} byte)`);
