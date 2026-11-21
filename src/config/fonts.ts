import type { FontConfig } from '@/types';

/*
 * TIPOGRAFÍA ÚNICA para todos los textos del gorro.
 *
 * ⚠️ PROVISIONAL: "Great Vibes" se usa solo mientras llega la tipografía definitiva.
 *
 * Cómo poner la tipografía definitiva (archivo .woff2/.woff/.ttf/.otf):
 *   1. Copia el archivo a  src/assets/fonts/  (ej. src/assets/fonts/mi-letra.woff2)
 *   2. En src/styles/text-font.css descomenta el bloque @font-face y pon el nombre del archivo.
 *   3. Aquí abajo cambia `family` por el nombre usado en @font-face (ej. 'Letra Gorros'),
 *      ajusta `weight` y, si se ve pequeña o grande, `sizeAdjust`.
 *   4. Borra la línea `import '@fontsource/great-vibes/latin-400.css'`.
 * No hay que tocar nada más: editor, visor 3D, imagen final y pedido usan esta configuración.
 */
import '@fontsource/great-vibes/latin-400.css';
import '@/styles/text-font.css';

export const textFont: FontConfig = {
  id: 'provisional',
  label: 'Tipografía provisional',
  family: 'Great Vibes',
  weight: 400,
  sizeAdjust: 1.15,
};
