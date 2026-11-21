import type { DecorationCategory, DecorationConfig } from '@/types';

/**
 * CATÁLOGO DE DISEÑOS (decoraciones).
 * Todos se muestran en vinilo dorado: la imagen se usa como silueta.
 *
 * Para añadir un diseño:
 *   1. Guarda una imagen PNG con fondo transparente (o SVG) en public/decorations/disenos/
 *      — la forma puede ser de cualquier color; solo importa la silueta.
 *   2. Añade una entrada aquí abajo con su id, nombre y archivo.
 * Para ocultar uno sin borrarlo: enabled: false.
 *
 * El precio de cada diseño lo define appConfig.pricing.pricePerElement.
 */
export const decorationCategories: DecorationCategory[] = [{ id: 'disenos', label: 'Diseños' }];

const design = (id: string, name: string, file: string, aspect: number): DecorationConfig => ({
  id,
  name,
  category: 'disenos',
  source: { type: 'image', src: `decorations/disenos/${file}` },
  aspect,
  defaultSize: 0.22,
  allowedZones: '*',
  constraints: { minSize: 0.08, maxSize: 0.34, allowRotation: true },
  enabled: true,
});

export const decorations: DecorationConfig[] = [
  design('estrella', 'Estrella', 'estrella.png', 1.047),
  design('estrella-fugaz', 'Estrella fugaz', 'estrella-fugaz.png', 1.299),
  design('destellos', 'Destellos', 'destellos.png', 1),
  design('corazon', 'Corazón', 'corazon.png', 1.073),
  design('arbol', 'Árbol', 'arbol.png', 0.742),
];

export const getDecoration = (id: string) => decorations.find((d) => d.id === id);
