import { useEffect, useState } from 'react';
import { catalog } from '@/config';
import { computePricing, formatPrice } from '@/orders/pricing';
import { useDesign, useCurrentProduct, type PanelTab } from '@/store/designStore';
import { Sheet } from '../components/Sheet';
import { ViewerControls } from '../components/ViewerControls';
import { TextEditor } from '../components/TextEditor';
import { DecorationEditor } from '../components/DecorationEditor';
import { ZonesPanel } from '../components/ZonesPanel';
import { Icon } from '../components/Icon';
import { useDesignActions } from '../useDesignActions';

export function CustomizeOverlay() {
  const go = useDesign((s) => s.go);
  const design = useDesign((s) => s.design);
  const total = computePricing(design).total;
  const [hint, setHint] = useState(true);
  useEffect(() => { const t = setTimeout(() => setHint(false), 4500); return () => clearTimeout(t); }, []);
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <button className="icon-btn pointer-events-auto" onClick={() => go('welcome')} aria-label="Inicio"><Icon name="back" /></button>
        <div className="flex min-w-0 items-center gap-2 rounded-full bg-white/85 px-4 py-2 shadow-sm backdrop-blur" data-testid="live-total">
          <span className="text-xs font-semibold uppercase tracking-wider text-tinta/55">Total</span>
          <span className="font-display text-xl font-bold tabular-nums text-navidad-dark">{formatPrice(total)}</span>
        </div>
        <button className="btn-primary pointer-events-auto hidden !min-h-[44px] lg:inline-flex" onClick={() => go('preview')}>
          Revisar diseño <Icon name="eye" size={18} />
        </button>
        <span className="w-12 lg:hidden" />
      </div>
      <div className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2">
        <ViewerControls />
      </div>
      {hint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center">
          <span className="animate-fadeUp rounded-full bg-tinta/70 px-4 py-2 text-xs text-white backdrop-blur">Arrastra para girar · Pellizca para acercar · Toca una zona</span>
        </div>
      )}
    </>
  );
}

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'texto', label: 'Nombre' },
  { id: 'decoraciones', label: 'Diseños' },
  { id: 'zonas', label: 'Zonas' },
];

export function CustomizePanel() {
  const product = useCurrentProduct();
  const tab = useDesign((s) => s.tab);
  const setTab = useDesign((s) => s.setTab);
  const go = useDesign((s) => s.go);
  const selectedId = useDesign((s) => s.selectedItemId);
  const items = useDesign((s) => s.design.items);
  const [open, setOpen] = useState(true);
  const [typing, setTyping] = useState(false);
  const { save, busy } = useDesignActions();
  const decoOn = catalog.decorationsEnabled();
  const pricing = computePricing(useDesign((s) => s.design));
  const tabs = TABS.filter((t) => t.id !== 'decoraciones' || decoOn);

  // Al tocar un elemento en el gorro se abre su editor.
  useEffect(() => {
    const it = items.find((i) => i.id === selectedId);
    if (!it) return;
    setOpen(true);
    setTab(it.kind === 'text' ? 'texto' : 'decoraciones');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => { if (tab === 'decoraciones' && !decoOn) setTab('texto'); }, [tab, decoOn, setTab]);

  return (
    <Sheet
      open={open}
      onToggle={setOpen}
      compact={typing}
      header={
        <div className={`flex gap-1 rounded-full bg-tinta/5 p-1 ${typing ? 'hidden lg:flex' : ''}`} role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => { setTab(t.id); setOpen(true); }}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition ${tab === t.id ? 'bg-white text-tinta shadow' : 'text-tinta/55'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
      footer={
        typing ? undefined : (
          <div className="flex gap-2">
            <button className="btn-outline !px-4" onClick={save} disabled={busy !== null} aria-label="Guardar diseño" title="Guardar diseño">
              <Icon name="save" size={18} /> <span className="hidden sm:inline">{busy === 'save' ? 'Guardando…' : 'Guardar'}</span>
            </button>
            <button className="btn-primary flex-1 !justify-between !pl-5 !pr-4" onClick={() => go('preview')} data-testid="go-preview">
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[15px]">Revisar diseño</span>
                <span className="text-[11px] font-medium opacity-80">{pricing.elementCount} {pricing.elementCount === 1 ? 'elemento' : 'elementos'} · {formatPrice(pricing.total)}</span>
              </span>
              <Icon name="next" size={18} />
            </button>
          </div>
        )
      }
    >
      <div className={typing ? 'typing' : ''}>
        {tab === 'texto' && <TextEditor product={product} onTyping={setTyping} />}
        {tab === 'decoraciones' && decoOn && <DecorationEditor product={product} />}
        {tab === 'zonas' && <ZonesPanel />}
      </div>
    </Sheet>
  );
}
