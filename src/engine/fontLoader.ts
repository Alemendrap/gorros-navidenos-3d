/** Carga explícita de tipografías antes de rasterizar (evita textos con fuente de respaldo). */
import { create } from 'zustand';
import { textFont } from '@/config/fonts';
import { fontCss } from './rasterize';

export const useFontStore = create<{ version: number; ready: boolean }>(() => ({ version: 0, ready: false }));

let started = false;
export function preloadFonts() {
  if (started || typeof document === 'undefined' || !document.fonts) {
    useFontStore.setState({ ready: true });
    return;
  }
  started = true;
  const sample = 'AÁÉÍÓÚÑabcñáéíóú0123456789';
  Promise.allSettled([document.fonts.load(fontCss(textFont, 64), sample)])
    .then(() => document.fonts.ready)
    .finally(() => useFontStore.setState((s) => ({ version: s.version + 1, ready: true })));
}

/** Asegura que una fuente concreta está cargada para un texto (caracteres especiales). */
export function ensureFont(css: string, text: string) {
  if (!document.fonts) return Promise.resolve();
  if (document.fonts.check(css, text)) return Promise.resolve();
  return document.fonts.load(css, text).then(() => useFontStore.setState((s) => ({ version: s.version + 1 })));
}
