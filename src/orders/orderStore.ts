import { create } from 'zustand';
import type { Order } from '@/types';

/** Último pedido generado en esta sesión (para la pantalla de confirmación). */
export const useOrderStore = create<{ order: Order | null; image: string | null; set: (o: Order, img: string) => void }>((set) => ({
  order: null,
  image: null,
  set: (order, image) => set({ order, image }),
}));
