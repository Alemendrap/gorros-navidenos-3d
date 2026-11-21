/**
 * CALCOMANÍA ENVOLVENTE
 *
 * Proyecta una imagen (texto rasterizado, PNG, SVG) sobre la superficie curva
 * dividiéndola en franjas verticales. Cada franja se coloca caminando sobre la
 * superficie y se proyecta con su propia normal, de modo que el vinilo sigue la
 * curvatura del gorro como si estuviera adherido (sin estirarse en los lados).
 */
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { marchAlong, type SurfaceFrame } from './surface';

interface TriangleSoup {
  pos: Float32Array; // 9 por triángulo (mundo)
  nor: Float32Array; // 9 por triángulo (mundo)
  cen: Float32Array; // 3 por triángulo
  fn: Float32Array; // normal de cara, 3 por triángulo
  count: number;
}

const soupCache = new WeakMap<THREE.Mesh, { soup: TriangleSoup; matrixKey: string }>();

function getSoup(mesh: THREE.Mesh): TriangleSoup {
  mesh.updateMatrixWorld(true);
  const matrixKey = mesh.matrixWorld.elements.map((e) => e.toFixed(5)).join(',');
  const cached = soupCache.get(mesh);
  if (cached && cached.matrixKey === matrixKey) return cached.soup;

  const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  const p = g.getAttribute('position');
  const n = g.getAttribute('normal');
  const count = p.count / 3;
  const pos = new Float32Array(count * 9), nor = new Float32Array(count * 9);
  const cen = new Float32Array(count * 3), fn = new Float32Array(count * 3);
  const v = new THREE.Vector3(), nn = new THREE.Vector3();
  const nm = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < count; t++) {
    for (let k = 0; k < 3; k++) {
      const i = t * 3 + k;
      v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld);
      nn.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
      pos.set([v.x, v.y, v.z], i * 3);
      nor.set([nn.x, nn.y, nn.z], i * 3);
    }
    a.fromArray(pos, t * 9); b.fromArray(pos, t * 9 + 3); c.fromArray(pos, t * 9 + 6);
    cen.set([(a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3, (a.z + b.z + c.z) / 3], t * 3);
    const f = new THREE.Vector3().subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize();
    // Usamos la normal promedio de vértices para la orientación (independiente del orden de índices).
    const avg = new THREE.Vector3().fromArray(nor, t * 9).add(new THREE.Vector3().fromArray(nor, t * 9 + 3)).add(new THREE.Vector3().fromArray(nor, t * 9 + 6)).normalize();
    if (f.dot(avg) < 0) f.negate();
    fn.set([f.x, f.y, f.z], t * 3);
  }
  const soup = { pos, nor, cen, fn, count };
  soupCache.set(mesh, { soup, matrixKey });
  return soup;
}

/** Submalla local (solo triángulos cercanos y orientados hacia la proyección) para acelerar DecalGeometry. */
function localMesh(mesh: THREE.Mesh, center: THREE.Vector3, normal: THREE.Vector3, radius: number) {
  const s = getSoup(mesh);
  const r2 = radius * radius;
  const pos: number[] = [], nor: number[] = [];
  for (let t = 0; t < s.count; t++) {
    const dx = s.cen[t * 3] - center.x, dy = s.cen[t * 3 + 1] - center.y, dz = s.cen[t * 3 + 2] - center.z;
    if (dx * dx + dy * dy + dz * dz > r2) continue;
    const facing = s.fn[t * 3] * normal.x + s.fn[t * 3 + 1] * normal.y + s.fn[t * 3 + 2] * normal.z;
    if (facing < 0.05) continue;
    for (let k = 0; k < 9; k++) { pos.push(s.pos[t * 9 + k]); nor.push(s.nor[t * 9 + k]); }
  }
  if (!pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return new THREE.Mesh(g);
}

export interface WrappedDecalOptions {
  meshes: THREE.Mesh[];
  frame: SurfaceFrame;
  width: number;
  height: number;
  /** Separación respecto a la superficie para evitar parpadeos (z-fighting). */
  lift?: number;
  /** Ancho máximo de cada franja. */
  stripWidth?: number;
}

const _m = new THREE.Matrix4();

export function buildWrappedDecal(opts: WrappedDecalOptions): THREE.BufferGeometry | null {
  const { meshes, frame, width, height, lift = 0.003, stripWidth = 0.07 } = opts;
  if (width <= 0 || height <= 0) return null;
  const n = Math.max(1, Math.ceil(width / stripWidth));
  const sw = width / n;
  const centers = Array.from({ length: n }, (_, i) => -width / 2 + sw * (i + 0.5));
  const frames = marchAlong(meshes, frame, centers, 'tangent');
  const depth = Math.max(0.22, height * 1.2);
  const parts: THREE.BufferGeometry[] = [];

  frames.forEach((f, i) => {
    const local = localMesh(f.mesh, f.point, f.normal, Math.hypot(sw, height, depth) * 0.75 + 0.06);
    if (!local) return;
    _m.makeBasis(f.tangent, f.bitangent, f.normal);
    const euler = new THREE.Euler().setFromRotationMatrix(_m);
    const g = new DecalGeometry(local, f.point, euler, new THREE.Vector3(sw * 1.0005, height, depth));
    local.geometry.dispose();
    const uv = g.getAttribute('uv') as THREE.BufferAttribute | undefined;
    if (!uv || uv.count === 0) { g.dispose(); return; }
    const u0 = i / n, u1 = (i + 1) / n;
    for (let k = 0; k < uv.count; k++) uv.setX(k, u0 + uv.getX(k) * (u1 - u0));
    // Ligero despegue a lo largo de la normal para que el vinilo quede encima de la tela.
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    const nn = g.getAttribute('normal') as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) {
      p.setXYZ(k, p.getX(k) + nn.getX(k) * lift, p.getY(k) + nn.getY(k) * lift, p.getZ(k) + nn.getZ(k) * lift);
    }
    parts.push(g);
  });

  if (!parts.length) return null;
  const merged = parts.length === 1 ? parts[0] : mergeGeometries(parts, false);
  if (parts.length > 1) parts.forEach((p) => p.dispose());
  merged?.computeBoundingSphere();
  return merged;
}
