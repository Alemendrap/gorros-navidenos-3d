import { useRef } from 'react';
import type { ProductConfig, TextItem } from '@/types';
import { catalog, appConfig } from '@/config';
import { useDesign } from '@/store/designStore';
import { measureTextAspect } from '@/engine/rasterize';
import { useFontStore } from '@/engine/fontLoader';
import { cameraActions } from '@/viewer/sceneBridge';
import { countLetters, formatPrice } from '@/orders/pricing';
import { ItemTransformControls } from './ItemTransformControls';
import { ZonePicker } from './ZonePicker';
import { Icon } from './Icon';

/** Editor de texto: una sola tipografía y vinilo dorado (sin selectores). */
export function TextEditor({ product, onTyping }: { product: ProductConfig; onTyping: (typing: boolean) => void }) {
  const items = useDesign((s) => s.design.items);
  const selectedId = useDesign((s) => s.selectedItemId);
  const addText = useDesign((s) => s.addText);
  const selectItem = useDesign((s) => s.selectItem);
  const updateItem = useDesign((s) => s.updateItem);
  useFontStore((s) => s.version); // re-medir cuando carga la fuente
  const inputRef = useRef<HTMLInputElement>(null);
  const font = catalog.font();
  const fontStyle = { fontFamily: `"${font.family}"`, fontWeight: font.weight };

  const texts = items.filter((i): i is TextItem => i.kind === 'text');
  const item = texts.find((t) => t.id === selectedId);
  const zone = item ? catalog.zone(item.zoneId) : undefined;

  const add = () => {
    const id = addText();
    if (id) setTimeout(() => inputRef.current?.focus(), 60);
  };

  return (
    <div className="space-y-4">
      {texts.length > 0 && (
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {texts.map((t) => (
            <button key={t.id} className={t.id === selectedId ? 'chip-on' : 'chip-off'} onClick={() => selectItem(t.id)} style={fontStyle}>
              <span className="text-lg">{t.text.trim() || 'Texto vacío'}</span>
            </button>
          ))}
          <button className="chip-off !border-dashed !border-oro/60 !text-oro-dark" onClick={add} data-testid="add-text">
            <Icon name="plus" size={16} /> Otro texto
          </button>
        </div>
      )}

      {!item && (
        <button onClick={add} className="card flex w-full items-center gap-4 p-4 text-left transition hover:shadow-glow" data-testid={texts.length ? undefined : 'add-text'}>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-oro/15 text-oro-dark"><Icon name="text" /></span>
          <span className="flex-1">
            <span className="block font-display text-xl font-semibold text-tinta">Escribe un nombre</span>
            <span className="text-sm text-tinta/60">Letras de vinilo dorado sobre tu gorro.</span>
          </span>
          <span className="shrink-0 rounded-full bg-oro/15 px-2.5 py-1 text-xs font-semibold text-oro-dark">{formatPrice(appConfig.pricing.pricePerLetter, false)} por letra</span>
        </button>
      )}

      {item && zone && (
        <div className="space-y-4 animate-fadeUp">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label htmlFor="txt-input" className="label">Tu texto</label>
              <span className="text-xs tabular-nums text-tinta/50">
                {countLetters(item.text)} {countLetters(item.text) === 1 ? 'letra' : 'letras'} · <b className="text-oro-dark">{formatPrice(countLetters(item.text) * appConfig.pricing.pricePerLetter)}</b> · {Array.from(item.text).length}/{zone.maxChars}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                id="txt-input"
                ref={inputRef}
                data-testid="text-input"
                value={item.text}
                maxLength={zone.maxChars * 2}
                placeholder="Ej.: Sofía"
                autoComplete="off"
                autoCapitalize="words"
                enterKeyHint="done"
                onChange={(e) => updateItem(item.id, { text: e.target.value })}
                onFocus={() => { onTyping(true); cameraActions.focusAzimuth(zone.anchor.azimuthDeg, zone.anchor.height > 0.6 ? 1.28 : 1.42); }}
                onBlur={() => onTyping(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                className="min-h-[52px] w-full rounded-2xl border border-tinta/15 bg-white px-4 text-[17px] text-tinta outline-none transition focus:border-oro focus:shadow-glow"
                style={{ fontSize: 17 /* ≥16px evita el zoom automático de iOS */ }}
              />
              <button className="btn-gold !min-h-[52px] !px-4 lg:hidden" onMouseDown={(e) => e.preventDefault()} onClick={() => inputRef.current?.blur()}>
                Listo
              </button>
            </div>
            {item.text.trim() && (
              <p className="mt-2 truncate text-center text-3xl text-oro-dark" style={fontStyle} data-typing-hide>{item.text}</p>
            )}
          </div>

          <div data-typing-hide><ZonePicker item={item} product={product} /></div>
          <div data-typing-hide>
            <ItemTransformControls item={item} zone={zone} aspect={item.text.trim() ? measureTextAspect(item.text.trim(), font).aspect : 2} />
          </div>
        </div>
      )}
    </div>
  );
}
