/**
 * WHATSAPP: dos mensajes por pedido.
 *  1. FACTURA → número de cobro (appConfig.whatsapp.cobro)
 *  2. DISEÑO  → número del taller (appConfig.whatsapp.taller), con enlace para verlo en 3D.
 *
 * Los enlaces wa.me abren el chat del número con el texto ya escrito; el cliente solo pulsa "Enviar".
 * (WhatsApp no permite adjuntar imágenes por enlace: la imagen se copia al portapapeles
 * para pegarla en el chat o se comparte con la hoja de compartir del teléfono.)
 */
import type { Order } from '@/types';
import { appConfig } from '@/config';
import { formatPrice } from './pricing';
import { designUrl } from '@/lib/designLink';
import { dataUrlToFile, downloadDataUrl } from '@/export/imageExport';

const cm = (u: number) => `${(u * 10).toFixed(1).replace('.', ',')} cm`;
const fecha = (iso: string) => new Date(iso).toLocaleString(appConfig.locale, { dateStyle: 'short', timeStyle: 'short' });

/** Mensaje 1: factura para el cobro. */
export function buildInvoiceMessage(order: Order) {
  const p = order.pricing;
  const lines = [
    `🧾 *FACTURA · ${appConfig.businessName}*`,
    `${appConfig.villageName}`,
    '',
    `Pedido: *${order.code}*`,
    `Fecha: ${fecha(order.createdAt)}`,
    '',
    `Producto: ${order.product.name}`,
    `Precio base: ${formatPrice(p.basePrice)}`,
  ];
  if (p.lines.length) {
    lines.push('', `Elementos personalizados (${p.elementCount} × ${formatPrice(p.pricePerElement)}):`);
    p.lines.forEach((l, i) => lines.push(`${i + 1}. ${l.label} — ${formatPrice(l.amount)}`));
  } else {
    lines.push('Sin elementos personalizados');
  }
  lines.push('', `*TOTAL A PAGAR: ${formatPrice(p.total)}*`, '', 'Estado: pendiente de pago');
  return lines.join('\n');
}

/** Mensaje 2: diseño para el taller (todo lo necesario para fabricarlo). */
export function buildProductionMessage(order: Order) {
  const lines = [
    `🎨 *DISEÑO PARA PRODUCCIÓN*`,
    `Pedido: *${order.code}* · ${fecha(order.createdAt)}`,
    `Gorro: ${order.product.name} · Acabado: ${order.product.finish}`,
    '',
  ];
  let n = 1;
  for (const t of order.texts) {
    const p = t.placement;
    lines.push(`${n++}. TEXTO: *${t.text}*`, `   Zona: ${t.zone} · Alto ${cm(p.height)} · Ancho ${cm(p.width)}${p.rotationDeg ? ` · Giro ${Math.round(p.rotationDeg)}°` : ''}${posicion(p.offset)}`, `   Letra: ${t.font}`);
  }
  for (const d of order.decorations) {
    const p = d.placement;
    lines.push(`${n++}. DISEÑO: *${d.name}*`, `   Zona: ${d.zone} · Alto ${cm(p.height)}${p.rotationDeg ? ` · Giro ${Math.round(p.rotationDeg)}°` : ''}${posicion(p.offset)}`);
  }
  if (n === 1) lines.push('Gorro sin personalización');
  lines.push('', `Total elementos: ${order.pricing.elementCount}`, '', '👉 Ver el diseño en 3D:', designUrl(order.design, order.code));
  return lines.join('\n');
}

function posicion(o: { u: number; v: number }) {
  const parts: string[] = [];
  if (Math.abs(o.u) > 0.005) parts.push(`${cm(Math.abs(o.u))} a la ${o.u > 0 ? 'derecha' : 'izquierda'}`);
  if (Math.abs(o.v) > 0.005) parts.push(`${cm(Math.abs(o.v))} ${o.v > 0 ? 'arriba' : 'abajo'}`);
  return parts.length ? ` · Desplazado ${parts.join(' y ')}` : ' · Centrado';
}

export function whatsappLink(number: string, text: string) {
  const n = number.replace(/\D/g, '');
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export const invoiceLink = (order: Order) => whatsappLink(appConfig.whatsapp.cobro.number, buildInvoiceMessage(order));
export const productionLink = (order: Order) => whatsappLink(appConfig.whatsapp.taller.number, buildProductionMessage(order));

/** Copia la imagen del diseño al portapapeles (para pegarla en el chat). */
export async function copyImageToClipboard(dataUrl: string) {
  try {
    if (!('ClipboardItem' in window) || !navigator.clipboard?.write) return false;
    const blob = fetch(dataUrl).then((r) => r.blob());
    // Safari exige pasar la promesa directamente dentro del gesto del usuario.
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}

/** Comparte la imagen con la hoja de compartir del teléfono; si no se puede, la descarga. */
export async function shareDesignImage(order: Order, image: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (navigator.canShare) {
    try {
      const file = await dataUrlToFile(image, `diseno-${order.code}.png`);
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Diseño ${order.code}` });
        return 'shared';
      }
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'cancelled';
    }
  }
  downloadDataUrl(image, `diseno-${order.code}.png`);
  return 'downloaded';
}
