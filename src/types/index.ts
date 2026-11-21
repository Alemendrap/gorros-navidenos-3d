/**
 * Tipos centrales del personalizador.
 * Todo lo que es "catálogo" (productos, zonas, fuentes, acabados, decoraciones)
 * se describe con estos tipos y vive en src/config. El núcleo nunca contiene
 * valores de catálogo fijos.
 */

/** Rol de una superficie del modelo 3D sobre la que se puede proyectar. */
export type SurfaceRole = 'brim' | 'body' | 'pompom' | (string & {});

export type ItemKind = 'text' | 'decoration';

export type Vec3 = [number, number, number];

// ---------------------------------------------------------------- Zonas

export interface ZoneConstraints {
  /** Tamaño mínimo/máximo (altura en unidades del modelo) de un elemento. */
  minSize: number;
  maxSize: number;
  /** Se permite girar el elemento dentro de la zona. */
  allowRotation: boolean;
  /** Giro máximo permitido en grados (±). */
  maxRotationDeg: number;
  /** Se permite desplazar el elemento dentro de la zona. */
  allowOffset: boolean;
}

export interface ZoneConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  /** Superficies (roles de malla) sobre las que se proyecta esta zona. */
  surfaces: SurfaceRole[];
  /**
   * Posición de la zona sobre el gorro, en coordenadas "de catálogo":
   * azimut alrededor del eje vertical (0° = frente, 90° = izquierda de quien lo usa,
   * 180° = atrás) y altura en unidades del modelo. El motor lanza un rayo hacia el
   * eje para encontrar el punto exacto de la superficie (se adapta a cualquier modelo).
   */
  anchor: { azimuthDeg: number; height: number };
  /** Opcional: rayo explícito (origen + dirección) para modelos GLB con formas raras. */
  ray?: { origin: Vec3; direction: Vec3 };
  /** Orientación de la zona sobre la superficie (giro en el plano tangente, grados). */
  rotationDeg: number;
  /** Dimensiones máximas de la zona (ancho medido a lo largo de la superficie). */
  maxSize: { width: number; height: number };
  /** Tipos de elemento permitidos. */
  allowedKinds: ItemKind[];
  /** Categorías de decoración permitidas (vacío o ausente = todas). */
  allowedDecorationCategories?: string[];
  /** Número máximo de elementos simultáneos en la zona. */
  maxItems: number;
  /** Límite de caracteres para textos en esta zona. */
  maxChars: number;
  constraints: ZoneConstraints;
}

// ---------------------------------------------------------------- Productos

export interface ProceduralModelConfig {
  type: 'procedural';
  /** Variante del generador procedural (src/models/procedural). */
  variant: 'classic';
  colors: { body: string; brim: string; pompom: string };
}

export interface GltfModelConfig {
  type: 'gltf';
  /** Ruta al archivo .glb/.gltf (p. ej. /models/gorro-real.glb). */
  url: string;
  /**
   * Asigna nombres de malla del GLB a roles de superficie.
   * Ej.: { "Borde": "brim", "Cuerpo": "body", "Pompon": "pompom" }
   */
  surfaceMap: Record<string, SurfaceRole>;
  scale?: number;
  position?: Vec3;
  rotationDeg?: Vec3;
}

export type ModelConfig = ProceduralModelConfig | GltfModelConfig;

export interface ProductConfig {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  model: ModelConfig;
  zones: ZoneConfig[];
  /** Encaje de cámara para el gorro. */
  camera: { position: Vec3; target: Vec3 };
}

// ---------------------------------------------------------------- Fuentes y acabados

export interface FontConfig {
  id: string;
  label: string;
  /** font-family CSS. */
  family: string;
  weight: number;
  /** Escala para compensar fuentes visualmente pequeñas o grandes. */
  sizeAdjust?: number;
}

export interface FinishConfig {
  id: string;
  label: string;
  /** Color base del vinilo. */
  color: string;
  /** Muestra para la interfaz. */
  swatch: string;
  metalness: number;
  roughness: number;
  /** Intensidad del relieve del borde del vinilo (0 = plano). */
  edgeRelief: number;
}

// ---------------------------------------------------------------- Decoraciones

export type DecorationSource =
  /** Imagen PNG transparente o SVG: su silueta se aplica en vinilo dorado sobre la tela. */
  | { type: 'image'; src: string }
  /** Modelo 3D GLB/GLTF colocado sobre la superficie (preparado para el futuro). */
  | { type: 'model'; src: string };

export interface DecorationConfig {
  id: string;
  name: string;
  category: string;
  /** Imagen para el catálogo (si falta se usa la fuente). */
  thumbnail?: string;
  source: DecorationSource;
  /** Relación ancho/alto de la imagen. */
  aspect: number;
  defaultSize: number;
  /** Zonas permitidas: '*' = todas las zonas que admitan decoraciones. */
  allowedZones: string[] | '*';
  constraints?: { minSize?: number; maxSize?: number; allowRotation?: boolean };
  enabled: boolean;
}

export interface DecorationCategory {
  id: string;
  label: string;
}

// ---------------------------------------------------------------- Diseño (estado del cliente)

interface DesignItemBase {
  id: string;
  kind: ItemKind;
  zoneId: string;
  /** Desplazamiento dentro de la zona (unidades del modelo, a lo largo de la superficie). */
  offset: { u: number; v: number };
  rotationDeg: number;
  /** Altura solicitada (en textos: altura de la línea). */
  size: number;
}

export interface TextItem extends DesignItemBase {
  kind: 'text';
  text: string;
}

export interface DecorationItem extends DesignItemBase {
  kind: 'decoration';
  decorationId: string;
}

export type DesignItem = TextItem | DecorationItem;

export interface Design {
  id: string;
  productId: string;
  items: DesignItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedDesign {
  design: Design;
  name: string;
  savedAt: string;
  /** Miniatura JPEG (data URL) pequeña. */
  thumbnail?: string;
}

// ---------------------------------------------------------------- Pedido

export type OrderStatus = 'borrador' | 'confirmado' | 'enviado' | 'en_produccion' | 'entregado' | 'cancelado';

export interface OrderLine {
  label: string;
  detail: string;
  /** Cantidad cobrada (letras de un texto o 1 diseño). */
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Pricing {
  currency: string;
  basePrice: number;
  pricePerLetter: number;
  pricePerDecoration: number;
  /** Letras cobradas (sin espacios) en todos los textos. */
  letterCount: number;
  /** Diseños (decoraciones) aplicados. */
  decorationCount: number;
  lines: OrderLine[];
  total: number;
}

export interface Order {
  id: string;
  code: string;
  createdAt: string;
  status: OrderStatus;
  product: { id: string; name: string; modelRef: string; finish: string };
  texts: Array<{
    text: string;
    font: string;
    zone: string;
    placement: ResolvedPlacementSnapshot;
  }>;
  decorations: Array<{
    id: string;
    name: string;
    zone: string;
    placement: ResolvedPlacementSnapshot;
  }>;
  pricing: Pricing;
  design: Design;
  previewImage?: string;
}

export interface ResolvedPlacementSnapshot {
  zoneId: string;
  offset: { u: number; v: number };
  rotationDeg: number;
  width: number;
  height: number;
  fittedToZone: boolean;
}
