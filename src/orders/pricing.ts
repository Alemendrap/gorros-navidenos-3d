/**
 * PRECIOS en pesos colombianos.
 *   Total = precio base + $500 por cada letra + $500 por cada diseño.
 *
 * - Cada letra, número o símbolo de los textos se cobra por aparte; los espacios no.
 *   Ej.: "Samuel" = 6 letras → $3.000; "Ana María" = 8 letras → $4.000.
 * - Cada diseño (estrella, corazón…) cuenta una sola vez, aunque se mueva o se cambie de tamaño.
 * - Los textos vacíos no cuentan. No hay impuestos, envíos ni otros cargos.
 */
import type { Design, DesignItem, OrderLine, Pricing } from '@/types';
import { appConfig, catalog } from '@/config';
import { getDecoration } from '@/config/decorations';

/** Letras cobrables de un texto: todos los caracteres excepto espacios. */
export function countLetters(text: string) {
  return Array.from(text.replace(/\s+/g, '')).length;
}

/** ¿Este elemento se cobra? (texto con contenido o decoración existente y activa) */
export function isBillable(item: DesignItem) {
  if (item.kind === 'text') return countLetters(item.text) > 0;
  return catalog.decorationsEnabled() && !!getDecoration(item.decorationId)?.enabled;
}

export function billableItems(design: Design) {
  const seen = new Set<string>();
  return design.items.filter((i) => {
    if (seen.has(i.id) || !isBillable(i)) return false;
    seen.add(i.id);
    return true;
  });
}

export function itemLabel(item: DesignItem) {
  if (item.kind === 'text') return `Texto «${item.text.trim()}»`;
  return getDecoration(item.decorationId)?.name ?? 'Diseño';
}

export function computePricing(design: Design): Pricing {
  const { basePrice, pricePerLetter, pricePerDecoration, currency } = appConfig.pricing;
  let letterCount = 0;
  let decorationCount = 0;
  const lines: OrderLine[] = billableItems(design).map((i) => {
    const zone = catalog.zone(i.zoneId)?.name ?? '';
    if (i.kind === 'text') {
      const q = countLetters(i.text);
      letterCount += q;
      return { label: itemLabel(i), detail: zone, quantity: q, unitPrice: pricePerLetter, amount: q * pricePerLetter };
    }
    decorationCount += 1;
    return { label: itemLabel(i), detail: zone, quantity: 1, unitPrice: pricePerDecoration, amount: pricePerDecoration };
  });
  return {
    currency,
    basePrice,
    pricePerLetter,
    pricePerDecoration,
    letterCount,
    decorationCount,
    lines,
    total: basePrice + lines.reduce((s, l) => s + l.amount, 0),
  };
}

/** Texto corto de cantidades: "6 letras · 1 diseño" */
export function quantitiesLabel(p: Pricing) {
  const parts: string[] = [];
  if (p.letterCount) parts.push(`${p.letterCount} ${p.letterCount === 1 ? 'letra' : 'letras'}`);
  if (p.decorationCount) parts.push(`${p.decorationCount} ${p.decorationCount === 1 ? 'diseño' : 'diseños'}`);
  return parts.join(' · ') || 'Sin personalizar';
}

/** Formato colombiano: $3.500 COP */
export function formatPrice(amount: number, withCurrency = true) {
  const n = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${n}${withCurrency ? ` ${appConfig.pricing.currency}` : ''}`;
}
