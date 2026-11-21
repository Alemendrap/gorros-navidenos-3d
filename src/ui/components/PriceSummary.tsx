import type { Pricing } from '@/types';
import { catalog } from '@/config';
import { formatPrice } from '@/orders/pricing';

/** Resumen de compra: siempre calculado a partir de lo que hay en el gorro. */
export function PriceSummary({ pricing, compact = false }: { pricing: Pricing; compact?: boolean }) {
  const product = catalog.product();
  return (
    <div className="card divide-y divide-tinta/5" data-testid="price-summary">
      <Row label="Producto" value={product.name} />
      <Row label="Precio base" value={formatPrice(pricing.basePrice)} />
      <div className="px-4 py-3">
        <span className="label">Personalización</span>
        {pricing.lines.length > 0 ? (
          <ul className={`mt-2 space-y-2 ${compact ? 'max-h-40 overflow-y-auto' : ''}`}>
            {pricing.lines.map((l, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{l.label}</span>
                  <span className="block text-xs text-tinta/50">
                    {l.quantity > 1 || l.label.startsWith('Texto')
                      ? `${l.quantity} ${l.quantity === 1 ? 'letra' : 'letras'} × ${formatPrice(l.unitPrice, false)}`
                      : `1 diseño × ${formatPrice(l.unitPrice, false)}`}
                    {l.detail && ` · ${l.detail}`}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-tinta/70">{formatPrice(l.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-tinta/50">Sin letras ni diseños todavía</p>
        )}
      </div>
      <Row label="Letras" value={<span data-testid="letter-count">{pricing.letterCount} × {formatPrice(pricing.pricePerLetter)}</span>} />
      <Row label="Diseños" value={<span data-testid="deco-count">{pricing.decorationCount} × {formatPrice(pricing.pricePerDecoration)}</span>} />
      <div className="flex items-center justify-between rounded-b-2xl bg-oro/10 px-4 py-3.5">
        <span className="font-display text-xl font-semibold">Total a pagar</span>
        <span className="text-lg font-bold tabular-nums text-navidad-dark" data-testid="total">{formatPrice(pricing.total)}</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="label pt-0.5">{label}</span>
      <span className="text-right text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}
