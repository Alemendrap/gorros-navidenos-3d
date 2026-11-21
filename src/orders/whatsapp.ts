/**
 * Compartir el pedido por WhatsApp.
 * - En móviles con Web Share (iPhone Safari, Chrome Android) se comparte la IMAGEN + el resumen,
 *   y el cliente elige WhatsApp en la hoja de compartir.
 * - En otros casos se abre WhatsApp con el resumen en texto y se descarga la imagen para adjuntarla.
 */
import type { Order } from '@/types';
import { appConfig } from '@/config';
import { formatPrice } from './pricing';
import { dataUrlToFile, downloadDataUrl } from '@/export/imageExport';

export function buildWhatsAppMessage(order: Order) {
  const d = new Date(order.createdAt);
  const p = order.pricing;
  const lines = [
    `🎅 *${appConfig.businessName} · ${appConfig.villageName}*`,
    `Pedido: *${order.code}*`,
    `Fecha: ${d.toLocaleString(appConfig.locale)}`,
    `Producto: ${order.product.name}`,
    `Precio base: ${formatPrice(p.basePrice)}`,
    '',
  ];
  if (p.lines.length) {
    lines.push(`*Elementos personalizados (${p.elementCount} × ${formatPrice(p.pricePerElement)}):*`);
    p.lines.forEach((l) => lines.push(`• ${l.label}${l.detail ? ` (${l.detail})` : ''} — ${formatPrice(l.amount)}`));
  } else {
    lines.push('Sin elementos personalizados');
  }
  lines.push('', `*Total a pagar: ${formatPrice(p.total)}*`);
  return lines.join('\n');
}

export function whatsappUrl(text: string) {
  const n = appConfig.whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export async function shareOrder(order: Order, image?: string): Promise<'shared' | 'link' | 'cancelled'> {
  const text = buildWhatsAppMessage(order);
  if (image && typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      const file = await dataUrlToFile(image, `gorro-${order.code}.png`);
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text, title: `Pedido ${order.code}` });
        return 'shared';
      }
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'cancelled';
    }
  }
  if (image) downloadDataUrl(image, `gorro-${order.code}.png`);
  window.open(whatsappUrl(text), '_blank', 'noopener');
  return 'link';
}
