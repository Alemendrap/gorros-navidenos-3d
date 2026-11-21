/**
 * Texturas de relieve generadas en tiempo de ejecución (sin archivos de imagen):
 * - velvet: microtextura de terciopelo para el cuerpo.
 * - fur: pelo/felpa para el borde y el pompón.
 * Se generan una sola vez y se cachean.
 */
import * as THREE from 'three';
import { noise3 } from '@/lib/noise';

const cache = new Map<string, THREE.Texture>();

function heightToNormal(h: Float32Array, size: number, strength: number) {
  const data = new Uint8Array(new ArrayBuffer(size * size * 4));
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const l = Math.hypot(dx, dy, 1);
      const k = (y * size + x) * 4;
      data[k] = ((-dx / l) * 0.5 + 0.5) * 255;
      data[k + 1] = ((-dy / l) * 0.5 + 0.5) * 255;
      data[k + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      data[k + 3] = 255;
    }
  }
  return data;
}

function tileableNoise(size: number, freq: number, octaves: number, seed: number) {
  const h = new Float32Array(size * size);
  // Ruido periódico muestreado sobre un toro 4D aproximado → textura sin costuras.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const a = (x / size) * Math.PI * 2, b = (y / size) * Math.PI * 2;
      let v = 0, amp = 1, f = freq;
      for (let o = 0; o < octaves; o++) {
        v += amp * noise3(Math.cos(a) * f + seed, Math.sin(a) * f + Math.cos(b) * f, Math.sin(b) * f + seed * 0.7);
        amp *= 0.5; f *= 2;
      }
      h[y * size + x] = v;
    }
  }
  return h;
}

function makeTexture(key: string, size: number, build: () => Uint8Array<ArrayBuffer>, repeat: [number, number]) {
  const hit = cache.get(key);
  if (hit) return hit;
  const tex = new THREE.DataTexture(build() as Uint8Array<ArrayBuffer>, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

export function getVelvetNormal() {
  const size = 256;
  return makeTexture('velvet', size, () => {
    const h = tileableNoise(size, 6, 4, 1.3);
    return heightToNormal(h, size, 1.6);
  }, [6, 10]);
}

export function getFurNormal(repeat: [number, number] = [14, 2]) {
  const size = 256;
  return makeTexture(`fur-${repeat.join('x')}`, size, () => {
    const h = tileableNoise(size, 14, 4, 4.1);
    const g = tileableNoise(size, 3, 2, 9.2);
    for (let i = 0; i < h.length; i++) h[i] = h[i] * 0.8 + g[i] * 0.6;
    return heightToNormal(h, size, 3.2);
  }, repeat);
}
