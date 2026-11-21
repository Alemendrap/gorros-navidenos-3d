/**
 * Herramienta de desarrollo: exporta el gorro procedural a GLB.
 * Útil como referencia de escala y nombres de malla para el modelador 3D
 * (el GLB real debería conservar: altura ~2.4 u, borde entre y=0 y y=0.46,
 * y mallas separadas para borde, cuerpo y pompón).
 *
 * Uso: abrir la app con ?debug y ejecutar en consola:
 *   const m = await import('/src/dev/exportProceduralGlb.ts'); await m.downloadProceduralGlb();
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { getProceduralHatParts } from '@/models/procedural/ProceduralHat';

export function buildProceduralScene(colors = { body: '#B3122E', brim: '#F7F3EA', pompom: '#FBF8F1' }) {
  const parts = getProceduralHatParts();
  const scene = new THREE.Group();
  scene.name = 'GorroProvisional';
  const body = new THREE.Mesh(parts.body.clone(), new THREE.MeshPhysicalMaterial({ color: colors.body, roughness: 0.82, sheen: 1, sheenRoughness: 0.42, sheenColor: new THREE.Color('#ff9fb0'), side: THREE.DoubleSide }));
  body.name = 'Cuerpo';
  const brim = new THREE.Mesh(parts.brim.clone(), new THREE.MeshPhysicalMaterial({ color: colors.brim, roughness: 1, sheen: 1, sheenRoughness: 0.8, sheenColor: new THREE.Color('#ffffff') }));
  brim.name = 'Borde';
  const pom = new THREE.Mesh(parts.pompom.clone(), new THREE.MeshPhysicalMaterial({ color: colors.pompom, roughness: 1, sheen: 1, sheenRoughness: 0.8, sheenColor: new THREE.Color('#ffffff') }));
  pom.name = 'Pompon';
  pom.position.copy(parts.pompomPos);
  scene.add(body, brim, pom);
  return scene;
}

export async function exportProceduralGlb(): Promise<ArrayBuffer> {
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(buildProceduralScene(), { binary: true });
  return result as ArrayBuffer;
}

export async function downloadProceduralGlb() {
  const buf = await exportProceduralGlb();
  const url = URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'gorro-provisional.glb'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Versión en base64 (para automatizar pruebas). */
export async function exportProceduralGlbBase64() {
  const bytes = new Uint8Array(await exportProceduralGlb());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
