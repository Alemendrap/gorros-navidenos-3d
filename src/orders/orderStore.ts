import { create } from 'zustand';
import type { Order } from '@/types';

/**
 * Último pedido confirmado y qué destinatarios ya recibieron su mensaje.
 * Se guarda en sessionStorage: si el celular recarga la página al volver de WhatsApp,
 * el pedido y el avance del envío no se pierden.
 */
const KEY = 'gorros3d:pedido-actual';

interface OrderState {
  order: Order | null;
  image: string | null;
  sent: Record<string, boolean>;
  set: (o: Order, img: string) => void;
  markSent: (recipientId: string) => void;
}

function load(): Pick<OrderState, 'order' | 'image' | 'sent'> {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* sin almacenamiento disponible */ }
  return { order: null, image: null, sent: {} };
}

function save(s: Pick<OrderState, 'order' | 'image' | 'sent'>) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Si la imagen no cabe, se guarda al menos el pedido y el avance.
    try { sessionStorage.setItem(KEY, JSON.stringify({ ...s, image: null })); } catch { /* ignorar */ }
  }
}

export const useOrderStore = create<OrderState>((set, get) => ({
  ...load(),
  set: (order, image) => {
    set({ order, image, sent: {} });
    save({ order, image, sent: {} });
  },
  markSent: (id) => {
    const sent = { ...get().sent, [id]: true };
    set({ sent });
    save({ order: get().order, image: get().image, sent });
  },
}));
