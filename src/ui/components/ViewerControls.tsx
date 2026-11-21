import { cameraActions } from '@/viewer/sceneBridge';
import { useDesign } from '@/store/designStore';
import { Icon } from './Icon';

/** Controles flotantes del visor: zoom, vista inicial, giro automático y guías. */
export function ViewerControls({ guides = true }: { guides?: boolean }) {
  const autoRotate = useDesign((s) => s.autoRotate);
  const setAutoRotate = useDesign((s) => s.setAutoRotate);
  const showGuides = useDesign((s) => s.showGuides);
  const setShowGuides = useDesign((s) => s.setShowGuides);
  return (
    <div className="pointer-events-auto flex flex-col gap-2.5">
      <button className="icon-btn" onClick={() => cameraActions.zoom(1.1)} aria-label="Acercar" title="Acercar"><Icon name="plus" /></button>
      <button className="icon-btn" onClick={() => cameraActions.zoom(-1.1)} aria-label="Alejar" title="Alejar"><Icon name="minus" /></button>
      <button className="icon-btn" onClick={() => cameraActions.reset()} aria-label="Vista inicial" title="Vista inicial"><Icon name="reset" /></button>
      <button
        className={`icon-btn ${autoRotate ? '!bg-oro text-white' : ''}`}
        onClick={() => setAutoRotate(!autoRotate)}
        aria-pressed={autoRotate}
        aria-label="Giro automático"
        title="Giro automático"
      >
        <Icon name="rotate" />
      </button>
      {guides && (
        <button
          className={`icon-btn ${showGuides ? '!bg-pino text-white' : ''}`}
          onClick={() => setShowGuides(!showGuides)}
          aria-pressed={showGuides}
          aria-label="Mostrar zonas"
          title="Mostrar zonas"
        >
          <Icon name="grid" />
        </button>
      )}
    </div>
  );
}
