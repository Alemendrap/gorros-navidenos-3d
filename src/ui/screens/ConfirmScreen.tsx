import { useState } from 'react';
import { useOrderStore } from '@/orders/orderStore';
import { useDesign } from '@/store/designStore';
import { PriceSummary } from '../components/PriceSummary';
import { shareOrder } from '@/orders/whatsapp';
import { downloadDataUrl, downloadJson } from '@/export/imageExport';
import { appConfig } from '@/config';
import { Icon } from '../components/Icon';

export function ConfirmScreen() {
  const { order, image } = useOrderStore();
  const go = useDesign((s) => s.go);
  const resetDesign = useDesign((s) => s.resetDesign);
  const notify = useDesign((s) => s.notify);
  const [sharing, setSharing] = useState(false);

  if (!order) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-studio p-6">
        <button className="btn-primary" onClick={() => go('customize')}>Volver al diseño</button>
      </div>
    );
  }

  const share = async () => {
    setSharing(true);
    const r = await shareOrder(order, image ?? undefined);
    setSharing(false);
    if (r === 'link') notify('Se abrió WhatsApp y se descargó la imagen para adjuntarla', 'ok');
  };

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-studio" data-testid="confirm-screen">
      <div className="mx-auto max-w-lg px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[calc(env(safe-area-inset-top)+24px)]">
        <div className="text-center animate-fadeUp">
          <p className="text-[11px] font-semibold uppercase tracking-[.3em] text-oro-dark">{appConfig.villageName}</p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-navidad-dark">¡Tu diseño está listo!</h1>
          <p className="mt-1 text-sm text-tinta/60">Muestra este código en el taller o envíalo por WhatsApp.</p>
        </div>

        {image && <img src={image} alt="Vista previa del gorro diseñado" className="mt-5 w-full rounded-3xl border border-oro/30 shadow-glow animate-fadeUp" />}

        <div className="card mt-5 divide-y divide-tinta/5 animate-fadeUp">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="label">Pedido</span>
            <span className="font-mono text-base font-semibold tracking-wider" data-testid="order-code">{order.code}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="label">Estado</span>
            <span className="rounded-full bg-pino/10 px-3 py-1 text-xs font-semibold capitalize text-pino">{order.status}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="label">Fecha</span>
            <span className="text-sm">{new Date(order.createdAt).toLocaleString(appConfig.locale)}</span>
          </div>
        </div>

        <div className="mt-4 animate-fadeUp"><PriceSummary pricing={order.pricing} /></div>

        <div className="mt-5 grid gap-2">
          <button className="btn w-full bg-[#1F7A4D] text-white hover:bg-[#23905a]" onClick={share} disabled={sharing} data-testid="share">
            <Icon name="whatsapp" size={20} /> {sharing ? 'Abriendo…' : 'Compartir por WhatsApp'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-outline" onClick={() => image && downloadDataUrl(image, `gorro-${order.code}.png`)}><Icon name="download" size={18} /> Imagen</button>
            <button className="btn-outline" onClick={() => downloadJson({ ...order, previewImage: undefined }, `pedido-${order.code}.json`)}><Icon name="download" size={18} /> Pedido</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => go('customize')}><Icon name="back" size={18} /> Editar</button>
            <button className="btn-ghost" onClick={() => { resetDesign(); go('customize'); }}><Icon name="plus" size={18} /> Nuevo diseño</button>
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] text-tinta/45">Precios en pesos colombianos. El pago se coordina directamente con el taller.</p>
      </div>
    </div>
  );
}
