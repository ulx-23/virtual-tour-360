import fs from 'fs/promises';
import path from 'path';

export interface StorageResult {
  storageKey: string;
  url: string;
}

export interface IStorageProvider {
  save(buffer: Buffer, filename: string, subfolder: string): Promise<StorageResult>;
  delete(storageKey: string): Promise<boolean>;
  getUrl(storageKey: string): string;
}

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'public', 'uploads');
  }

  async save(buffer: Buffer, filename: string, subfolder = 'general'): Promise<StorageResult> {
    const targetDir = path.join(this.baseDir, subfolder);
    await fs.mkdir(targetDir, { recursive: true });

    const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const targetPath = path.join(targetDir, safeFilename);

    await fs.writeFile(targetPath, buffer);

    const relativeKey = `uploads/${subfolder}/${safeFilename}`.replace(/\\/g, '/');
    return {
      storageKey: relativeKey,
      url: `/${relativeKey}`,
    };
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      const fullPath = path.join(process.cwd(), 'public', storageKey);
      await fs.unlink(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(storageKey: string): string {
    return `/${storageKey.replace(/^\//, '')}`;
  }
}

export const storage = new LocalStorageProvider();