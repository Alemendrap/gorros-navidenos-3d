import type { FinishConfig } from '@/types';

/**
 * ACABADO ÚNICO: vinilo dorado metálico.
 * Todas las letras y decoraciones se muestran con este acabado.
 * Ajusta aquí el tono o el brillo si el vinilo real se ve distinto.
 */
export const goldFinish: FinishConfig = {
  id: 'oro',
  label: 'Vinilo dorado',
  color: '#DDA93A',
  swatch: 'linear-gradient(135deg,#F6E3A1 0%,#C9A24A 45%,#8C6A22 100%)',
  metalness: 0.85,
  roughness: 0.3,
  edgeRelief: 1,
};
