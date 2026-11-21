/**
 * ESTADO DEL PERSONALIZADOR (Zustand)
 * - El diseño en curso se guarda automáticamente en el dispositivo (borrador).
 * - Los diseños guardados por el cliente se conservan en localStorage.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Design, DesignItem, DecorationItem, SavedDesign, TextItem } from '@/types';
import { catalog, appConfig } from '@/config';
import { getDecoration } from '@/config/decorations';
import { canPlaceInZone, sanitizeText, sizeLimits } from '@/engine/constraints';
import { uid } from '@/lib/id';

export type Screen = 'welcome' | 'customize' | 'preview' | 'confirm';
export type PanelTab = 'texto' | 'decoraciones' | 'zonas';

const now = () => new Date().toISOString();

function emptyDesign(productId: string): Design {
  return { id: uid('dis'), productId, items: [], createdAt: now(), updatedAt: now() };
}

interface Notice { id: number; text: string; tone: 'info' | 'warn' | 'ok' }

interface DesignState {
  screen: Screen;
  tab: PanelTab;
  design: Design;
  selectedItemId: string | null;
  activeZoneId: string | null;
  /** Incrementa cuando la cámara debe enfocar la zona activa. */
  focusRequest: number;
  showGuides: boolean;
  autoRotate: boolean;
  saved: SavedDesign[];
  notice: Notice | null;
  /** Código de pedido cuando se está viendo un diseño recibido por enlace (vista del taller). */
  sharedCode: string | null;
  openShared: (design: Design, code: string) => void;

  go: (s: Screen) => void;
  setTab: (t: PanelTab) => void;
  setActiveZone: (zoneId: string | null, focus?: boolean) => void;
  selectItem: (id: string | null) => void;
  addText: (zoneId?: string) => string | null;
  addDecoration: (decorationId: string, zoneId?: string) => string | null;
  updateItem: (id: string, patch: Partial<TextItem> | Partial<DecorationItem>) => void;
  moveItemToZone: (id: string, zoneId: string) => boolean;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  resetDesign: () => void;
  setShowGuides: (v: boolean) => void;
  setAutoRotate: (v: boolean) => void;
  saveDesign: (name: string, thumbnail?: string) => void;
  restoreDesign: (designId: string) => void;
  deleteSaved: (designId: string) => void;
  notify: (text: string, tone?: Notice['tone']) => void;
}

const defaultProductId = () => catalog.product().id;

