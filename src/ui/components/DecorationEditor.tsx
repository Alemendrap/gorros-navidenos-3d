import type { DecorationItem, ProductConfig } from '@/types';
import { catalog, appConfig } from '@/config';
import { getDecoration } from '@/config/decorations';
import { useDesign } from '@/store/designStore';
import { formatPrice } from '@/orders/pricing';
import { assetUrl } from '@/lib/assets';
import { ItemTransformControls } from './ItemTransformControls';
import { ZonePicker } from './ZonePicker';

/** Silueta del diseño pintada en dorado (igual que se verá en el gorro). */
export function GoldThumb({ src, className = '' }: { src: string; className?: string }) {
  const url = `url("${assetUrl(src)}")`;
  return (
    <span
      className={`block ${className}`}
      style={{
        background: 'linear-gradient(135deg,#F6E3A1 0%,#D9AE4E 45%,#9C7A2E 100%)',
        WebkitMaskImage: url, maskImage: url,
        WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center', maskPosition: 'center',
        WebkitMaskSize: 'contain', maskSize: 'contain',
      }}
      aria-hidden
    />
  );
}

export function decorationThumb(id: string) {
  const d = getDecoration(id);
  if (!d) return undefined;
  return d.thumbnail ?? (d.source.type === 'image' ? d.source.src : undefined);
}

export function DecorationEditor({ product }: { product: ProductConfig }) {
  const items = useDesign((s) => s.design.items);
  const selectedId = useDesign((s) => s.selectedItemId);
  const selectItem = useDesign((s) => s.selectItem);
  const addDecoration = useDesign((s) => s.addDecoration);

  const list = catalog.decorations();
  const placed = items.filter((i): i is DecorationItem => i.kind === 'decoration');
  const item = placed.find((p) => p.id === selectedId);
  const deco = item ? getDecoration(item.decorationId) : undefined;
  const zone = item ? catalog.zone(item.zoneId) : undefined;

  if (!list.length) {
    return <p className="py-6 text-center text-sm text-tinta/60">Los diseños estarán disponibles muy pronto.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="label">Diseños disponibles</p>
          <span className="text-xs font-semibold text-oro-dark">+{formatPrice(appConfig.pricing.pricePerDecoration, false)} c/u</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3">
          {list.map((d) => {
            const thumb = decorationThumb(d.id);
            return (
              <button
                key={d.id}
                onClick={() => addDecoration(d.id)}
                className="card flex flex-col items-center gap-1.5 p-2 text-center transition hover:shadow-glow active:scale-[.97]"
                data-testid={`deco-${d.id}`}
                aria-label={`Añadir ${d.name}`}
              >
                <span className="flex h-16 w-full items-center justify-center rounded-xl bg-gradient-to-b from-navidad to-navidad-dark p-3">
                  {thumb && <GoldThumb src={thumb} className="h-full w-full" />}
                </span>
                <span className="text-[12px] font-medium leading-tight">{d.name}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-tinta/50">Toca un diseño para añadirlo. Toca una zona del gorro para moverlo.</p>
      </div>

      {placed.length > 0 && (
        <div>
          <p className="label mb-1.5">En tu gorro</p>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
            {placed.map((p) => (
              <button key={p.id} className={p.id === selectedId ? 'chip-on' : 'chip-off'} onClick={() => selectItem(p.id)}>
                {decorationThumb(p.decorationId) && <GoldThumb src={decorationThumb(p.decorationId)!} className="h-5 w-5" />}
                {getDecoration(p.decorationId)?.name ?? 'Diseño'}
              </button>
            ))}
          </div>
        </div>
      )}

      {item && deco && zone && (
        <div className="card space-y-3 p-3 animate-fadeUp">
          <p className="font-display text-lg font-semibold">{deco.name}</p>
          <ZonePicker item={item} product={product} />
          <ItemTransformControls item={item} zone={zone} aspect={deco.aspect} />
        </div>
      )}
    </div>
  );
}
