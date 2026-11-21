/**
 * RESTRICCIONES DE PERSONALIZACIÓN
 * Reglas puras (sin 3D) que deciden qué se puede poner, dónde y con qué tamaño.
 * El visor, la interfaz y la preparación del pedido usan exactamente las mismas reglas.
 */
import type { DecorationConfig, Design, DesignItem, ItemKind, ProductConfig, ZoneConfig } from '@/types';
import { getDecoration } from '@/config/decorations';

export interface ResolvedPlacement {
  width: number;
  height: number;
  u: number;
  v: number;
  rotationDeg: number;
  /** true si el elemento se redujo automáticamente para caber en la zona. */
  fitted: boolean;
  /** Rangos válidos para los controles de la interfaz. */
  ranges: { size: [number, number]; u: [number, number]; v: [number, number]; rotation: [number, number] };
}

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function sizeLimits(zone: ZoneConfig, deco?: DecorationConfig): [number, number] {
  const min = Math.max(zone.constraints.minSize, deco?.constraints?.minSize ?? 0);
  const max = Math.min(zone.constraints.maxSize, deco?.constraints?.maxSize ?? Infinity, zone.maxSize.height);
  return [Math.min(min, max), max];
}

export function rotationAllowed(zone: ZoneConfig, deco?: DecorationConfig) {
  return zone.constraints.allowRotation && (deco?.constraints?.allowRotation ?? true);
}

export function resolvePlacement(item: DesignItem, zone: ZoneConfig, aspect: number): ResolvedPlacement {
  const deco = item.kind === 'decoration' ? getDecoration(item.decorationId) : undefined;
  const [minS, maxS] = sizeLimits(zone, deco);
  const maxRot = rotationAllowed(zone, deco) ? zone.constraints.maxRotationDeg : 0;
  const rot = clamp(item.rotationDeg, -maxRot, maxRot);
  let h = clamp(item.size, minS, maxS);
  let w = h * Math.max(0.01, aspect);
  const r = (rot * Math.PI) / 180;
  const bbox = (ww: number, hh: number) => [
    Math.abs(ww * Math.cos(r)) + Math.abs(hh * Math.sin(r)),
    Math.abs(ww * Math.sin(r)) + Math.abs(hh * Math.cos(r)),
  ];
  let [bw, bh] = bbox(w, h);
  let fitted = false;
  const k = Math.min(1, zone.maxSize.width / bw, zone.maxSize.height / bh);
  if (k < 0.999) {
    w *= k; h *= k; fitted = true;
    [bw, bh] = bbox(w, h);
  }
  const uMax = zone.constraints.allowOffset ? Math.max(0, (zone.maxSize.width - bw) / 2) : 0;
  const vMax = zone.constraints.allowOffset ? Math.max(0, (zone.maxSize.height - bh) / 2) : 0;
  // Tamaño máximo real para este contenido (lo que cabe a lo ancho)
  const maxByWidth = zone.maxSize.width / Math.max(0.01, aspect);
  return {
    width: w,
    height: h,
    u: clamp(item.offset.u, -uMax, uMax),
    v: clamp(item.offset.v, -vMax, vMax),
    rotationDeg: rot,
    fitted,
    ranges: {
      size: [minS, Math.max(minS, Math.min(maxS, maxByWidth))],
      u: [-uMax, uMax],
      v: [-vMax, vMax],
      rotation: [-maxRot, maxRot],
    },
  };
}

export interface Check { ok: boolean; reason?: string }

export function canPlaceInZone(
  product: ProductConfig,
  design: Design,
  zone: ZoneConfig,
  kind: ItemKind,
  opts: { decorationId?: string; ignoreItemId?: string } = {},
): Check {
  if (!zone.enabled) return { ok: false, reason: 'Zona deshabilitada' };
  if (!product.zones.some((z) => z.id === zone.id)) return { ok: false, reason: 'La zona no pertenece a este gorro' };
  if (!zone.allowedKinds.includes(kind)) {
    return { ok: false, reason: kind === 'text' ? 'Esta zona no admite texto' : 'Esta zona no admite decoraciones' };
  }
  if (kind === 'decoration' && opts.decorationId) {
    const d = getDecoration(opts.decorationId);
    if (!d) return { ok: false, reason: 'Decoración no encontrada' };
    if (d.allowedZones !== '*' && !d.allowedZones.includes(zone.id)) return { ok: false, reason: 'Esta decoración no se permite aquí' };
    const cats = zone.allowedDecorationCategories;
    if (cats && cats.length && !cats.includes(d.category)) return { ok: false, reason: 'Categoría no permitida en esta zona' };
  }
  const used = design.items.filter((i) => i.zoneId === zone.id && i.id !== opts.ignoreItemId).length;
  if (used >= zone.maxItems) return { ok: false, reason: `Zona completa (máx. ${zone.maxItems})` };
  return { ok: true };
}

export function sanitizeText(text: string, zone: ZoneConfig) {
  // Sin saltos de línea; se respeta el límite de caracteres de la zona.
  return Array.from(text.replace(/[\r\n\t]+/g, ' ')).slice(0, zone.maxChars).join('');
}
