import { catalog } from '@/config';
import { useDesign } from '@/store/designStore';
import { Icon } from './Icon';

export function ZonesPanel() {
  const items = useDesign((s) => s.design.items);
  const activeZoneId = useDesign((s) => s.activeZoneId);
  const setActiveZone = useDesign((s) => s.setActiveZone);
  const showGuides = useDesign((s) => s.showGuides);
  const setShowGuides = useDesign((s) => s.setShowGuides);
  const addText = useDesign((s) => s.addText);
  const setTab = useDesign((s) => s.setTab);

  return (
    <div className="space-y-3">
      <label className="card flex cursor-pointer items-center justify-between p-3">
        <span className="text-sm font-medium">Mostrar zonas sobre el gorro</span>
        <input type="checkbox" className="h-6 w-6 accent-[#C9A24A]" checked={showGuides} onChange={(e) => setShowGuides(e.target.checked)} />
      </label>
      {catalog.zones().map((z) => {
        const used = items.filter((i) => i.zoneId === z.id).length;
        const on = z.id === activeZoneId;
        return (
          <div key={z.id} className={`card p-3 transition ${on ? 'border-oro shadow-glow' : ''}`}>
            <button className="flex w-full items-start gap-3 text-left" onClick={() => setActiveZone(z.id)}>
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${on ? 'bg-oro text-white' : 'bg-oro/15 text-oro-dark'}`}>
                <Icon name="target" size={18} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{z.name}</span>
                {z.description && <span className="block text-xs text-tinta/60">{z.description}</span>}
                <span className="mt-1 block text-[11px] text-tinta/50">
                  {used}/{z.maxItems} elementos · hasta {z.maxChars} letras · {z.allowedKinds.map((k) => (k === 'text' ? 'texto' : 'decoraciones')).join(' y ')}
                </span>
              </span>
            </button>
            {on && z.allowedKinds.includes('text') && used < z.maxItems && (
              <button className="btn-outline mt-2 !min-h-[40px] w-full text-sm" onClick={() => { addText(z.id); setTab('texto'); }}>
                <Icon name="plus" size={16} /> Añadir texto aquí
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
