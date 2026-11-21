import type { ProductConfig } from '@/types';
import { classicHatZones } from './zones';

/**
 * EL GORRO (único producto).
 *
 * Para cambiar el modelo provisional por uno real (GLB):
 *   model: { type: 'gltf', url: 'models/mi-gorro.glb',
 *            surfaceMap: { NombreMallaBorde: 'brim', NombreMallaCuerpo: 'body', NombreMallaPompon: 'pompom' } }
 * Las zonas, textos y decoraciones siguen funcionando igual.
 */
export const hat: ProductConfig = {
  id: 'gorro-navideno',
  name: 'Gorro navideño personalizado',
  tagline: 'Rojo con borde blanco',
  description: 'El gorro navideño tradicional: rojo, borde blanco esponjoso y pompón.',
  model: {
    type: 'procedural',
    variant: 'classic',
    colors: { body: '#B3122E', brim: '#F7F3EA', pompom: '#FBF8F1' },
  },
  zones: classicHatZones,
  camera: { position: [0, 1.7, 6.6], target: [0.15, 1.12, -0.2] },
};
