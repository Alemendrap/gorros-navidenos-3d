/**
 * ACTUALIZACIÓN AUTOMÁTICA
 * GitHub Pages permite a los navegadores guardar la página hasta 10 minutos, y una pestaña
 * abierta no se recarga sola. Al abrir la app (y al volver a ella) se consulta version.json
 * sin caché; si hay una versión más nueva, la página se recarga con la última.
 */
declare const __BUILD_ID__: string;

const FLAG = 'gorros3d:recarga-version';

export async function checkForUpdate() {
  if (import.meta.env.DEV) return;
  try {
    const url = new URL('version.json', document.baseURI);
    url.searchParams.set('t', String(Date.now()));
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return;
    const { build } = (await res.json()) as { build: string };
    if (!build || build === __BUILD_ID__) return;
    // Evita bucles: como máximo una recarga por versión nueva.
    if (sessionStorage.getItem(FLAG) === build) return;
    sessionStorage.setItem(FLAG, build);
    const next = new URL(location.href);
    next.searchParams.set('v', build.replace(/\D/g, '').slice(0, 14));
    location.replace(next.toString());
  } catch {
    /* sin conexión o sin almacenamiento: se sigue con la versión actual */
  }
}

export function startAutoUpdate() {
  checkForUpdate();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
}
