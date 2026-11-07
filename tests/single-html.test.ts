import AdmZip from 'adm-zip';
import { describe, expect, it } from 'vitest';
import { convertStandaloneZipToHtml } from '@/server/standalone/single-html';

function fixture(missingPanorama = false): Buffer {
  const zip = new AdmZip();
  zip.addFile('index.html', Buffer.from('<html><head><link rel="stylesheet" href="./style.css"></head><body><script src="./vendor/marzipano.js"></script><script src="./tour-data.js"></script><script src="./app.js"></script></body></html>'));
  zip.addFile('style.css', Buffer.from('body{color:white}'));
  zip.addFile('vendor/marzipano.js', Buffer.from('window.Marzipano={};'));
  zip.addFile('app.js', Buffer.from('window.started=true;'));
  zip.addFile('tour-data.js', Buffer.from('window.TOUR_DATA = ' + JSON.stringify({ title: 'Test', startSceneId: 'a', scenes: [{ id: 'a', name: 'A', initialYaw: 0, initialPitch: 0, initialFov: 1.05, hotspots: [], panoramaUrl: './panoramas/a.jpg', thumbnailUrl: './panoramas/a.jpg' }], buildings: [] }) + ';'));
  if (!missingPanorama) zip.addFile('panoramas/a.jpg', Buffer.from([0xff, 0xd8, 0xff]));
  return zip.toBuffer();
}

describe('single HTML offline export', () => {
  it('inlines scripts, CSS, manifest, and panorama without remote asset paths', () => {
    const html = convertStandaloneZipToHtml(fixture());
    expect(html).toContain('data:image/jpeg;base64,');
    expect(html).toContain('<style>body{color:white}</style>');
    expect(html).not.toContain('src="./');
    expect(html).not.toContain('href="./');
  });

  it('rejects missing assets instead of claiming a successful export', () => {
    expect(() => convertStandaloneZipToHtml(fixture(true))).toThrow(/Arsip tidak lengkap/);
  });
});
