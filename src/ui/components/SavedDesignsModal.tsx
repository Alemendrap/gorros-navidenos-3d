import { useDesign } from '@/store/designStore';
import { appConfig } from '@/config';
import { computePricing, formatPrice } from '@/orders/pricing';
import { Icon } from './Icon';
import { ConfirmButton } from './ConfirmButton';

export function SavedDesignsModal({ onClose }: { onClose: () => void }) {
  const saved = useDesign((s) => s.saved);
  const restore = useDesign((s) => s.restoreDesign);
  const remove = useDesign((s) => s.deleteSaved);
  const go = useDesign((s) => s.go);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-tinta/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="max-h-[80%] w-full max-w-md overflow-hidden rounded-t-[28px] bg-crema shadow-2xl sm:rounded-[28px] animate-fadeUp" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Mis diseños">
        <div className="flex items-center justify-between border-b border-tinta/10 px-5 py-4">
          <p className="font-display text-2xl font-semibold">Mis diseños</p>
          <button className="icon-btn !h-10 !w-10 !shadow-none" onClick={onClose} aria-label="Cerrar"><Icon name="close" size={18} /></button>
        </div>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          {saved.length === 0 && <p className="py-8 text-center text-sm text-tinta/60">Aún no has guardado diseños en este dispositivo.</p>}
          {saved.map((s) => (
            <div key={s.design.id} className="card flex items-center gap-3 p-2">
              {s.thumbnail ? <img src={s.thumbnail} alt="" className="h-16 w-16 rounded-xl object-cover" /> : <span className="h-16 w-16 rounded-xl bg-navidad/10" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.name}</p>
                <p className="text-xs text-tinta/55">
                  {formatPrice(computePricing(s.design).total)} · {new Date(s.savedAt).toLocaleDateString(appConfig.locale)}
                </p>
              </div>
              <button className="btn-gold !min-h-[40px] !px-4 text-sm" onClick={() => { restore(s.design.id); onClose(); go('customize'); }}>Abrir</button>
              <ConfirmButton className="icon-btn !h-10 !w-10 !shadow-none text-navidad" confirmText="✓" onConfirm={() => remove(s.design.id)}>
                <Icon name="trash" size={18} />
              </ConfirmButton>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
