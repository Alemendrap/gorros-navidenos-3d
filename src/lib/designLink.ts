/**
 * ENLACE DE DISEÑO: guarda todo el diseño dentro de la dirección (después de "#d=").
 * Así el taller abre el enlace y ve exactamente el mismo gorro en 3D, sin servidor ni base de datos.
 */
import type { Design, DesignItem } from '@/types';
import { appConfig, catalog } from '@/config';
import { uid } from './id';

const r = (n: number) => Math.round(n * 1000) / 1000;

type Packed = [kind: 't' | 'd', zoneId: string, u: number, v: number, rot: number, size: number, value: string];

function toB64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(s: string) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeDesign(design: Design, code?: string) {
  const items: Packed[] = design.items
    .filter((i) => i.kind !== 'text' || i.text.trim())
    .map((i) => [i.kind === 'text' ? 't' : 'd', i.zoneId, r(i.offset.u), r(i.offset.v), r(i.rotationDeg), r(i.size), i.kind === 'text' ? i.text.trim() : i.decorationId]);
  return toB64Url(JSON.stringify({ v: 1, c: code ?? '', i: items }));
}

export function decodeDesign(payload: string): { design: Design; code: string } | null {
  try {
    const data = JSON.parse(fromB64Url(payload)) as { v: number; c: string; i: Packed[] };
    if (data.v !== 1 || !Array.isArray(data.i)) return null;
    const now = new Date().toISOString();
    const items: DesignItem[] = data.i
      .filter((p) => catalog.zone(String(p[1])))
      .map((p) => {
        const base = { id: uid(p[0] === 't' ? 'txt' : 'dec'), zoneId: String(p[1]), offset: { u: Number(p[2]) || 0, v: Number(p[3]) || 0 }, rotationDeg: Number(p[4]) || 0, size: Number(p[5]) || 0.2 };
        return p[0] === 't'
          ? { ...base, kind: 'text' as const, text: String(p[6]).slice(0, 40) }
          : { ...base, kind: 'decoration' as const, decorationId: String(p[6]) };
      });
    return { design: { id: uid('dis'), productId: catalog.product().id, items, createdAt: now, updatedAt: now }, code: String(data.c || '') };
  } catch {
    return null;
  }
}

/** Dirección completa para ver el diseño en 3D. */
export function designUrl(design: Design, code?: string) {
  const base = appConfig.publicUrl || `${location.origin}${location.pathname}`;
  return `${base}#d=${encodeDesign(design, code)}`;
}

/** Lee un diseño compartido desde la dirección actual, si lo hay. */
export function readSharedDesignFromUrl() {
  const m = location.hash.match(/^#d=([A-Za-z0-9_-]+)/);
  return m ? decodeDesign(m[1]) : null;
}
