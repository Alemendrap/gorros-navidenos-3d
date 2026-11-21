import { useEffect } from 'react';

/**
 * Ajusta la altura de la app al área realmente visible (visualViewport).
 * Así, al abrir el teclado en iPhone/Android el gorro sigue visible encima del panel.
 */
export function useAppHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement;
    let raf = 0;
    const apply = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = vv ? vv.height : window.innerHeight;
        root.style.setProperty('--app-h', `${Math.round(h)}px`);
        root.style.setProperty('--app-top', `${Math.round(vv ? vv.offsetTop : 0)}px`);
      });
    };
    apply();
    vv?.addEventListener('resize', apply);
    vv?.addEventListener('scroll', apply);
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    return () => {
      vv?.removeEventListener('resize', apply);
      vv?.removeEventListener('scroll', apply);
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
    };
  }, []);
}
