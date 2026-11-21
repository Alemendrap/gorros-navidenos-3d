/**
 * MOTOR DE SUPERFICIE
 *
 * Encuentra puntos reales sobre la malla del gorro (rayos) y se desplaza
 * "caminando" sobre la superficie. Es lo que permite que textos y decoraciones
 * se adhieran a la tela en lugar de flotar delante o atravesarla, y funciona
 * igual con el modelo provisional que con un GLB real.
 */
import * as THREE from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import type { ZoneConfig } from '@/types';

// Aceleración de rayos (BVH) para que todo sea fluido en móviles.
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export function prepareSurfaceMesh(mesh: THREE.Mesh) {
  if (!mesh.geometry.boundsTree) mesh.geometry.computeBoundsTree();
  mesh.updateMatrixWorld(true);
}

export interface SurfaceFrame {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  /** Dirección "derecha" de la zona sobre la superficie. */
  tangent: THREE.Vector3;
  /** Dirección "arriba" de la zona sobre la superficie. */
  bitangent: THREE.Vector3;
  mesh: THREE.Mesh;
}

const UP = new THREE.Vector3(0, 1, 0);
const raycaster = new THREE.Raycaster();
(raycaster as unknown as { firstHitOnly: boolean }).firstHitOnly = true;

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
const _na = new THREE.Vector3(), _nb = new THREE.Vector3(), _nc = new THREE.Vector3();
const _bary = new THREE.Vector3(), _local = new THREE.Vector3();

/** Normal suavizada (interpolada) en el punto de impacto, en espacio mundo. */
function smoothNormal(hit: THREE.Intersection<THREE.Object3D>): THREE.Vector3 {
  const mesh = hit.object as THREE.Mesh;
  const face = hit.face!;
  const pos = mesh.geometry.getAttribute('position');
  const nor = mesh.geometry.getAttribute('normal');
  if (!nor) return face.normal.clone().transformDirection(mesh.matrixWorld);
  _a.fromBufferAttribute(pos, face.a); _b.fromBufferAttribute(pos, face.b); _c.fromBufferAttribute(pos, face.c);
  _na.fromBufferAttribute(nor, face.a); _nb.fromBufferAttribute(nor, face.b); _nc.fromBufferAttribute(nor, face.c);
  _local.copy(hit.point);
  mesh.worldToLocal(_local);
  THREE.Triangle.getBarycoord(_local, _a, _b, _c, _bary);
  const n = new THREE.Vector3()
    .addScaledVector(_na, _bary.x)
    .addScaledVector(_nb, _bary.y)
    .addScaledVector(_nc, _bary.z);
  return n.transformDirection(mesh.matrixWorld).normalize();
}

export function castToSurface(meshes: THREE.Mesh[], origin: THREE.Vector3, direction: THREE.Vector3) {
  if (!meshes.length) return null;
  raycaster.set(origin, direction.clone().normalize());
  raycaster.near = 0;
  raycaster.far = 50;
  const hits = raycaster.intersectObjects(meshes, false);
  const hit = hits[0];
  if (!hit || !hit.face) return null;
  const normal = smoothNormal(hit);
  if (normal.dot(direction) > 0) normal.negate(); // siempre hacia el observador del rayo
  return { point: hit.point.clone(), normal, mesh: hit.object as THREE.Mesh };
}

function frameFromHit(
  hit: { point: THREE.Vector3; normal: THREE.Vector3; mesh: THREE.Mesh },
  tangentHint?: THREE.Vector3,
): SurfaceFrame {
  const n = hit.normal;
  let t: THREE.Vector3;
  if (tangentHint) {
    t = tangentHint.clone().addScaledVector(n, -tangentHint.dot(n));
  } else {
    t = new THREE.Vector3().crossVectors(UP, n);
  }
  if (t.lengthSq() < 1e-6) t = new THREE.Vector3(1, 0, 0).addScaledVector(n, -n.x);
  t.normalize();
  const b = new THREE.Vector3().crossVectors(n, t).normalize();
  return { point: hit.point, normal: n.clone(), tangent: t, bitangent: b, mesh: hit.mesh };
}

