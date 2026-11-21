import type { DesignItem, ProductConfig } from '@/types';
import { catalog } from '@/config';
import { canPlaceInZone } from '@/engine/constraints';
import { useDesign } from '@/store/designStore';

/** Selector de zona para el elemento seleccionado; las zonas no válidas se muestran deshabilitadas. */
export function ZonePicker({ item, product }: { item: DesignItem; product: ProductConfig }) {
  const design = useDesign((s) => s.design);
  const moveItemToZone = useDesign((s) => s.moveItemToZone);
  const setActiveZone = useDesign((s) => s.setActiveZone);
  return (
    <div>
      <p className="label mb-1.5">Zona</p>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {catalog.zones().map((z) => {
          const on = z.id === item.zoneId;
          const check = canPlaceInZone(product, design, z, item.kind, {
            decorationId: item.kind === 'decoration' ? item.decorationId : undefined,
            ignoreItemId: item.id,
          });
          return (
            <button
              key={z.id}
              className={on ? 'chip-on' : 'chip-off'}
              disabled={!on && !check.ok}
              title={check.reason}
              onClick={() => (on ? setActiveZone(z.id) : moveItemToZone(item.id, z.id))}
              style={!on && !check.ok ? { opacity: 0.4 } : undefined}
            >
              {z.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
