import path from 'path';

/** Keep the file extension and storage path stable when changing a media label. */
export function validateMediaFilename(currentFilename: string, proposedFilename: string): string {
  const filename = proposedFilename.trim();

  if (!filename || filename.length > 180) {
    throw new Error('Nama file harus berisi 1–180 karakter.');
  }
  if (/[\\/:*?"<>|\x00-\x1f]/.test(filename) || filename.endsWith('.') || filename === '.' || filename === '..') {
    throw new Error('Nama file mengandung karakter yang tidak diperbolehkan.');
  }

  const currentExtension = path.extname(currentFilename).toLowerCase();
  const nextExtension = path.extname(filename).toLowerCase();
  const basename = nextExtension ? filename.slice(0, -nextExtension.length) : filename;
  if (currentExtension !== nextExtension || !basename.trim()) {
    throw new Error(`Ekstensi file harus tetap ${currentExtension || '(tanpa ekstensi)'}.`);
  }

  return filename;
}
