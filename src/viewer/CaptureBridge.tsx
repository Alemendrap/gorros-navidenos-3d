import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useSceneBridge } from './sceneBridge';

/** Expone una función para capturar el render actual como PNG (con fondo transparente). */
export function CaptureBridge() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    useSceneBridge.getState().setCapture(({ scale = 1.6 } = {}) => {
      const prev = gl.getPixelRatio();
      const target = Math.min(3, prev * scale);
      gl.setPixelRatio(target);
      gl.render(scene, camera);
      const url = gl.domElement.toDataURL('image/png');
      gl.setPixelRatio(prev);
      gl.render(scene, camera);
      return url;
    });
    return () => useSceneBridge.getState().setCapture(null);
  }, [gl, scene, camera]);
  return null;
}
