import type { ZoneConfig } from '@/types';

/**
 * ZONAS DE PERSONALIZACIÓN (slots) del gorro clásico.
 *
 * - anchor.azimuthDeg: 0 = frente, 90 = lado izquierdo de quien lo usa,
 *   -90 = lado derecho de quien lo usa, 180 = atrás.
 * - anchor.height: altura en unidades del modelo (el borde blanco está entre 0 y 0.46).
 * - maxSize: ancho y alto máximos, medidos a lo largo de la superficie.
 *
 * El motor busca el punto real de la superficie lanzando un rayo, así que
 * estas zonas siguen funcionando si se cambia el modelo por un GLB con
 * proporciones parecidas (solo habría que afinar alturas).
 */
const brimConstraints = {
  minSize: 0.1,
  maxSize: 0.32,
  allowRotation: true,
  maxRotationDeg: 15,
  allowOffset: true,
};

export const classicHatZones: ZoneConfig[] = [
  {
    id: 'frente',
    name: 'Frente del borde',
    description: 'Centro del borde blanco, la zona más visible.',
    enabled: true,
    surfaces: ['brim'],
    anchor: { azimuthDeg: 0, height: 0.22 },
    rotationDeg: 0,
    maxSize: { width: 1.55, height: 0.36 },
    allowedKinds: ['text', 'decoration'],
    maxItems: 3,
    maxChars: 14,
    constraints: { ...brimConstraints },
  },
  {
    id: 'lateral-izquierdo',
    name: 'Lateral izquierdo',
    description: 'Borde blanco, lado izquierdo de quien lo usa.',
    enabled: true,
    surfaces: ['brim'],
    anchor: { azimuthDeg: 90, height: 0.22 },
    rotationDeg: 0,
    maxSize: { width: 1.0, height: 0.36 },
    allowedKinds: ['text', 'decoration'],
    maxItems: 2,
    maxChars: 10,
    constraints: { ...brimConstraints },
  },
  {
    id: 'lateral-derecho',
    name: 'Lateral derecho',
    description: 'Borde blanco, lado derecho de quien lo usa.',
    enabled: true,
    surfaces: ['brim'],
    anchor: { azimuthDeg: -90, height: 0.22 },
    rotationDeg: 0,
    maxSize: { width: 1.0, height: 0.36 },
    allowedKinds: ['text', 'decoration'],
    maxItems: 2,
    maxChars: 10,
    constraints: { ...brimConstraints },
  },
  {
    id: 'posterior',
    name: 'Zona posterior',
    description: 'Parte trasera del borde blanco.',
    enabled: true,
    surfaces: ['brim'],
    anchor: { azimuthDeg: 180, height: 0.22 },
    rotationDeg: 0,
    maxSize: { width: 1.45, height: 0.36 },
    allowedKinds: ['text', 'decoration'],
    maxItems: 3,
    maxChars: 14,
    constraints: { ...brimConstraints },
  },
  {
    id: 'superior',
    name: 'Zona superior',
    description: 'Sobre la tela roja, encima del borde.',
    enabled: true,
    surfaces: ['body'],
    anchor: { azimuthDeg: 0, height: 0.95 },
    rotationDeg: 0,
    maxSize: { width: 1.1, height: 0.5 },
    allowedKinds: ['text', 'decoration'],
    maxItems: 2,
    maxChars: 14,
    constraints: { minSize: 0.1, maxSize: 0.34, allowRotation: true, maxRotationDeg: 25, allowOffset: true },
  },
];
