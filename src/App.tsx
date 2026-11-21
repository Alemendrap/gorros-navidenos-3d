import { useEffect } from 'react';
import { Viewer } from '@/viewer/Viewer';
import { cameraActions } from '@/viewer/sceneBridge';
import { readSharedDesignFromUrl } from '@/lib/designLink';
import { useDesign } from '@/store/designStore';
import { preloadFonts } from '@/engine/fontLoader';
import { useAppHeight } from '@/lib/useAppHeight';
import { Toast } from '@/ui/components/Toast';
import { WelcomeOverlay } from '@/ui/screens/WelcomeScreen';
import { CustomizeOverlay, CustomizePanel } from '@/ui/screens/CustomizeScreen';
import { PreviewOverlay, PreviewPanel } from '@/ui/screens/PreviewScreen';
import { ConfirmScreen } from '@/ui/screens/ConfirmScreen';

export default function App() {
  useAppHeight();
  const screen = useDesign((s) => s.screen);
  useEffect(() => {
    preloadFonts();
    // Enlace de diseño recibido por el taller (#d=...): se abre directamente en la vista de producción.
    const shared = readSharedDesignFromUrl();
    if (shared) useDesign.getState().openShared(shared.design, shared.code);
  }, []);
  // La revisión final siempre empieza mirando el gorro de frente.
  useEffect(() => { if (screen === 'preview') cameraActions.reset(); }, [screen]);

  // Botón "atrás" del navegador/teléfono navega entre pantallas.
  useEffect(() => {
    const order = ['welcome', 'customize', 'preview', 'confirm'] as const;
    if (useDesign.getState().sharedCode) return; // en la vista del taller no se toca el enlace
    if (location.hash !== `#${screen}`) history.pushState(null, '', `#${screen}`);
    const onPop = () => {
      const s = location.hash.slice(1) as (typeof order)[number];
      if (order.includes(s) && s !== useDesign.getState().screen) useDesign.getState().go(s);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [screen]);

  return (
    <div className="app-root flex flex-col lg:flex-row">
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <div className={`absolute inset-0 bg-studio transition-opacity duration-700 ${screen === 'welcome' ? 'opacity-0' : 'opacity-100'}`} />
        <div className={`absolute inset-0 bg-night transition-opacity duration-700 ${screen === 'welcome' ? 'opacity-100' : 'opacity-0'}`} />
        <div className="absolute inset-0">
          <Viewer />
        </div>
        {screen === 'welcome' && <WelcomeOverlay />}
        {screen === 'customize' && <CustomizeOverlay />}
        {screen === 'preview' && <PreviewOverlay />}
      </main>
      {screen === 'customize' && <CustomizePanel />}
      {screen === 'preview' && <PreviewPanel />}
      {screen === 'confirm' && <ConfirmScreen />}
      <Toast />
    </div>
  );
}
