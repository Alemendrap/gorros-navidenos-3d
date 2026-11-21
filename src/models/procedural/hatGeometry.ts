/**
 * Generador PROCEDURAL del gorro provisional.
 *
 * No es un cono rígido: el cuerpo es un tubo de sección variable que sigue una
 * columna curva (la punta cae hacia atrás y a un lado), con arrugas suaves de tela
 * y un pliegue en la zona donde se dobla. El borde es un aro de perfil redondeado
 * y el pompón una esfera deformada con ruido para simular volumen esponjoso.
 *
 * Todas las funciones son puras (devuelven BufferGeometry) para poder
 * reutilizarlas, exportarlas a GLB o sustituirlas por un modelo real.
 */
import * as THREE from 'three';
import { fbm3, smoothstep } from '@/lib/noise';

export const HAT_DIMENSIONS = {
  brimInnerRadius: 0.97,
  brimOuterRadius: 1.2,
  brimBottom: -0.02,
  brimTop: 0.46,
  bodyBaseRadius: 1.02,
  bodyBaseY: 0.2,
} as const;

/** Columna vertebral del cuerpo: sube recto y la punta cae hacia un lado (y un poco atrás). */
export function createSpine() {
  return new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0.2, 0),
      new THREE.Vector3(0, 0.85, -0.02),
      new THREE.Vector3(0.03, 1.48, -0.08),
      new THREE.Vector3(0.22, 1.98, -0.16),
      new THREE.Vector3(0.6, 2.2, -0.26),
      new THREE.Vector3(0.98, 2.04, -0.34),
      new THREE.Vector3(1.2, 1.68, -0.38),
    ],
    false,
    'centripetal',
  );
}

function bodyRadius(t: number) {
  const base = HAT_DIMENSIONS.bodyBaseRadius;
  // Perfil orgánico: se estrecha suavemente, con un ligero abombamiento en la parte baja.
  const taper = Math.pow(1 - t, 0.95);
  const belly = 1 + 0.07 * Math.sin(Math.PI * Math.min(1, t * 1.6));
  return Math.max(0.07, base * taper * belly + 0.05 * t);
}

/** Cuerpo de terciopelo. */
export function createBodyGeometry(radialSegments = 96, lengthSegments = 120) {
  const spine = createSpine();
  const cols = radialSegments + 1;
  const rows = lengthSegments + 1;
  const pos = new Float32Array(cols * rows * 3);
  const uv = new Float32Array(cols * rows * 2);

  // Marcos por transporte paralelo (estables aunque la curva sea casi recta).
  let normal = new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const center = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  // Dirección hacia la que se dobla (lado y abajo) la punta (interior del pliegue).
  const bendDir = new THREE.Vector3(1, -0.55, -0.15).normalize();

  for (let j = 0; j < rows; j++) {
    const t = j / lengthSegments;
    spine.getPointAt(t, center);
    spine.getTangentAt(t, tangent);
    normal = normal.sub(tmp.copy(tangent).multiplyScalar(normal.dot(tangent))).normalize();
    binormal.crossVectors(tangent, normal).normalize();

    const r0 = bodyRadius(t);
    const wrinkleAmt = smoothstep(0.08, 0.5, t) * (1 - smoothstep(0.85, 1, t));
    const foldAmt = smoothstep(0.45, 0.62, t) * (1 - smoothstep(0.7, 0.86, t));

    for (let i = 0; i < cols; i++) {
      const th = (i / radialSegments) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      const radial = tmp.set(0, 0, 0).addScaledVector(normal, c).addScaledVector(binormal, s);
      // Arrugas de tela + ruido orgánico.
      const n = fbm3(c * 1.6 + 3, s * 1.6, t * 5, 3);
      let r = r0 * (1 + wrinkleAmt * (0.03 * Math.sin(5 * th + t * 9) + 0.045 * n));
      // Pliegue en el interior de la curva.
      const inner = Math.max(0, radial.dot(bendDir));
      r *= 1 - foldAmt * 0.22 * inner * inner;
      r *= 1 + foldAmt * 0.06 * (1 - inner);
      const k = (j * cols + i) * 3;
      pos[k] = center.x + radial.x * r;
      pos[k + 1] = center.y + radial.y * r;
      pos[k + 2] = center.z + radial.z * r;
      uv[(j * cols + i) * 2] = i / radialSegments;
      uv[(j * cols + i) * 2 + 1] = t;
    }
  }

  const index: number[] = [];
  for (let j = 0; j < lengthSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  fixSeamNormals(g, cols, rows);
  ensureOutwardNormals(g, spine);
  return { geometry: g, spine };
}

/** Promedia las normales de la costura (columna 0 y última) para que no se vea la unión. */
function fixSeamNormals(g: THREE.BufferGeometry, cols: number, rows: number) {
  const n = g.getAttribute('normal') as THREE.BufferAttribute;
  for (let j = 0; j < rows; j++) {
    const a = j * cols, b = j * cols + cols - 1;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l);
    n.setXYZ(b, x / l, y / l, z / l);
  }
  n.needsUpdate = true;
}

