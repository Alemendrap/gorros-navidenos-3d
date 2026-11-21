/** Acciones de alto nivel: capturar, guardar, descargar y confirmar el diseño. */
import { useState } from 'react';
import { useDesign } from '@/store/designStore';
import { useSceneBridge } from '@/viewer/sceneBridge';
import { composeDesignImage, downloadDataUrl, makeThumbnail } from '@/export/imageExport';
import { buildOrder, orderSummaryLines } from '@/orders/orderBuilder';
import { orderRepository } from '@/orders/orderRepository';
import { useOrderStore } from '@/orders/orderStore';
import { appConfig } from '@/config';
import { computePricing, formatPrice } from '@/orders/pricing';
import { getDecoration } from '@/config/decorations';
import type { Design } from '@/types';

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

/** Captura el render sin indicadores de edición. */
export async function captureClean() {
  const st = useDesign.getState();
  const prevGuides = st.showGuides;
  const prevSel = st.selectedItemId;
  if (prevGuides) st.setShowGuides(false);
  await nextFrame(); await nextFrame(); await nextFrame();
  const capture = useSceneBridge.getState().capture;
  const url = capture ? capture({ scale: 1.8 }) : null;
  if (prevGuides) useDesign.getState().setShowGuides(true);
  if (prevSel) useDesign.getState().selectItem(prevSel);
  return url;
}

export function designLines(design: Design) {
  const out: string[] = [];
  for (const i of design.items) {
    if (i.kind === 'text' && i.text.trim()) out.push(`“${i.text.trim()}”`);
    if (i.kind === 'decoration') out.push(getDecoration(i.decorationId)?.name ?? 'Decoración');
  }
  return out;
}

export function defaultDesignName(design: Design) {
  const t = design.items.find((i) => i.kind === 'text' && i.text.trim());
  const d = new Date();
  const when = d.toLocaleDateString(appConfig.locale, { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString(appConfig.locale, { hour: '2-digit', minute: '2-digit' });
  return t && t.kind === 'text' ? `${t.text.trim()} · ${when}` : `Diseño · ${when}`;
}

export function useDesignActions() {
  const [busy, setBusy] = useState<null | 'save' | 'download' | 'confirm'>(null);
  const notify = useDesign((s) => s.notify);

  const save = async () => {
    setBusy('save');
    try {
      const shot = await captureClean();
      const thumb = shot ? await makeThumbnail(shot) : undefined;
      const d = useDesign.getState().design;
      useDesign.getState().saveDesign(defaultDesignName(d), thumb);
    } catch (e) {
      console.error(e);
      notify('No se pudo guardar el diseño', 'warn');
    } finally { setBusy(null); }
  };

  const composeCurrent = async (code?: string) => {
    const shot = await captureClean();
    if (!shot) throw new Error('Visor no disponible');
    const d = useDesign.getState().design;
    const lines = designLines(d);
    lines.push(`Total: ${formatPrice(computePricing(d).total)}`);
    return composeDesignImage(shot, { title: 'Mi gorro navideño', subtitle: 'Personalizado en vinilo dorado', lines, code });
  };

  const download = async () => {
    setBusy('download');
    try {
      const img = await composeCurrent();
      downloadDataUrl(img, `mi-gorro-navideno.png`);
    } catch (e) {
      console.error(e);
      notify('No se pudo generar la imagen', 'warn');
    } finally { setBusy(null); }
  };

  const confirm = async () => {
    setBusy('confirm');
    try {
      const d = useDesign.getState().design;
      const draft = buildOrder(d);
      const img = await composeCurrent(`Pedido ${draft.code}`);
      const order = { ...draft, previewImage: img };
      await orderRepository.save(order);
      useOrderStore.getState().set(order, img);
      useDesign.getState().go('confirm');
    } catch (e) {
      console.error(e);
      notify('No se pudo confirmar el diseño', 'warn');
    } finally { setBusy(null); }
  };

  return { busy, save, download, confirm, orderSummaryLines };
}
