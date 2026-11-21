/**
 * Puente entre la interfaz (fuera del Canvas) y la escena 3D:
 * controles de cámara y captura de imagen.
 */
import { create } from 'zustand';
import type CameraControlsImpl from 'camera-controls';

interface SceneBridge {
  controls: CameraControlsImpl | null;
  capture: ((opts?: { scale?: number }) => string) | null;
  fitDistance: number;
  setControls: (c: CameraControlsImpl | null) => void;
  setCapture: (fn: SceneBridge['capture']) => void;
  setFitDistance: (d: number) => void;
}

export const useSceneBridge = create<SceneBridge>((set) => ({
  controls: null,
  capture: null,
  fitDistance: 6.4,
  setControls: (controls) => set({ controls }),
  setCapture: (capture) => set({ capture }),
  setFitDistance: (fitDistance) => set({ fitDistance }),
}));

export const cameraActions = {
  zoom(step: number) {
    const c = useSceneBridge.getState().controls;
    if (c) c.dolly(step, true);
  },
  reset() {
    const { controls, fitDistance } = useSceneBridge.getState();
    if (!controls) return;
    // Vuelve al frente por el camino más corto (la rotación automática acumula vueltas).
    const twoPi = Math.PI * 2;
    const front = Math.round(controls.azimuthAngle / twoPi) * twoPi;
    controls.rotateTo(front, 1.32, true);
    controls.dollyTo(fitDistance, true);
  },
  focusAzimuth(azimuthDeg: number, polar = 1.36, distance?: number) {
    const { controls, fitDistance } = useSceneBridge.getState();
    if (!controls) return;
    const cur = controls.azimuthAngle;
    const want = (azimuthDeg * Math.PI) / 180;
    let delta = (want - cur) % (Math.PI * 2);
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    controls.rotateTo(cur + delta, polar, true);
    controls.dollyTo(distance ?? fitDistance * 0.86, true);
  },
};
