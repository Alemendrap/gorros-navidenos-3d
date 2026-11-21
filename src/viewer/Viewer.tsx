import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, PerformanceMonitor, AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import { useCurrentProduct, useDesign } from '@/store/designStore';
import { HatModel } from '@/models/HatModel';
import { CustomizationLayer } from './CustomizationLayer';
import { CameraRig } from './CameraRig';
import { CaptureBridge } from './CaptureBridge';
import { appConfig } from '@/config';

function Studio() {
  // Iluminación de estudio generada en la propia escena (sin descargar HDRI de internet).
  return (
    <>
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#5a4436']} />
        <Lightformer form="rect" intensity={3.2} color="#fff4e2" position={[0, 4, 5]} scale={[8, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.2} color="#ffe9c4" position={[0, 0.6, 6]} scale={[10, 2.5, 1]} target={[0, 0.6, 0]} />
        <Lightformer form="rect" intensity={2} color="#ffe7c2" position={[-6, 2, 1]} scale={[3, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.6} color="#fff" position={[6, 1, -2]} scale={[3, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={4} color="#fff2d6" position={[0, 7, 0]} scale={4} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.8} color="#ffc98a" position={[0, -3, 3]} scale={[8, 1, 1]} target={[0, 0, 0]} />
        {/* Luces envolventes: el vinilo dorado brilla también en laterales y parte trasera */}
        <Lightformer form="rect" intensity={1.8} color="#fff0d6" position={[-6, 0.8, -4]} scale={[6, 3, 1]} target={[0, 0.5, 0]} />
        <Lightformer form="rect" intensity={1.8} color="#fff0d6" position={[6, 0.8, -4]} scale={[6, 3, 1]} target={[0, 0.5, 0]} />
        <Lightformer form="rect" intensity={1.6} color="#ffe9c4" position={[0, 0.6, -7]} scale={[10, 2.5, 1]} target={[0, 0.6, 0]} />
      </Environment>
      <hemisphereLight args={['#fff6e8', '#3a1a12', 0.55]} />
      <directionalLight position={[3, 6, 5]} intensity={1.6} color="#fff1dc" />
      <directionalLight position={[-4, 3, -3]} intensity={0.7} color="#ffd8a8" />
    </>
  );
}

export function Viewer() {
  const product = useCurrentProduct();
  const screen = useDesign((s) => s.screen);
  const showGuides = useDesign((s) => s.showGuides);
  const selectItem = useDesign((s) => s.selectItem);
  const [dpr, setDpr] = useState<number>(appConfig.viewer.maxDpr);

  return (
    <Canvas
      dpr={[1, dpr]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 32, near: 0.1, far: 100, position: product.camera.position }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearColor(0x000000, 0);
      }}
      onPointerMissed={(e) => { if (e.type === 'click' && screen === 'customize') selectItem(null); }}
      style={{ touchAction: 'none' }}
      data-testid="viewer-canvas"
    >
      <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(1, d - 0.25))} onIncline={() => setDpr((d) => Math.min(appConfig.viewer.maxDpr, d + 0.25))} />
      <AdaptiveDpr pixelated={false} />
      <Studio />
      <Suspense fallback={null}>
        <group>
          <HatModel key={product.model.type === 'gltf' ? product.model.url : 'procedural'} product={product} />
          <CustomizationLayer showGuides={screen === 'customize' && showGuides} />
          {appConfig.viewer.shadows && (
            <ContactShadows position={[0, -0.03, 0]} opacity={0.4} scale={4.2} blur={3.2} far={1.4} resolution={256} frames={1} key={product.id} color="#3b0a12" />
          )}
        </group>
      </Suspense>
      <CameraRig product={product} />
      <CaptureBridge />
    </Canvas>
  );
}
