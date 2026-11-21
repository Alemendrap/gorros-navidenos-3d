/**
 * Punto único de acceso al catálogo. Si en el futuro el catálogo viene de una
 * API o de un panel administrativo, basta con reemplazar estas funciones.
 */
import { appConfig } from './app';
import { hat } from './products';
import { decorations, decorationCategories } from './decorations';
import { textFont } from './fonts';
import { goldFinish } from './finishes';
import type { ZoneConfig } from '@/types';

export const catalog = {
  product: () => hat,
  zones: (): ZoneConfig[] => hat.zones.filter((z) => z.enabled),
  zone: (id: string) => hat.zones.find((z) => z.id === id),
  font: () => textFont,
  finish: () => goldFinish,
  decorationsEnabled: () => appConfig.features.decorations,
  decorations: () => decorations.filter((d) => d.enabled),
  decorationCategories: () => decorationCategories,
};

export { appConfig };