/** Garantiza que las normales apunten hacia fuera (si el orden de índices quedó invertido). */
function ensureOutwardNormals(g: THREE.BufferGeometry, spine: THREE.Curve<THREE.Vector3>) {
  const p = g.getAttribute('position');
  const n = g.getAttribute('normal');
  const c = spine.getPointAt(0.1);
  const i = Math.floor(p.count * 0.1);
  const out = new THREE.Vector3(p.getX(i) - c.x, p.getY(i) - c.y, p.getZ(i) - c.z);
  const nn = new THREE.Vector3(n.getX(i), n.getY(i), n.getZ(i));
  if (out.dot(nn) < 0) {
    const idx = g.getIndex()!;
    for (let k = 0; k < idx.count; k += 3) {
      const b = idx.getX(k + 1);
      idx.setX(k + 1, idx.getX(k + 2));
      idx.setX(k + 2, b);
    }
    idx.needsUpdate = true;
    g.computeVertexNormals();
  }
}

/** Borde blanco: aro de perfil redondeado ligeramente abombado. */
export function createBrimGeometry(segments = 144) {
  const { brimInnerRadius: ri, brimOuterRadius: ro, brimBottom: yb, brimTop: yt } = HAT_DIMENSIONS;
  const rc = 0.13; // radio de las esquinas
  const pts: THREE.Vector2[] = [];
  const arc = (cx: number, cy: number, a0: number, a1: number, steps: number) => {
    for (let i = 0; i <= steps; i++) {
      const a = a0 + ((a1 - a0) * i) / steps;
      pts.push(new THREE.Vector2(cx + Math.cos(a) * rc, cy + Math.sin(a) * rc));
    }
  };
  // Recorrido del perfil (r, y) en sentido antihorario: interior abajo → exterior → interior arriba.
  arc(ri + rc, yb + rc, Math.PI, Math.PI * 1.5, 6);
  arc(ro - rc, yb + rc, -Math.PI / 2, 0, 8);
  // Cara exterior abombada (aquí van los vinilos).
  const steps = 16;
  for (let i = 1; i < steps; i++) {
    const y = yb + rc + ((yt - yb - 2 * rc) * i) / steps;
    const k = Math.sin((Math.PI * i) / steps);
    pts.push(new THREE.Vector2(ro + 0.025 * k, y));
  }
  arc(ro - rc, yt - rc, 0, Math.PI / 2, 8);
  arc(ri + rc, yt - rc, Math.PI / 2, Math.PI, 6);
  pts.push(pts[0].clone());
  const g = new THREE.LatheGeometry(pts, segments);
  // Lathe genera la costura en theta=0; alineamos para que caiga en la parte trasera interior.
  g.rotateY(Math.PI);
  return g;
}

/** Pompón esponjoso. */
export function createPompomGeometry(radius = 0.3) {
  const g = new THREE.IcosahedronGeometry(radius, 24);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = v.clone().normalize();
    const n = fbm3(d.x * 3.2, d.y * 3.2, d.z * 3.2, 4);
    const fine = fbm3(d.x * 14, d.y * 14, d.z * 14, 2);
    v.copy(d).multiplyScalar(radius * (1 + 0.1 * n + 0.035 * fine));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.deleteAttribute('normal');
  const merged = mergeVerticesSimple(g);
  merged.computeVertexNormals();
  return merged;
}

/** Une vértices duplicados para que el ruido no abra grietas. */
function mergeVerticesSimple(g: THREE.BufferGeometry) {
  const p = g.getAttribute('position');
  const map = new Map<string, number>();
  const verts: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < p.count; i++) {
    // La geometría original no indexada: se agrupan los puntos que coinciden antes del ruido
    const key = `${p.getX(i).toFixed(4)}_${p.getY(i).toFixed(4)}_${p.getZ(i).toFixed(4)}`;
    let id = map.get(key);
    if (id === undefined) {
      id = verts.length / 3;
      map.set(key, id);
      verts.push(p.getX(i), p.getY(i), p.getZ(i));
    }
    idx.push(id);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  out.setIndex(idx);
  return out;
}

/** Posición y orientación del pompón al final de la columna. */
export function pompomTransform(spine: THREE.Curve<THREE.Vector3>) {
  const end = spine.getPointAt(1);
  const tan = spine.getTangentAt(1);
  return end.add(tan.multiplyScalar(0.16));
}
