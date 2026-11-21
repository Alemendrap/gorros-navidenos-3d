import { useState } from 'react';
import { useDesign } from '@/store/designStore';
import { computePricing } from '@/orders/pricing';
import { Sheet } from '../components/Sheet';
import { ViewerControls } from '../components/ViewerControls';
import { ConfirmButton } from '../components/ConfirmButton';
import { PriceSummary } from '../components/PriceSummary';
import { Icon } from '../components/Icon';
import { useDesignActions } from '../useDesignActions';
import { SavedDesignsModal } from '../components/SavedDesignsModal';

export function PreviewOverlay() {
  const go = useDesign((s) => s.go);
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <button className="btn-outline pointer-events-auto !min-h-[44px]" onClick={() => go('customize')}><Icon name="back" size={18} /> Editar</button>
        <p className="rounded-full bg-white/80 px-4 py-2 font-display text-lg font-semibold shadow-sm backdrop-blur">Tu diseño</p>
        <span className="w-[92px]" />
      </div>
      <div className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2">
        <ViewerControls guides={false} />
      </div>
    </>
  );
}

export function PreviewPanel() {
  const design = useDesign((s) => s.design);
  const saved = useDesign((s) => s.saved);
  const resetDesign = useDesign((s) => s.resetDesign);
  const go = useDesign((s) => s.go);
  const [open, setOpen] = useState(true);
  const [showSaved, setShowSaved] = useState(false);
  const { busy, save, download, confirm } = useDesignActions();
  const pricing = computePricing(design);

  return (
    <>
      <Sheet
        open={open}
        onToggle={setOpen}
        header={<p className="font-display text-2xl font-semibold">Resumen de compra</p>}
        footer={
          <button className="btn-gold w-full text-base" onClick={confirm} disabled={busy !== null} data-testid="confirm">
            {busy === 'confirm' ? 'Preparando…' : <>Confirmar personalización <Icon name="check" size={18} /></>}
          </button>
        }
      >
        <div className="space-y-4">
          <PriceSummary pricing={pricing} />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-outline" onClick={download} disabled={busy !== null}><Icon name="download" size={18} /> {busy === 'download' ? 'Creando…' : 'Imagen'}</button>
            <button className="btn-outline" onClick={save} disabled={busy !== null}><Icon name="save" size={18} /> {busy === 'save' ? 'Guardando…' : 'Guardar'}</button>
            <button className="btn-outline" onClick={() => setShowSaved(true)}><Icon name="folder" size={18} /> Diseños ({saved.length})</button>
            <ConfirmButton onConfirm={() => { resetDesign(); go('customize'); }}><Icon name="reset" size={18} /> Reiniciar</ConfirmButton>
          </div>
        </div>
      </Sheet>
      {showSaved && <SavedDesignsModal onClose={() => setShowSaved(false)} />}
    </>
  );
}
