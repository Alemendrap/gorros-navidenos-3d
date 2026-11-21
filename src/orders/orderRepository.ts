/**
 * REPOSITORIO DE PEDIDOS
 * Hoy: almacenamiento local del navegador.
 * Mañana: basta con crear otra implementación (API propia, Firebase, Supabase…)
 * que cumpla la misma interfaz y cambiar `orderRepository` al final del archivo.
 */
import type { Order } from '@/types';

export interface OrderRepository {
  save(order: Order): Promise<Order>;
  list(): Promise<Order[]>;
  get(id: string): Promise<Order | undefined>;
}

const KEY = 'gorros3d:orders';
const MAX = 30;

export class LocalOrderRepository implements OrderRepository {
  private read(): Order[] {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
  }
  async save(order: Order) {
    // La imagen completa no se guarda localmente para no agotar el espacio del navegador.
    const slim = { ...order, previewImage: undefined };
    const list = [slim, ...this.read().filter((o) => o.id !== order.id)].slice(0, MAX);
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { console.warn('No se pudo guardar el pedido', e); }
    return order;
  }
  async list() { return this.read(); }
  async get(id: string) { return this.read().find((o) => o.id === id); }
}

/**
 * Ejemplo (ETAPA 2, no activo): envío a un backend propio.
 *
 * export class HttpOrderRepository implements OrderRepository {
 *   constructor(private baseUrl: string) {}
 *   async save(order: Order) {
 *     const r = await fetch(`${this.baseUrl}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
 *     if (!r.ok) throw new Error('Error al enviar el pedido');
 *     return r.json();
 *   }
 *   async list() { return (await fetch(`${this.baseUrl}/orders`)).json(); }
 *   async get(id: string) { return (await fetch(`${this.baseUrl}/orders/${id}`)).json(); }
 * }
 */

export const orderRepository: OrderRepository = new LocalOrderRepository();
