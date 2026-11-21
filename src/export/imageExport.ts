/**
 * EXPORTACIÓN DE IMÁGENES del diseño.
 * Compone el render 3D sobre una tarjeta con la estética de la villa.
 */
import { appConfig } from '@/config';

function load(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

/** Recorta los bordes transparentes del render para centrar el gorro. */
function trimTransparent(img: HTMLImageElement) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (x1 <= x0 || y1 <= y0) return { canvas: c, sx: 0, sy: 0, sw: width, sh: height };
  return { canvas: c, sx: x0, sy: y0, sw: x1 - x0 + 2, sh: y1 - y0 + 2 };
}

export interface ComposeOptions {
  title: string;
  subtitle?: string;
  lines: string[];
  code?: string;
}

export async function composeDesignImage(renderUrl: string, opts: ComposeOptions) {
  if (document.fonts) {
    await Promise.allSettled([
      document.fonts.load('700 64px "Cormorant Garamond"', opts.title),
      document.fonts.load('600 26px Montserrat'),
      document.fonts.load('500 28px Montserrat'),
    ]);
  }
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;

  // Fondo crema con halo cálido
  const bg = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.45, W * 0.9);
  bg.addColorStop(0, '#FFFDF7');
  bg.addColorStop(0.55, '#F6ECD9');
  bg.addColorStop(1, '#E9D9BC');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Destellos dorados sutiles
  ctx.fillStyle = 'rgba(201,162,74,0.25)';
  for (let i = 0; i < 70; i++) {
    const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * W, y = (Math.cos(i * 37.3) * 0.5 + 0.5) * H * 0.75;
    ctx.beginPath(); ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2); ctx.fill();
  }

  // Marco dorado
  ctx.strokeStyle = '#C9A24A';
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // Encabezado
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9C7A2E';
  ctx.font = '600 26px Montserrat, sans-serif';
  ctx.fillText(appConfig.villageName.toUpperCase().split('').join(' '), W / 2, 112);
  ctx.fillStyle = '#7E0B1F';
  ctx.font = '700 64px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(opts.title, W / 2, 180);
  if (opts.subtitle) {
    ctx.fillStyle = '#5b463c';
    ctx.font = '500 26px Montserrat, sans-serif';
    ctx.fillText(opts.subtitle, W / 2, 222);
  }

  // Render del gorro
  const img = await load(renderUrl);
  const t = trimTransparent(img);
  const boxW = W - 200, boxH = 760, boxY = 250;
  const k = Math.min(boxW / t.sw, boxH / t.sh);
  const dw = t.sw * k, dh = t.sh * k;
  ctx.drawImage(t.canvas, t.sx, t.sy, t.sw, t.sh, (W - dw) / 2, boxY + (boxH - dh) / 2, dw, dh);

  // Resumen
  let y = 1080;
  ctx.fillStyle = '#2A1A14';
  ctx.font = '500 28px Montserrat, sans-serif';
  for (const line of opts.lines.slice(0, 5)) {
    ctx.fillText(line.length > 60 ? line.slice(0, 57) + '…' : line, W / 2, y);
    y += 42;
  }
  if (opts.code) {
    ctx.fillStyle = '#9C7A2E';
    ctx.font = '600 22px Montserrat, sans-serif';
    ctx.fillText(opts.code, W / 2, H - 76);
  }
  return c.toDataURL('image/png');
}

export async function makeThumbnail(dataUrl: string, size = 320) {
  const img = await load(dataUrl);
  const t = trimTransparent(img);
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#F6ECD9';
  ctx.fillRect(0, 0, size, size);
  const k = Math.min((size * 0.9) / t.sw, (size * 0.9) / t.sh);
  ctx.drawImage(t.canvas, t.sx, t.sy, t.sw, t.sh, (size - t.sw * k) / 2, (size - t.sh * k) / 2, t.sw * k, t.sh * k);
  return c.toDataURL('image/jpeg', 0.82);
}

export function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function dataUrlToFile(url: string, filename: string) {
  const blob = await (await fetch(url)).blob();
  return new File([blob], filename, { type: blob.type });
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
