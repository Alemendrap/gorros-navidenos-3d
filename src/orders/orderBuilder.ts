/** Construye la estructura de PEDIDO a partir del diseño actual. */
import type { Design, Order, ResolvedPlacementSnapshot } from '@/types';
import { catalog } from '@/config';
import { getDecoration } from '@/config/decorations';
import { resolvePlacement } from '@/engine/constraints';
import { measureTextAspect } from '@/engine/rasterize';
import { computePricing, formatPrice } from './pricing';
import { orderCode, uid } from '@/lib/id';

const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function buildOrder(design: Design, previewImage?: string): Order {
  const product = catalog.product();
  const font = catalog.font();
  const now = new Date();
  const snap = (zoneId: string, p: ReturnType<typeof resolvePlacement>): ResolvedPlacementSnapshot => ({
    zoneId, offset: { u: r3(p.u), v: r3(p.v) }, rotationDeg: r3(p.rotationDeg), width: r3(p.width), height: r3(p.height), fittedToZone: p.fitted,
  });

  const texts: Order['texts'] = [];
  const decorations: Order['decorations'] = [];
  for (const it of design.items) {
    const zone = catalog.zone(it.zoneId);
    if (!zone) continue;
    if (it.kind === 'text') {
      if (!it.text.trim()) continue;
      const p = resolvePlacement(it, zone, measureTextAspect(it.text.trim(), font).aspect);
      texts.push({ text: it.text.trim(), font: font.label, zone: zone.name, placement: snap(zone.id, p) });
    } else {
      const d = getDecoration(it.decorationId);
      if (!d) continue;
      decorations.push({ id: d.id, name: d.name, zone: zone.name, placement: snap(zone.id, resolvePlacement(it, zone, d.aspect)) });
    }
  }

  return {
    id: uid('ped'),
    code: orderCode(now),
    createdAt: now.toISOString(),
    status: 'confirmado',
    product: {
      id: product.id,
      name: product.name,
      modelRef: product.model.type === 'gltf' ? product.model.url : `procedural:${product.model.variant}`,
      finish: catalog.finish().label,
    },
    texts,
    decorations,
    pricing: computePricing(design),
    design: JSON.parse(JSON.stringify(design)),
    previewImage,
  };
}

export function orderSummaryLines(order: Order) {
  const lines: string[] = [];
  for (const t of order.texts) lines.push(`“${t.text}” · ${t.zone}`);
  for (const d of order.decorations) lines.push(`${d.name} · ${d.zone}`);
  if (!lines.length) lines.push('Gorro sin personalización');
  lines.push(`Total: ${formatPrice(order.pricing.total)}`);
  return lines;
}
