/**
 * PRECIOS en pesos colombianos.
 *   Total = precio base + precio por elemento × cantidad de elementos.
 *
 * Cada elemento del diseño cuenta UNA sola vez, por su identificador:
 * cambiar el texto, el tamaño, la posición o la zona de un elemento no lo vuelve a cobrar.
 * Los textos vacíos no cuentan. No hay impuestos, envíos ni otros cargos.
 */
import type { Design, DesignItem, OrderLine, Pricing } from '@/types';
import { appConfig, catalog } from '@/config';
import { getDecoration } from '@/config/decorations';

/** ¿Este elemento se cobra? (texto con contenido o decoración existente y activa) */
export function isBillable(item: DesignItem) {
  if (item.kind === 'text') return item.text.trim().length > 0;
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
  const { basePrice, pricePerElement, currency } = appConfig.pricing;
  const items = billableItems(design);
  const lines: OrderLine[] = items.map((i) => ({
    label: itemLabel(i),
    detail: catalog.zone(i.zoneId)?.name ?? '',
    amount: pricePerElement,
  }));
  return {
    currency,
    basePrice,
    pricePerElement,
    elementCount: items.length,
    lines,
    total: basePrice + pricePerElement * items.length,
  };
}

/** Formato colombiano: $3.500 COP */
export function formatPrice(amount: number, withCurrency = true) {
  const n = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${n}${withCurrency ? ` ${appConfig.pricing.currency}` : ''}`;
}
