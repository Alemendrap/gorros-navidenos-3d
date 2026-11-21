import type { DesignItem, ZoneConfig } from '@/types';
import { resolvePlacement } from '@/engine/constraints';
import { useDesign } from '@/store/designStore';
import { Slider } from './Slider';
import { Icon } from './Icon';
import { ConfirmButton } from './ConfirmButton';

/** Controles comunes: tamaño, giro, posición dentro de la zona, duplicar y eliminar. */
export function ItemTransformControls({ item, zone, aspect }: { item: DesignItem; zone: ZoneConfig; aspect: number }) {
  const updateItem = useDesign((s) => s.updateItem);
  const removeItem = useDesign((s) => s.removeItem);
  const duplicateItem = useDesign((s) => s.duplicateItem);
  const p = resolvePlacement(item, zone, aspect);
  const cm = (v: number) => `${(v * 10).toFixed(1)} cm`; // escala aproximada del modelo (1 u ≈ 10 cm)
  const set = (patch: Partial<DesignItem>) => updateItem(item.id, patch as never);

  return (
    <div className="space-y-2">
      <Slider
        label="Tamaño"
        value={p.height}
        min={p.ranges.size[0]}
        max={p.ranges.size[1]}
        onChange={(v) => set({ size: v })}
        format={cm}
        hint={p.fitted ? 'Ajustado automáticamente al ancho de la zona' : undefined}
      />
      {p.ranges.rotation[1] > 0 && (
        <Slider label="Giro" value={p.rotationDeg} min={p.ranges.rotation[0]} max={p.ranges.rotation[1]} step={1} onChange={(v) => set({ rotationDeg: v })} format={(v) => `${Math.round(v)}°`} />
      )}
      {zone.constraints.allowOffset && (
        <div className="grid grid-cols-2 gap-3">
          <Slider label="Mover ↔" value={p.u} min={p.ranges.u[0]} max={p.ranges.u[1]} onChange={(v) => set({ offset: { u: v, v: p.v } })} format={cm} />
          <Slider label="Mover ↕" value={p.v} min={p.ranges.v[0]} max={p.ranges.v[1]} onChange={(v) => set({ offset: { u: p.u, v } })} format={cm} />
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <button className="btn-outline !min-h-[42px] !px-4 text-sm" onClick={() => set({ offset: { u: 0, v: 0 }, rotationDeg: 0 })}>
          <Icon name="center" size={18} /> Centrar
        </button>
        <button className="btn-outline !min-h-[42px] !px-4 text-sm" onClick={() => duplicateItem(item.id)}>
          <Icon name="copy" size={18} /> Duplicar
        </button>
        <ConfirmButton className="btn-danger !min-h-[42px] !px-4 text-sm" confirmText="¿Eliminar?" onConfirm={() => removeItem(item.id)}>
          <Icon name="trash" size={18} /> Eliminar
        </ConfirmButton>
      </div>
    </div>
  );
}
