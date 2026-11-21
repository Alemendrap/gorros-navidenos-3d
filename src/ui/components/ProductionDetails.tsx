import type { Design } from '@/types';
import { catalog } from '@/config';
import { getDecoration } from '@/config/decorations';
import { resolvePlacement } from '@/engine/constraints';
import { measureTextAspect } from '@/engine/rasterize';
import { useFontStore } from '@/engine/fontLoader';
import { computePricing, formatPrice } from '@/orders/pricing';

const cm = (u: number) => `${(u * 10).toFixed(1).replace('.', ',')} cm`;

/** Ficha de producción: lo que el taller necesita para fabricar el gorro. */
export function ProductionDetails({ design }: { design: Design }) {
  useFontStore((s) => s.version);
  const font = catalog.font();
  const rows = design.items.flatMap((it) => {
    const zone = catalog.zone(it.zoneId);
    if (!zone) return [];
    if (it.kind === 'text') {
      if (!it.text.trim()) return [];
      const p = resolvePlacement(it, zone, measureTextAspect(it.text.trim(), font).aspect);
      return [{ id: it.id, title: it.text.trim(), kind: 'Texto', zone: zone.name, p, isText: true }];
    }
    const d = getDecoration(it.decorationId);
    if (!d) return [];
    return [{ id: it.id, title: d.name, kind: 'Diseño', zone: zone.name, p: resolvePlacement(it, zone, d.aspect), isText: false }];
  });
  return (
    <div className="space-y-2" data-testid="production-details">
      {rows.length === 0 && <p className="text-sm text-tinta/60">Gorro sin personalización.</p>}
      {rows.map((r, i) => (
        <div key={r.id} className="card p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`min-w-0 truncate ${r.isText ? 'text-2xl text-oro-dark' : 'font-semibold'}`} style={r.isText ? { fontFamily: `"${font.family}"` } : undefined}>
              {i + 1}. {r.title}
            </span>
            <span className="label shrink-0">{r.kind}</span>
          </div>
          <p className="mt-1 text-xs text-tinta/65">
            {r.zone} · alto {cm(r.p.height)} · ancho {cm(r.p.width)}
            {r.p.rotationDeg ? ` · giro ${Math.round(r.p.rotationDeg)}°` : ''}
            {Math.abs(r.p.u) > 0.005 ? ` · ${cm(Math.abs(r.p.u))} a la ${r.p.u > 0 ? 'derecha' : 'izquierda'}` : ''}
            {Math.abs(r.p.v) > 0.005 ? ` · ${cm(Math.abs(r.p.v))} ${r.p.v > 0 ? 'arriba' : 'abajo'}` : ''}
          </p>
        </div>
      ))}
      <p className="pt-1 text-right text-xs text-tinta/55">Total del pedido: {formatPrice(computePricing(design).total)}</p>
    </div>
  );
}
