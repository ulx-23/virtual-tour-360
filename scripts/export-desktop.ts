import path from 'node:path';
import fsp from 'node:fs/promises';
import { extractVerifiedTour } from '../src/server/standalone/extract';

async function main() {
  const [input, destination] = process.argv.slice(2);
  if (!input || !destination) throw new Error('Gunakan: npm run export:desktop -- tour.zip folder-baru');
  const root = path.resolve(destination);
  await fsp.mkdir(root); // Refuse to overwrite an existing project.
  await extractVerifiedTour(path.resolve(input), path.join(root, 'tour'));
  await fsp.copyFile('src/server/templates/desktop/main.cjs', path.join(root, 'main.cjs'));
  // Run only the trusted local server shipped with this builder, not one supplied by a ZIP.
  await fsp.copyFile('src/server/templates/standalone/serve.cjs', path.join(root, 'serve.cjs'));
  await fsp.writeFile(path.join(root, 'package.json'), JSON.stringify({
    name: 'virtual-tour-offline', productName: 'VirtualTour', version: '1.0.0', private: true,
    main: 'main.cjs', description: 'Offline virtual tour',
    scripts: {
      start: 'electron .',
      'package:win': 'electron-packager . VirtualTour --platform=win32 --arch=x64 --out=dist --asar --ignore="^/dist($|/)"',
    },
    devDependencies: { electron: '45.2.3', '@electron/packager': '20.3.0' },
  }, null, 2), { flag: 'wx' });
  await fsp.writeFile(path.join(root, 'README.txt'), 'Build di Windows: npm install, lalu npm run package:win. Jalankan dist/VirtualTour-win32-x64/VirtualTour.exe. Seluruh folder distribusi wajib ikut disalin; komputer pengunjung tidak membutuhkan Node.js. File EXE belum ditandatangani. Link eksternal diblokir dalam aplikasi offline.\n', { flag: 'wx' });
  console.log(`Proyek desktop siap: ${root}. Jalankan npm install dan npm run package:win di folder ini.`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
