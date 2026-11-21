import { Component, Suspense, type ReactNode } from 'react';
import type { ProductConfig } from '@/types';
import { ProceduralHat } from './procedural/ProceduralHat';
import { GltfHat } from './GltfHat';

/** Si un GLB no se puede cargar, se muestra el gorro provisional en su lugar (la app nunca se cae). */
class ModelErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: unknown) { console.warn('[HatModel] No se pudo cargar el modelo GLB; se usa el provisional.', e); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

const FALLBACK_COLORS = { body: '#B3122E', brim: '#F7F3EA', pompom: '#FBF8F1' };

/** Elige el modelo del producto: procedural (provisional) o GLB/GLTF real. */
export function HatModel({ product }: { product: ProductConfig }) {
  const m = product.model;
  if (m.type === 'gltf') {
    return (
      <ModelErrorBoundary fallback={<ProceduralHat config={{ type: 'procedural', variant: 'classic', colors: FALLBACK_COLORS }} />}>
        <Suspense fallback={null}>
          <GltfHat config={m} />
        </Suspense>
      </ModelErrorBoundary>
    );
  }
  return <ProceduralHat config={m} />;
}
