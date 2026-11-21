import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { GltfModelConfig } from '@/types';
import { useSurfaceRegistry } from '@/engine/surfaceRegistry';
import { prepareSurfaceMesh } from '@/engine/surface';
import { assetUrl } from '@/lib/assets';

/**
 * Carga un gorro real en GLB/GLTF y registra sus mallas según `surfaceMap`.
 * Las mallas cuyo nombre no aparece en surfaceMap se muestran pero no admiten personalización.
 */
export function GltfHat({ config }: { config: GltfModelConfig }) {
  const gltf = useGLTF(assetUrl(config.url));
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const group = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    group.current.updateMatrixWorld(true);
    const registered: THREE.Mesh[] = [];
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const role = config.surfaceMap[mesh.name] ?? (mesh.parent ? config.surfaceMap[mesh.parent.name] : undefined);
      if (!role) return;
      prepareSurfaceMesh(mesh);
      useSurfaceRegistry.getState().register(role, mesh);
      registered.push(mesh);
    });
    if (!registered.length) {
      console.warn('[GltfHat] Ninguna malla coincide con surfaceMap. Mallas disponibles:',
        (() => { const n: string[] = []; scene.traverse((o) => (o as THREE.Mesh).isMesh && n.push(o.name)); return n; })());
    }
    return () => registered.forEach((m) => useSurfaceRegistry.getState().unregister(m));
  }, [scene, config.surfaceMap]);

  const rot = (config.rotationDeg ?? [0, 0, 0]).map((d) => THREE.MathUtils.degToRad(d)) as [number, number, number];
  return (
    <group ref={group} position={config.position ?? [0, 0, 0]} rotation={rot} scale={config.scale ?? 1}>
      <primitive object={scene} />
    </group>
  );
}
