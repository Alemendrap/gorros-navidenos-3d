import { useLayoutEffect, type RefObject } from 'react';
import type * as THREE from 'three';
import { useSurfaceRegistry } from '@/engine/surfaceRegistry';
import { prepareSurfaceMesh } from '@/engine/surface';
import type { SurfaceRole } from '@/types';

/** Registra una malla como superficie personalizable mientras está montada. */
export function useSurfaceMesh(ref: RefObject<THREE.Mesh>, role: SurfaceRole, deps: unknown[] = []) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    prepareSurfaceMesh(mesh);
    useSurfaceRegistry.getState().register(role, mesh);
    return () => useSurfaceRegistry.getState().unregister(mesh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, ...deps]);
}
