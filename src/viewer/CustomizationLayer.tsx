/**
 * Capa de personalización: dibuja textos, decoraciones e indicadores de zona
 * sobre la superficie registrada del modelo.
 */
import { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { DecorationItem, TextItem, ZoneConfig } from '@/types';
import { catalog } from '@/config';
import { getDecoration } from '@/config/decorations';
import { useDesign } from '@/store/designStore';
import { useSurfaceRegistry, meshesFor } from '@/engine/surfaceRegistry';
import { useFontStore, ensureFont } from '@/engine/fontLoader';
import { itemFrame, zoneFrame, type SurfaceFrame } from '@/engine/surface';
import { buildWrappedDecal } from '@/engine/wrappedDecal';
import { resolvePlacement } from '@/engine/constraints';
import { fontCss, loadImage, rasterizeImage, rasterizeText, rasterizeZoneIndicator, type Raster } from '@/engine/rasterize';
import { assetUrl } from '@/lib/assets';

/** Ignora "clics" que en realidad eran un arrastre para girar la cámara. */
const isTap = (e: ThreeEvent<MouseEvent>) => e.delta < 8;

function useZoneFrame(zone: ZoneConfig | undefined) {
  const version = useSurfaceRegistry((s) => s.version);
  return useMemo(() => {
    if (!zone) return null;
    const meshes = meshesFor(zone.surfaces);
    return meshes.length ? { frame: zoneFrame(zone, meshes), meshes } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone, version]);
}

function disposeRaster(r: Raster | null) {
  r?.mask.dispose(); r?.normal.dispose(); r?.color?.dispose();
}

/** Material de vinilo dorado (único acabado). */
function vinylMaterial(raster: Raster) {
  const f = catalog.finish();
  return new THREE.MeshStandardMaterial({
    color: f.color,
    metalness: f.metalness,
    roughness: f.roughness,
    alphaMap: raster.mask,
    normalMap: raster.normal,
    normalScale: new THREE.Vector2(0.9 * f.edgeRelief, 0.9 * f.edgeRelief),
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    envMapIntensity: 1.6,
  });
}

/** Malla de calcomanía envolvente genérica. */
function WrappedDecalMesh({
  zone, zf, item, aspect, material, onTap, renderOrder = 2,
}: {
  zone: ZoneConfig;
  zf: { frame: SurfaceFrame | null; meshes: THREE.Mesh[] };
  item: TextItem | DecorationItem;
  aspect: number;
  material: THREE.Material;
  onTap?: () => void;
  renderOrder?: number;
}) {
  const pl = resolvePlacement(item, zone, aspect);
  const geometry = useMemo(() => {
    if (!zf.frame) return null;
    const f = itemFrame(zf.meshes, zf.frame, { u: pl.u, v: pl.v }, pl.rotationDeg);
    return buildWrappedDecal({ meshes: zf.meshes, frame: f, width: pl.width, height: pl.height });
  }, [zf, pl.u, pl.v, pl.rotationDeg, pl.width, pl.height]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  if (!geometry) return null;
  return (
    <mesh
      geometry={geometry}
      material={material}
      renderOrder={renderOrder}
      onClick={(e) => { if (onTap && isTap(e)) { e.stopPropagation(); onTap(); } }}
    />
  );
}

function TextDecal({ item }: { item: TextItem }) {
  const zone = catalog.zone(item.zoneId);
  const zf = useZoneFrame(zone);
  const fontsVersion = useFontStore((s) => s.version);
  const select = useDesign((s) => s.selectItem);
  const font = catalog.font();
  const finish = catalog.finish();

  useEffect(() => { if (item.text) ensureFont(fontCss(font, 64), item.text); }, [font, item.text]);

  const raster = useMemo(
    () => (item.text.trim() ? rasterizeText(item.text.trim(), font, finish.edgeRelief) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.text, font.id, finish.edgeRelief, fontsVersion],
  );
  useEffect(() => () => disposeRaster(raster), [raster]);
  const material = useMemo(() => (raster ? vinylMaterial(raster) : null), [raster]);

  if (!zone || !zf || !raster || !material) return null;
  return <WrappedDecalMesh zone={zone} zf={zf} item={item} aspect={raster.aspect} material={material} onTap={() => select(item.id)} />;
}

function ImageDecoration({ item }: { item: DecorationItem }) {
  const deco = getDecoration(item.decorationId)!;
  const zone = catalog.zone(item.zoneId);
  const zf = useZoneFrame(zone);
  const select = useDesign((s) => s.selectItem);
  const [raster, setRaster] = useState<Raster | null>(null);
  const src = deco.source.type === 'image' ? deco.source : null;

  useEffect(() => {
    if (!src) return;
    let alive = true;
    let made: Raster | null = null;
    loadImage(assetUrl(src.src))
      .then((img) => { if (alive) { made = rasterizeImage(img, 1); setRaster(made); } })
      .catch((e) => console.warn(e));
    return () => { alive = false; disposeRaster(made); };
  }, [src]);

  const material = useMemo(() => {
    if (!raster) return null;
    return vinylMaterial(raster); // todas las decoraciones en vinilo dorado
  }, [raster]);

  if (!zone || !zf || !raster || !material) return null;
  return <WrappedDecalMesh zone={zone} zf={zf} item={item} aspect={raster.aspect} material={material} onTap={() => select(item.id)} />;
}

function GltfDecorationModel({ src }: { src: string }) {
  const { scene } = useGLTF(assetUrl(src));
  const obj = useMemo(() => {
    const c = scene.clone(true);
    // Normaliza: altura 1, centrado en X/Y y apoyado en Z=0.
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const k = 1 / (size.y || 1);
    c.scale.setScalar(k);
    const center = box.getCenter(new THREE.Vector3());
    c.position.set(-center.x * k, -center.y * k, -box.min.z * k);
    return c;
  }, [scene]);
  return <primitive object={obj} />;
}

function ModelDecoration({ item }: { item: DecorationItem }) {
  const deco = getDecoration(item.decorationId)!;
  const zone = catalog.zone(item.zoneId);
  const zf = useZoneFrame(zone);
  const select = useDesign((s) => s.selectItem);
  const pl = zone ? resolvePlacement(item, zone, deco.aspect) : null;
  const transform = useMemo(() => {
    if (!zf?.frame || !pl) return null;
    const f = itemFrame(zf.meshes, zf.frame, { u: pl.u, v: pl.v }, pl.rotationDeg);
    const m = new THREE.Matrix4().makeBasis(f.tangent, f.bitangent, f.normal);
    const q = new THREE.Quaternion().setFromRotationMatrix(m);
    return { position: f.point.clone().addScaledVector(f.normal, -0.01), quaternion: q };
  }, [zf, pl?.u, pl?.v, pl?.rotationDeg]);
  if (!transform || !pl) return null;
  const src = deco.source;
  return (
    <group
      position={transform.position}
      quaternion={transform.quaternion}
      scale={pl.height}
      onClick={(e) => { if (isTap(e)) { e.stopPropagation(); select(item.id); } }}
    >
      {src.type === 'model' && (
        <Suspense fallback={null}>
          <GltfDecorationModel src={src.src} />
        </Suspense>
      )}
    </group>
  );
}

function ZoneIndicator({ zone, active }: { zone: ZoneConfig; active: boolean }) {
  const zf = useZoneFrame(zone);
  const setActiveZone = useDesign((s) => s.setActiveZone);
  const moveItemToZone = useDesign((s) => s.moveItemToZone);
  const selectedId = useDesign((s) => s.selectedItemId);
  const items = useDesign((s) => s.design.items);
  const notify = useDesign((s) => s.notify);
  const empty = !items.some((i) => i.zoneId === zone.id);
  // La etiqueta solo se muestra cuando la zona está vacía, para no tapar el diseño.
  const texture = useMemo(() => rasterizeZoneIndicator(empty ? zone.name : '', zone.maxSize.width / zone.maxSize.height), [zone, empty]);
  const geometry = useMemo(() => {
    if (!zf?.frame) return null;
    return buildWrappedDecal({ meshes: zf.meshes, frame: zf.frame, width: zone.maxSize.width, height: zone.maxSize.height, lift: 0.0015 });
  }, [zf, zone]);
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false }),
    [texture],
  );
  useEffect(() => {
    material.color.set(active ? '#E2B140' : '#B8954A');
    material.opacity = active ? 1 : 0.75;
  }, [active, material]);
  useEffect(() => () => { geometry?.dispose(); material.dispose(); texture.dispose(); }, [geometry, material, texture]);
  if (!geometry) return null;
  return (
    <mesh
      geometry={geometry}
      material={material}
      renderOrder={1}
      onClick={(e) => {
        if (!isTap(e)) return;
        e.stopPropagation();
        const sel = items.find((i) => i.id === selectedId);
        if (sel && sel.zoneId !== zone.id) {
          if (moveItemToZone(sel.id, zone.id)) notify(`Movido a «${zone.name}»`, 'ok');
        } else {
          setActiveZone(zone.id);
        }
      }}
    />
  );
}

export function CustomizationLayer({ showGuides }: { showGuides: boolean }) {
  const items = useDesign((s) => s.design.items);
  const activeZoneId = useDesign((s) => s.activeZoneId);
  const decorationsOn = catalog.decorationsEnabled();
  return (
    <group name="personalizacion">
      {items.map((item) => {
        if (item.kind === 'text') return <TextDecal key={item.id} item={item} />;
        if (!decorationsOn) return null;
        const deco = getDecoration(item.decorationId);
        if (!deco) return null;
        return deco.source.type === 'image'
          ? <ImageDecoration key={item.id} item={item} />
          : <ModelDecoration key={item.id} item={item} />;
      })}
      {showGuides && catalog.zones().map((z) => <ZoneIndicator key={z.id} zone={z} active={z.id === activeZoneId} />)}
    </group>
  );
}
