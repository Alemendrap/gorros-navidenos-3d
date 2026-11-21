import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/index.css';
import '@/config/fonts';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Herramientas de depuración: abre la app con ?debug para acceder a window.__gorros desde la consola.
if (new URLSearchParams(location.search).has('debug')) {
  Promise.all([import('@/store/designStore'), import('@/viewer/sceneBridge')]).then(([s, b]) => {
    (window as unknown as Record<string, unknown>).__gorros = { useDesign: s.useDesign, cameraActions: b.cameraActions, bridge: b.useSceneBridge };
  });
}
