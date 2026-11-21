/**
 * Registro de superficies del modelo cargado.
 * El modelo (procedural o GLB) registra sus mallas con un rol (brim/body/pompom).
 * El motor de personalización solo habla con este registro, nunca con el modelo
 * directamente: por eso cambiar el modelo no rompe la personalización.
 */
import { create } from 'zustand';
import type * as THREE from 'three';
import type { SurfaceRole } from '@/types';

interface SurfaceRegistryState {
  meshes: Partial<Record<SurfaceRole, THREE.Mesh[]>>;
  /** Se incrementa cada vez que cambian las superficies (para recalcular calcomanías). */
  version: number;
  register: (role: SurfaceRole, mesh: THREE.Mesh) => void;
  unregister: (mesh: THREE.Mesh) => void;
}

export const useSurfaceRegistry = create<SurfaceRegistryState>((set) => ({
  meshes: {},
  version: 0,
  register: (role, mesh) =>
    set((s) => {
      const list = (s.meshes[role] ?? []).filter((m) => m !== mesh);
      mesh.userData.surfaceRole = role;
      return { meshes: { ...s.meshes, [role]: [...list, mesh] }, version: s.version + 1 };
    }),
  unregister: (mesh) =>
    set((s) => {
      const next: SurfaceRegistryState['meshes'] = {};
      for (const [k, v] of Object.entries(s.meshes)) next[k] = (v ?? []).filter((m) => m !== mesh);
      return { meshes: next, version: s.version + 1 };
    }),
}));

export function meshesFor(roles: SurfaceRole[]) {
  const all = useSurfaceRegistry.getState().meshes;
  return roles.flatMap((r) => all[r] ?? []);
}
