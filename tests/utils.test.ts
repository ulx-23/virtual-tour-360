import { describe, it, expect } from 'vitest';
import { slugify, radToDeg, degToRad, formatBytes } from '../src/lib/utils';

describe('Utility Helpers', () => {
  it('correctly generates url-friendly slugs', () => {
    expect(slugify('Virtual Tour Kampus 2026!')).toBe('virtual-tour-kampus-2026');
    expect(slugify('  Ruang Lab & Komputer #1  ')).toBe('ruang-lab-komputer-1');
  });

  it('accurately converts radians and degrees', () => {
    expect(radToDeg(Math.PI)).toBe(180);
    expect(radToDeg(Math.PI / 2)).toBe(90);
    expect(degToRad(180)).toBeCloseTo(Math.PI);
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
  });

  it('formats byte sizes into readable units', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(5242880)).toBe('5 MB');
  });
});