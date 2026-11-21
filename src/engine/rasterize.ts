/**
 * RASTERIZADO de textos e imágenes a texturas para el vinilo.
 * Genera:
 *  - mask: cobertura (blanco sobre negro) → alphaMap
 *  - normal: relieve del borde del vinilo → normalMap (el vinilo "atrapa" la luz en sus bordes)
 *  - color: (solo imágenes) color original → map
 */
import * as THREE from 'three';
import type { FontConfig } from '@/types';

export interface Raster {
  mask: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
  color?: THREE.CanvasTexture;
  aspect: number;
}

const LINE_PX = 220;

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(w));
  c.height = Math.max(2, Math.round(h));
  return c;
}

function blur(src: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  const win = r * 2 + 1;
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / win;
      acc += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / win;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

function normalFromMask(mask: HTMLCanvasElement, strength: number) {
  const w = mask.width, h = mask.height;
  const ctx = mask.getContext('2d', { willReadFrequently: true })!;
  const src = ctx.getImageData(0, 0, w, h).data;
  const cov = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) cov[i] = src[i * 4 + 1] / 255;
  const r = Math.max(1, Math.round(Math.min(w, h) / 110));
  const hgt = blur(blur(cov, w, h, r), w, h, r);
  const out = makeCanvas(w, h);
  const octx = out.getContext('2d')!;
  const img = octx.createImageData(w, h);
  const s = strength * 6;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const dx = (hgt[y * w + Math.min(w - 1, x + 1)] - hgt[y * w + Math.max(0, x - 1)]) * s;
      const dy = (hgt[Math.min(h - 1, y + 1) * w + x] - hgt[Math.max(0, y - 1) * w + x]) * s;
      const l = Math.hypot(dx, dy, 1);
      img.data[i * 4] = (-dx / l * 0.5 + 0.5) * 255;
      img.data[i * 4 + 1] = (dy / l * 0.5 + 0.5) * 255; // eje Y de canvas invertido respecto a UV
      img.data[i * 4 + 2] = (1 / l * 0.5 + 0.5) * 255;
      img.data[i * 4 + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

function tex(c: HTMLCanvasElement, srgb = false) {
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

export function fontCss(font: FontConfig, px: number) {
  return `${font.weight} ${px}px "${font.family}", Georgia, serif`;
}

/** Mide la relación ancho/alto que tendrá un texto (sin crear texturas). */
export function measureTextAspect(text: string, font: FontConfig) {
  const px = LINE_PX * 0.72 * (font.sizeAdjust ?? 1);
  const c = measureCtx();
  c.font = fontCss(font, px);
  const m = c.measureText(text || ' ');
  const left = m.actualBoundingBoxLeft || 0;
  const right = m.actualBoundingBoxRight || m.width;
  const pad = LINE_PX * 0.08;
  return { aspect: (left + right + pad * 2) / LINE_PX, px, left, right, pad };
}

let _mctx: CanvasRenderingContext2D | null = null;
const measureCtx = () => (_mctx ??= document.createElement('canvas').getContext('2d')!);

export function rasterizeText(text: string, font: FontConfig, relief: number): Raster {
  const { aspect, px, left, pad } = measureTextAspect(text, font);
  let w = aspect * LINE_PX;
  let scale = 1;
  if (w > 4096) { scale = 4096 / w; w = 4096; }
  const h = LINE_PX * scale;
  const mask = makeCanvas(w, h);
  const ctx = mask.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, mask.width, mask.height);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fff';
  ctx.font = fontCss(font, px);
  ctx.textBaseline = 'alphabetic';
  // Línea base a ~70% de la altura de línea: deja espacio para mayúsculas, acentos y descendentes.
  ctx.fillText(text, pad + left, LINE_PX * 0.7);
  const normal = normalFromMask(mask, relief);
  return { mask: tex(mask), normal: tex(normal), aspect };
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string) {
  let p = imageCache.get(src);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      img.src = src;
    });
    imageCache.set(src, p);
  }
  return p;
}

export function rasterizeImage(img: HTMLImageElement, relief: number, maxPx = 512): Raster {
  const iw = img.naturalWidth || img.width || 512;
  const ih = img.naturalHeight || img.height || 512;
  const k = maxPx / Math.max(iw, ih);
  const w = iw * k, h = ih * k;
  const color = makeCanvas(w, h);
  const cctx = color.getContext('2d', { willReadFrequently: true })!;
  cctx.drawImage(img, 0, 0, color.width, color.height);
  const mask = makeCanvas(w, h);
  const mctx = mask.getContext('2d', { willReadFrequently: true })!;
  const data = cctx.getImageData(0, 0, color.width, color.height);
  const m = mctx.createImageData(color.width, color.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const a = data.data[i + 3];
    m.data[i] = m.data[i + 1] = m.data[i + 2] = a;
    m.data[i + 3] = 255;
  }
  mctx.putImageData(m, 0, 0);
  const normal = normalFromMask(mask, relief);
  return { mask: tex(mask), normal: tex(normal), color: tex(color, true), aspect: w / h };
}

/** Textura para el indicador de zona (marco discontinuo con etiqueta). */
export function rasterizeZoneIndicator(label: string, aspect: number) {
  const h = 256, w = Math.min(2048, Math.round(h * aspect));
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  const r = 26, lw = 7, m = lw;
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = lw;
  ctx.setLineDash([26, 18]);
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(m, m, w - m * 2, h - m * 2, r);
  else ctx.rect(m, m, w - m * 2, h - m * 2); // Safari antiguos
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '600 34px Montserrat, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  if (label) ctx.fillText(label.toUpperCase(), w / 2, h / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
