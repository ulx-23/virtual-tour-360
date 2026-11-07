import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Euler rotation matrix transformation (krpano-compatible gyro math)
 */
function rotateEuler(euler: { yaw: number; pitch: number; roll: number }, result: any) {
  const ch = Math.cos(euler.yaw);
  const sh = Math.sin(euler.yaw);
  const ca = Math.cos(euler.pitch);
  const sa = Math.sin(euler.pitch);
  const cb = Math.cos(euler.roll);
  const sb = Math.sin(euler.roll);

  const matrix = [
    sh * sb - ch * sa * cb, -ch * ca, ch * sa * sb + sh * cb,
    ca * cb, -sa, -ca * sb,
    sh * sa * cb + ch * sb, sh * ca, -sh * sa * sb + ch * cb,
  ];

  let heading: number, attitude: number, bank: number;
  if (matrix[3] > 0.9999) {
    heading = Math.atan2(matrix[2], matrix[8]);
    attitude = Math.PI / 2;
    bank = 0;
  } else if (matrix[3] < -0.9999) {
    heading = Math.atan2(matrix[2], matrix[8]);
    attitude = -Math.PI / 2;
    bank = 0;
  } else {
    heading = Math.atan2(-matrix[6], matrix[0]);
    bank = Math.atan2(-matrix[5], matrix[4]);
    attitude = Math.asin(matrix[3]);
  }

  result.yaw = heading;
  result.pitch = attitude;
  result.roll = bank;
}

function normalizeDeltaAngle(delta: number): number {
  let d = delta;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

describe('Gyroscope & DeviceOrientation Feature Suite', () => {
  it('should transform Euler angles to viewer coordinates without singularity crash', () => {
    const result: any = {};

    // 1. Level device holding upright in front of face
    rotateEuler({ yaw: 0, pitch: Math.PI / 4, roll: 0 }, result);
    expect(typeof result.yaw).toBe('number');
    expect(typeof result.pitch).toBe('number');
    expect(typeof result.roll).toBe('number');
    expect(Number.isNaN(result.yaw)).toBe(false);
    expect(Number.isNaN(result.pitch)).toBe(false);

    // 2. Test phone held upright in front of face (beta = 90 deg = Math.PI / 2 -> looking at horizon attitude = 0)
    rotateEuler({ yaw: 0, pitch: Math.PI / 2, roll: 0 }, result);
    expect(Number.isNaN(result.pitch)).toBe(false);
    expect(Math.abs(result.pitch)).toBeLessThan(0.01);
  });

  it('should normalize delta angles across the 360 degree boundary to prevent camera spinning', () => {
    // Scenario: user is at 359 degrees and turns to 1 degree
    const currentYaw = 0.017; // ~1 deg
    const previousYaw = 6.265; // ~359 deg
    const rawDelta = currentYaw - previousYaw; // -6.248 radians (~-358 deg)

    const normalized = normalizeDeltaAngle(rawDelta);
    // Should be small positive movement (~+2 deg = ~0.035 rad) instead of full spin!
    expect(Math.abs(normalized)).toBeLessThan(0.1);
    expect(normalized).toBeGreaterThan(0);
  });

  it('should verify standalone package contains full Gyroscope implementation', () => {
    const standaloneAppPath = path.resolve(__dirname, '../src/server/templates/standalone/app.js');
    const standaloneHtmlPath = path.resolve(__dirname, '../src/server/templates/standalone/index.html');
    const standaloneCssPath = path.resolve(__dirname, '../src/server/templates/standalone/style.css');

    expect(fs.existsSync(standaloneAppPath)).toBe(true);
    expect(fs.existsSync(standaloneHtmlPath)).toBe(true);
    expect(fs.existsSync(standaloneCssPath)).toBe(true);

    const appCode = fs.readFileSync(standaloneAppPath, 'utf-8');
    const htmlCode = fs.readFileSync(standaloneHtmlPath, 'utf-8');
    const cssCode = fs.readFileSync(standaloneCssPath, 'utf-8');

    // Check standalone app.js
    expect(appCode).toContain('DeviceOrientationControlMethod');
    expect(appCode).toContain('btnGyro');
    expect(appCode).toContain('controls.enableMethod(\'deviceOrientation\')');
    expect(appCode).toContain('controls.disableMethod(\'deviceOrientation\')');
    expect(appCode).toContain('requestPermission');

    // Check standalone index.html
    expect(htmlCode).toContain('id="btnGyro"');

    // Check standalone style.css
    expect(cssCode).toContain('.dock-btn.active');
    expect(cssCode).toContain('pulse-gyro');
  });

  it('should verify Next.js MarzipanoViewer contains Gyroscope feature and sensor indicators', () => {
    const viewerComponentPath = path.resolve(__dirname, '../src/components/viewer/MarzipanoViewer.tsx');
    expect(fs.existsSync(viewerComponentPath)).toBe(true);

    const viewerCode = fs.readFileSync(viewerComponentPath, 'utf-8');
    expect(viewerCode).toContain('createDeviceOrientationMethod');
    expect(viewerCode).toContain('handleToggleGyro');
    expect(viewerCode).toContain('controls.enableMethod(\'deviceOrientation\')');
    expect(viewerCode).toContain('controls.disableMethod(\'deviceOrientation\')');
    expect(viewerCode).toContain('isGyroActive');
    expect(viewerCode).toContain('GYRO AKTIF');
    expect(viewerCode).toContain('requestPermission');
  });
});
