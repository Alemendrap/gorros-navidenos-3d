import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import CameraControlsImpl from 'camera-controls';
import * as THREE from 'three';
import type { ProductConfig } from '@/types';
import { useDesign } from '@/store/designStore';
import { useSceneBridge, cameraActions } from './sceneBridge';
import { appConfig, catalog } from '@/config';

const { ACTION } = CameraControlsImpl;

/** Distancia necesaria para que el gorro quepa en pantalla según la proporción del visor. */
function fitDistance(fovDeg: number, aspect: number) {
  const t = Math.tan(THREE.MathUtils.degToRad(fovDeg / 2));
  const halfH = 1.85, halfW = 1.8;
  return Math.max(halfH / t, halfW / (t * aspect)) + 1.2;
}

export function CameraRig({ product }: { product: ProductConfig }) {
  const ref = useRef<CameraControlsImpl>(null);
  const { size, camera } = useThree();
  const autoRotate = useDesign((s) => s.autoRotate);
  const setAutoRotate = useDesign((s) => s.setAutoRotate);
  const focusRequest = useDesign((s) => s.focusRequest);
  const interacting = useRef(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    useSceneBridge.getState().setControls(c);
    const [px, py, pz] = product.camera.position;
    const [tx, ty, tz] = product.camera.target;
    c.setLookAt(px, py, pz, tx, ty, tz, false);
    // Táctil: 1 dedo gira, 2 dedos zoom. Sin desplazamiento lateral para que el gorro siga centrado.
    c.touches.one = ACTION.TOUCH_ROTATE;
    c.touches.two = ACTION.TOUCH_DOLLY;
    c.touches.three = ACTION.NONE;
    c.mouseButtons.right = ACTION.NONE;
    c.mouseButtons.middle = ACTION.DOLLY;
    c.mouseButtons.wheel = ACTION.DOLLY;
    const start = () => { interacting.current = true; if (useDesign.getState().autoRotate && useDesign.getState().screen === 'customize') setAutoRotate(false); };
    const end = () => { interacting.current = false; };
    c.addEventListener('controlstart', start);
    c.addEventListener('controlend', end);
    return () => {
      c.removeEventListener('controlstart', start);
      c.removeEventListener('controlend', end);
      useSceneBridge.getState().setControls(null);
    };
  }, [product, setAutoRotate]);

  // Encaje según tamaño del visor (móvil vertical, tableta, escritorio).
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const fov = (camera as THREE.PerspectiveCamera).fov;
    const d = fitDistance(fov, size.width / Math.max(1, size.height));
    useSceneBridge.getState().setFitDistance(d);
    c.minDistance = d * 0.45;
    c.maxDistance = d * 1.45;
    c.dollyTo(d, true);
  }, [size.width, size.height, camera]);

  // Enfocar la zona activa cuando se solicita.
  useEffect(() => {
    if (!focusRequest) return;
    const { activeZoneId } = useDesign.getState();
    const z = activeZoneId ? catalog.zone(activeZoneId) : null;
    if (z) cameraActions.focusAzimuth(z.anchor.azimuthDeg, z.anchor.height > 0.6 ? 1.28 : 1.42);
  }, [focusRequest]);

  useFrame((_, delta) => {
    const c = ref.current;
    if (c && autoRotate && !interacting.current) c.rotate(delta * appConfig.viewer.autoRotateSpeed, 0, false);
  });

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minPolarAngle={0.45}
      maxPolarAngle={1.78}
      smoothTime={0.28}
      draggingSmoothTime={0.08}
      azimuthRotateSpeed={0.9}
      polarRotateSpeed={0.7}
      dollySpeed={0.6}
    />
  );
}
