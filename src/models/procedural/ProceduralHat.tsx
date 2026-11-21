import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ProceduralModelConfig } from '@/types';
import { createBodyGeometry, createBrimGeometry, createPompomGeometry, pompomTransform } from './hatGeometry';
import { getFurNormal, getVelvetNormal } from './fabricTextures';
import { useSurfaceMesh } from '@/viewer/useSurfaceMesh';

// La geometría es igual para todas las variantes de color: se crea una sola vez.
let shared: ReturnType<typeof build> | null = null;
function build() {
  const { geometry: body, spine } = createBodyGeometry();
  const brim = createBrimGeometry();
  const pompom = createPompomGeometry(0.3);
  const pompomPos = pompomTransform(spine);
  return { body, brim, pompom, pompomPos };
}
export const getProceduralHatParts = () => (shared ??= build());

export function ProceduralHat({ config }: { config: ProceduralModelConfig }) {
  const parts = getProceduralHatParts();
  const bodyRef = useRef<THREE.Mesh>(null!);
  const brimRef = useRef<THREE.Mesh>(null!);
  const pomRef = useRef<THREE.Mesh>(null!);

  const materials = useMemo(() => {
    const body = new THREE.MeshPhysicalMaterial({
      color: config.colors.body,
      roughness: 0.82,
      sheen: 1,
      sheenRoughness: 0.42,
      sheenColor: new THREE.Color(config.colors.body).lerp(new THREE.Color('#ffd0d8'), 0.45),
      normalMap: getVelvetNormal(),
      normalScale: new THREE.Vector2(0.35, 0.35),
      side: THREE.DoubleSide,
    });
    const fur = (color: string, repeat: [number, number]) =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 1,
        sheen: 1,
        sheenRoughness: 0.8,
        sheenColor: new THREE.Color('#ffffff'),
        normalMap: getFurNormal(repeat),
        normalScale: new THREE.Vector2(0.9, 0.9),
      });
    return { body, brim: fur(config.colors.brim, [16, 2]), pompom: fur(config.colors.pompom, [6, 6]) };
  }, [config.colors.body, config.colors.brim, config.colors.pompom]);

  useSurfaceMesh(bodyRef, 'body');
  useSurfaceMesh(brimRef, 'brim');
  useSurfaceMesh(pomRef, 'pompom');

  return (
    <group name="gorro-procedural">
      <mesh ref={bodyRef} name="Cuerpo" geometry={parts.body} material={materials.body} castShadow receiveShadow />
      <mesh ref={brimRef} name="Borde" geometry={parts.brim} material={materials.brim} castShadow receiveShadow />
      <mesh ref={pomRef} name="Pompon" geometry={parts.pompom} material={materials.pompom} position={parts.pompomPos} castShadow />
    </group>
  );
}
