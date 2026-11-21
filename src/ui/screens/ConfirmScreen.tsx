import { useState } from 'react';
import { useOrderStore } from '@/orders/orderStore';
import { useDesign } from '@/store/designStore';
import { PriceSummary } from '../components/PriceSummary';
import { copyImageToClipboard, invoiceLink, productionLink, shareDesignImage } from '@/orders/whatsapp';
import { formatPrice } from '@/orders/pricing';
import { downloadDataUrl, downloadJson } from '@/export/imageExport';
import { appConfig } from '@/config';
import { Icon } from '../components/Icon';

const phone = (n: string) => {
  const d = n.replace(/\D/g, '').replace(/^57/, '');
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d || 'el contacto que elijas';
};

export function ConfirmScreen() {
  const { order, image } = useOrderStore();
  const go = useDesign((s) => s.go);
  const resetDesign = useDesign((s) => s.resetDesign);
  const notify = useDesign((s) => s.notify);
  const [sent, setSent] = useState({ cobro: false, taller: false });

  if (!order) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-studio p-6">
        <button className="btn-primary" onClick={() => go('customize')}>Volver al diseño</button>
      </div>
    );
  }

  const onTaller = async () => {
    setSent((s) => ({ ...s, taller: true }));
    if (image && (await copyImageToClipboard(image))) {
      notify('Imagen copiada: pégala en el chat del taller', 'ok');
    }
  };

  const shareImage = async () => {
    if (!image) return;
    const r = await shareDesignImage(order, image);
    if (r === 'downloaded') notify('Imagen descargada: adjúntala en el chat del taller', 'ok');
  };

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-studio" data-testid="confirm-screen">
      <div className="mx-auto max-w-lg px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[calc(env(safe-area-inset-top)+24px)]">
        <div className="text-center animate-fadeUp">
          <p className="text-[11px] font-semibold uppercase tracking-[.3em] text-oro-dark">{appConfig.villageName}</p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-navidad-dark">¡Tu diseño está listo!</h1>
          <p className="mt-1 text-sm text-tinta/60">Envía los dos mensajes para completar tu pedido.</p>
        </div>

        <div className="mt-5 space-y-3 animate-fadeUp">
          <StepCard
            n={1}
            done={sent.cobro}
            title="Enviar factura para el pago"
            detail={`Total ${formatPrice(order.pricing.total)} · a ${phone(appConfig.whatsapp.cobro.number)}`}
            href={invoiceLink(order)}
            onClick={() => setSent((s) => ({ ...s, cobro: true }))}
            testId="send-invoice"
          />
          <StepCard
            n={2}
            done={sent.taller}
            title="Enviar diseño al taller"
            detail={`Textos, posiciones y enlace 3D · a ${phone(appConfig.whatsapp.taller.number)}`}
            href={productionLink(order)}
            onClick={onTaller}
            testId="send-design"
          />
          {image && (
            <button className="btn-outline w-full" onClick={shareImage}>
              <Icon name="share" size={18} /> Compartir la imagen del diseño
            </button>
          )}
          <p className="text-center text-[11px] text-tinta/50">
            Se abre WhatsApp con el mensaje ya escrito: solo pulsa <b>Enviar</b>.
          </p>
        </div>

        {image && <img src={image} alt="Vista previa del gorro diseñado" className="mt-5 w-full rounded-3xl border border-oro/30 shadow-glow animate-fadeUp" />}

        <div className="card mt-5 divide-y divide-tinta/5 animate-fadeUp">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="label">Pedido</span>
            <span className="font-mono text-base font-semibold tracking-wider" data-testid="order-code">{order.code}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="label">Fecha</span>
            <span className="text-sm">{new Date(order.createdAt).toLocaleString(appConfig.locale)}</span>
          </div>
        </div>

        <div className="mt-4 animate-fadeUp"><PriceSummary pricing={order.pricing} /></div>

        <div className="mt-5 grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-outline" onClick={() => image && downloadDataUrl(image, `gorro-${order.code}.png`)}><Icon name="download" size={18} /> Imagen</button>
            <button className="btn-outline" onClick={() => downloadJson({ ...order, previewImage: undefined }, `pedido-${order.code}.json`)}><Icon name="download" size={18} /> Pedido</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => go('customize')}><Icon name="back" size={18} /> Editar</button>
            <button className="btn-ghost" onClick={() => { resetDesign(); go('customize'); }}><Icon name="plus" size={18} /> Nuevo diseño</button>
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] text-tinta/45">Precios en pesos colombianos.</p>
      </div>
    </div>
  );
}

function StepCard({ n, done, title, detail, href, onClick, testId }: {
  n: number; done: boolean; title: string; detail: string; href: string; onClick: () => void; testId: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      data-testid={testId}
      className={`flex items-center gap-3 rounded-2xl p-3.5 text-left shadow-sm transition active:scale-[.98] ${done ? 'border border-pino/30 bg-pino/10 text-tinta' : 'bg-[#1F7A4D] text-white hover:bg-[#23905a]'}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${done ? 'bg-pino text-white' : 'bg-white/20'}`}>
        {done ? <Icon name="check" size={20} /> : n}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className={`block truncate text-xs ${done ? 'text-tinta/60' : 'text-white/80'}`}>{done ? 'Abierto en WhatsApp · toca para volver a enviar' : detail}</span>
      </span>
      <Icon name="whatsapp" size={22} />
    </a>
  );
}
