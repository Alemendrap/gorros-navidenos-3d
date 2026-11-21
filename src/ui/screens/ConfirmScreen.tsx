import { useOrderStore } from '@/orders/orderStore';
import { useDesign } from '@/store/designStore';
import { PriceSummary } from '../components/PriceSummary';
import { copyImageToClipboard, recipientLink, shareDesignImage, type Recipient } from '@/orders/whatsapp';
import { downloadDataUrl, downloadJson } from '@/export/imageExport';
import { appConfig } from '@/config';
import { Icon } from '../components/Icon';

const phone = (n: string) => {
  const d = n.replace(/\D/g, '').replace(/^57/, '');
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d || 'el contacto que elijas';
};

export function ConfirmScreen() {
  const { order, image, sent, markSent } = useOrderStore();
  const go = useDesign((s) => s.go);
  const resetDesign = useDesign((s) => s.resetDesign);
  const notify = useDesign((s) => s.notify);
  const recipients = appConfig.whatsapp.recipients;

  if (!order) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-studio p-6">
        <button className="btn-primary" onClick={() => go('customize')}>Volver al diseño</button>
      </div>
    );
  }

  const next = recipients.find((r) => !sent[r.id]);
  const done = recipients.filter((r) => sent[r.id]).length;

  const onSend = async (r: Recipient) => {
    markSent(r.id);
    if (r.message !== 'factura' && image && (await copyImageToClipboard(image))) {
      notify('Imagen copiada: pégala en el chat de WhatsApp', 'ok');
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
          <p className="mt-1 text-sm text-tinta/60">Envía tu pedido por WhatsApp para completarlo.</p>
        </div>

        <div className="mt-5 space-y-3 animate-fadeUp">
          {next ? (
            <a
              href={recipientLink(order, next)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onSend(next)}
              data-testid="send-next"
              className="flex items-center gap-3 rounded-2xl bg-[#1F7A4D] p-4 text-white shadow-lg transition hover:bg-[#23905a] active:scale-[.98]"
            >
              <Icon name="whatsapp" size={30} />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold leading-tight">
                  {done === 0 ? 'Enviar pedido por WhatsApp' : 'Continuar envío'}
                </span>
                <span className="block text-sm text-white/85">
                  Mensaje {done + 1} de {recipients.length} · {next.label} ({phone(next.number)})
                </span>
              </span>
              <Icon name="next" size={22} />
            </a>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-pino/30 bg-pino/10 p-4" data-testid="all-sent">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pino text-white"><Icon name="check" size={22} /></span>
              <span>
                <span className="block font-semibold">¡Pedido enviado!</span>
                <span className="block text-sm text-tinta/60">Se abrieron los {recipients.length} chats de WhatsApp.</span>
              </span>
            </div>
          )}

          <ol className="card divide-y divide-tinta/5">
            {recipients.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${sent[r.id] ? 'bg-pino text-white' : 'bg-tinta/10 text-tinta/60'}`}>
                  {sent[r.id] ? <Icon name="check" size={14} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <b>{r.label}</b> · {phone(r.number)}
                  <span className="block text-xs text-tinta/50">{r.message === 'factura' ? 'Factura para el cobro' : r.message === 'diseno' ? 'Diseño para fabricar (con enlace 3D)' : 'Factura e imagen del diseño'}</span>
                </span>
                <a href={recipientLink(order, r)} target="_blank" rel="noopener noreferrer" onClick={() => onSend(r)} className="text-xs font-semibold text-pino underline" data-testid={`send-${r.id}`}>
                  {sent[r.id] ? 'Reenviar' : 'Enviar'}
                </a>
              </li>
            ))}
          </ol>
          {image && (
            <button className="btn-outline w-full" onClick={shareImage}>
              <Icon name="share" size={18} /> Compartir la imagen del diseño
            </button>
          )}
          <p className="text-center text-[11px] text-tinta/50">
            WhatsApp se abre con la factura ya escrita: pulsa <b>Enviar</b>. La imagen queda copiada:
            mantén presionado el campo de mensaje y elige <b>Pegar</b> (o usa «Compartir la imagen»). Luego vuelve aquí para el siguiente.
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