/** Rota la tangente/bitangente de un marco alrededor de su normal. */
export function rotateFrame(f: SurfaceFrame, radians: number): SurfaceFrame {
  if (!radians) return f;
  const c = Math.cos(radians), s = Math.sin(radians);
  const t = f.tangent.clone().multiplyScalar(c).addScaledVector(f.bitangent, s).normalize();
  const b = new THREE.Vector3().crossVectors(f.normal, t).normalize();
  return { ...f, tangent: t, bitangent: b };
}

/** Marco de una zona: punto exacto de la superficie + orientación. */
export function zoneFrame(zone: ZoneConfig, meshes: THREE.Mesh[]): SurfaceFrame | null {
  let origin: THREE.Vector3, dir: THREE.Vector3;
  if (zone.ray) {
    origin = new THREE.Vector3(...zone.ray.origin);
    dir = new THREE.Vector3(...zone.ray.direction).normalize();
  } else {
    const az = THREE.MathUtils.degToRad(zone.anchor.azimuthDeg);
    const out = new THREE.Vector3(Math.sin(az), 0, Math.cos(az));
    origin = out.clone().multiplyScalar(8).setY(zone.anchor.height);
    dir = out.clone().negate();
  }
  const hit = castToSurface(meshes, origin, dir);
  if (!hit) return null;
  const f = frameFromHit(hit);
  return rotateFrame(f, THREE.MathUtils.degToRad(zone.rotationDeg));
}

const STEP = 0.035;

/**
 * Camina sobre la superficie una distancia (puede ser negativa) en la dirección
 * de la tangente del marco. Si se sale de la malla, se detiene en el borde.
 * Devuelve los marcos para cada distancia pedida (deben venir ordenadas por |d|).
 */
export function marchAlong(
  meshes: THREE.Mesh[],
  start: SurfaceFrame,
  distances: number[],
  axis: 'tangent' | 'bitangent' = 'tangent',
): SurfaceFrame[] {
  const out: SurfaceFrame[] = new Array(distances.length);
  const sign = (d: number) => (d < 0 ? -1 : 1);
  // Procesamos por separado distancias positivas y negativas, de forma incremental.
  for (const dirSign of [1, -1]) {
    let cur = start;
    let travelled = 0;
    const idx = distances
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => (dirSign === 1 ? d >= 0 : d < 0))
      .sort((a, b) => Math.abs(a.d) - Math.abs(b.d));
    for (const { d, i } of idx) {
      const target = Math.abs(d);
      while (travelled < target - 1e-6) {
        const step = Math.min(STEP, target - travelled);
        const moveDir = (axis === 'tangent' ? cur.tangent : cur.bitangent).clone().multiplyScalar(sign(d));
        const probe = cur.point.clone().addScaledVector(moveDir, step);
        const origin = probe.clone().addScaledVector(cur.normal, 0.25);
        const hit = castToSurface(meshes, origin, cur.normal.clone().negate());
        if (!hit || hit.point.distanceTo(cur.point) > step * 3) {
          travelled = target; // borde de la malla: nos quedamos donde estamos
          break;
        }
        // Transporte paralelo de la orientación.
        const n = hit.normal;
        const t = cur.tangent.clone().addScaledVector(n, -cur.tangent.dot(n)).normalize();
        const b = new THREE.Vector3().crossVectors(n, t).normalize();
        cur = { point: hit.point, normal: n, tangent: t, bitangent: b, mesh: hit.mesh };
        travelled += step;
      }
      out[i] = cur;
    }
  }
  return out;
}

/** Marco de un elemento: zona → desplazamiento u/v sobre la superficie → giro propio. */
export function itemFrame(
  meshes: THREE.Mesh[],
  zone: SurfaceFrame,
  offset: { u: number; v: number },
  rotationDeg: number,
): SurfaceFrame {
  let f = zone;
  if (offset.u) f = marchAlong(meshes, f, [offset.u], 'tangent')[0];
  if (offset.v) f = marchAlong(meshes, f, [offset.v], 'bitangent')[0];
  return rotateFrame(f, THREE.MathUtils.degToRad(rotationDeg));
}