export const useDesign = create<DesignState>()(
  persist(
    (set, get) => {
      const product = () => catalog.product();
      const touch = (items: DesignItem[]) => ({ design: { ...get().design, items, updatedAt: now() } });

      /** Busca una zona válida: la indicada, la activa o la primera con hueco. */
      const pickZone = (kind: DesignItem['kind'], preferred?: string | null, decorationId?: string) => {
        const p = product();
        const zones = catalog.zones();
        const order = [preferred, get().activeZoneId, ...zones.map((z) => z.id)].filter(Boolean) as string[];
        for (const id of order) {
          const z = zones.find((zz) => zz.id === id);
          if (z && canPlaceInZone(p, get().design, z, kind, { decorationId }).ok) return z;
        }
        return null;
      };

      return {
        screen: 'welcome',
        tab: 'texto',
        design: emptyDesign(defaultProductId()),
        selectedItemId: null,
        activeZoneId: null,
        focusRequest: 0,
        showGuides: true,
        autoRotate: false,
        saved: [],
        notice: null,
        sharedCode: null,
        openShared: (design, code) => set({ design, sharedCode: code || 'sin código', screen: 'preview', selectedItemId: null, activeZoneId: null, autoRotate: false }),

        go: (screen) => set({ screen, autoRotate: screen === 'welcome', selectedItemId: screen === 'customize' ? get().selectedItemId : null }),
        setTab: (tab) => set({ tab }),

        setActiveZone: (zoneId, focus = true) =>
          set((s) => ({ activeZoneId: zoneId, focusRequest: focus && zoneId ? s.focusRequest + 1 : s.focusRequest })),

        selectItem: (id) => {
          const item = get().design.items.find((i) => i.id === id);
          set({ selectedItemId: id, activeZoneId: item ? item.zoneId : get().activeZoneId });
        },

        addText: (zoneId) => {
          const z = pickZone('text', zoneId);
          if (!z) { get().notify('No hay zonas disponibles para más texto', 'warn'); return null; }
          const [minS, maxS] = sizeLimits(z);
          const item: TextItem = {
            id: uid('txt'), kind: 'text', zoneId: z.id, text: '',
            size: Math.min(maxS, Math.max(minS, z.maxSize.height * 0.8)),
            rotationDeg: 0, offset: { u: 0, v: 0 },
          };
          set((s) => ({ ...touch([...get().design.items, item]), selectedItemId: item.id, activeZoneId: z.id, focusRequest: s.focusRequest + 1, tab: 'texto' }));
          return item.id;
        },

        addDecoration: (decorationId, zoneId) => {
          const deco = getDecoration(decorationId);
          if (!deco) return null;
          // Se prefiere una zona vacía para no tapar el nombre ni otros diseños.
          const empty = (id: string) => !get().design.items.some((i) => i.zoneId === id);
          const active = get().activeZoneId;
          const emptyZone = zoneId ? null : [active, ...catalog.zones().map((zz) => zz.id)]
            .filter((id): id is string => !!id && empty(id))
            .map((id) => catalog.zone(id)!)
            .find((zz) => canPlaceInZone(catalog.product(), get().design, zz, 'decoration', { decorationId }).ok);
          const z = emptyZone ?? pickZone('decoration', zoneId, decorationId);
          if (!z) { get().notify('No hay una zona disponible para esta decoración', 'warn'); return null; }
          const [minS, maxS] = sizeLimits(z, deco);
          const item: DecorationItem = {
            id: uid('dec'), kind: 'decoration', zoneId: z.id, decorationId,
            size: Math.min(maxS, Math.max(minS, deco.defaultSize)),
            rotationDeg: 0, offset: { u: 0, v: 0 },
          };
          // Si ya hay elementos en la zona, se desplaza para no superponerse.
          const others = get().design.items.filter((i) => i.zoneId === z.id).length;
          if (others) item.offset.u = (others % 2 ? 1 : -1) * z.maxSize.width * 0.32;
          set((s) => ({ ...touch([...get().design.items, item]), selectedItemId: item.id, activeZoneId: z.id, focusRequest: s.focusRequest + 1 }));
          return item.id;
        },

        updateItem: (id, patch) => {
          const items = get().design.items.map((i) => {
            if (i.id !== id) return i;
            const next = { ...i, ...patch } as DesignItem;
            if (next.kind === 'text' && 'text' in patch) {
              const z = catalog.zone(next.zoneId);
              if (z) next.text = sanitizeText(next.text, z);
            }
            return next;
          });
          set(touch(items));
        },

        moveItemToZone: (id, zoneId) => {
          const p = product();
          const item = get().design.items.find((i) => i.id === id);
          const z = catalog.zone(zoneId);
          if (!item || !z) return false;
          const check = canPlaceInZone(p, get().design, z, item.kind, {
            decorationId: item.kind === 'decoration' ? item.decorationId : undefined,
            ignoreItemId: id,
          });
          if (!check.ok) { get().notify(check.reason ?? 'No permitido', 'warn'); return false; }
          const items = get().design.items.map((i) => {
            if (i.id !== id) return i;
            const moved = { ...i, zoneId, offset: { u: 0, v: 0 } } as DesignItem;
            if (moved.kind === 'text') moved.text = sanitizeText(moved.text, z);
            return moved;
          });
          set((s) => ({ ...touch(items), activeZoneId: zoneId, focusRequest: s.focusRequest + 1 }));
          return true;
        },

        removeItem: (id) => {
          set({ ...touch(get().design.items.filter((i) => i.id !== id)), selectedItemId: get().selectedItemId === id ? null : get().selectedItemId });
        },

        duplicateItem: (id) => {
          const src = get().design.items.find((i) => i.id === id);
          if (!src) return;
          const p = product();
          const z = catalog.zone(src.zoneId);
          if (!z || !canPlaceInZone(p, get().design, z, src.kind, { decorationId: src.kind === 'decoration' ? src.decorationId : undefined }).ok) {
            get().notify('La zona ya está completa', 'warn');
            return;
          }
          const copy = { ...src, id: uid(src.kind === 'text' ? 'txt' : 'dec'), offset: { u: -src.offset.u || z.maxSize.width * 0.3, v: src.offset.v } } as DesignItem;
          set({ ...touch([...get().design.items, copy]), selectedItemId: copy.id });
        },

        resetDesign: () => set({ design: emptyDesign(get().design.productId), selectedItemId: null, activeZoneId: null }),
        setShowGuides: (showGuides) => set({ showGuides }),
        setAutoRotate: (autoRotate) => set({ autoRotate }),

        saveDesign: (name, thumbnail) => {
          const d = get().design;
          const entry: SavedDesign = { design: { ...d, items: d.items.map((i) => ({ ...i })) }, name, savedAt: now(), thumbnail };
          const rest = get().saved.filter((s) => s.design.id !== d.id);
          set({ saved: [entry, ...rest].slice(0, appConfig.features.maxSavedDesigns) });
          get().notify('Diseño guardado en este dispositivo', 'ok');
        },

        restoreDesign: (designId) => {
          const s = get().saved.find((x) => x.design.id === designId);
          if (!s) { get().notify('No se pudo restaurar el diseño', 'warn'); return; }
          set({ design: { ...s.design, items: s.design.items.map((i) => ({ ...i })) }, selectedItemId: null, activeZoneId: null });
          get().notify('Diseño restaurado', 'ok');
        },

        deleteSaved: (designId) => set({ saved: get().saved.filter((s) => s.design.id !== designId) }),

        notify: (text, tone = 'info') => {
          const id = Date.now();
          set({ notice: { id, text, tone } });
          setTimeout(() => { if (get().notice?.id === id) set({ notice: null }); }, 2600);
        },
      };
    },
    {
      name: 'gorros3d:v2',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ design: s.design, saved: s.saved, showGuides: s.showGuides }),
      // Si el producto del borrador ya no existe en el catálogo, empezamos de nuevo.
      merge: (persisted, current) => {
        const p = persisted as Partial<DesignState> | undefined;
        const merged = { ...current, ...(p ?? {}) } as DesignState;
        if (!merged.design || merged.design.productId !== defaultProductId()) merged.design = emptyDesign(defaultProductId());
        return merged;
      },
    },
  ),
);

export const useCurrentProduct = () => catalog.product();
