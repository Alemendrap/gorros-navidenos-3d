# Taller de Gorros · Personalizador 3D

Aplicación web (React + TypeScript + Vite + Three.js / React Three Fiber) para que los clientes
de la villa navideña diseñen su gorro en 3D: lo giran 360°, hacen zoom, escriben su nombre en
vinilo dorado, añaden decoraciones, guardan el diseño y confirman el pedido.

---

## 1. Instalar y ejecutar

Requisitos: **Node.js 18 o superior** (recomendado 20/22).

```bash
npm install        # instala dependencias
npm run dev        # servidor local → http://localhost:5173
```

Para probar en el celular dentro de la misma red Wi‑Fi: `npm run dev` muestra también una
dirección `http://192.168.x.x:5173`; ábrela en el teléfono.

```bash
npm run build      # compila a /dist (verifica tipos TypeScript)
npm run preview    # sirve /dist en http://localhost:4173
```

## 2. Publicar en internet

La carpeta `dist/` es un sitio estático; funciona en cualquier hosting (usa rutas relativas).

- **Netlify:** arrastra la carpeta `dist` a https://app.netlify.com/drop, o conecta el repositorio
  con *Build command* `npm run build` y *Publish directory* `dist`.
- **Vercel:** importa el repositorio; Vercel detecta Vite automáticamente.
- **GitHub Pages / Cloudflare Pages / hosting propio:** sube el contenido de `dist/`.

Usa siempre **HTTPS** (necesario para compartir imágenes desde el móvil).

## 3. Estructura

```
src/
  config/            ← CATÁLOGO EDITABLE (no hace falta tocar nada más para crecer)
    app.ts             nombre del negocio, WhatsApp, interruptores (decoraciones on/off)
    products.ts        el gorro y su modelo 3D
    zones.ts           zonas de personalización (slots)
    fonts.ts           tipografía única (provisional)
    finishes.ts        acabado único: vinilo dorado
    decorations.ts     catálogo de diseños (todos en vinilo dorado)
  types/             tipos de datos (producto, zona, diseño, pedido)
  models/            modelos 3D
    procedural/        gorro provisional generado por código (forma orgánica, punta doblada)
    GltfHat.tsx        carga de gorros reales en GLB/GLTF
  engine/            MOTOR DE PERSONALIZACIÓN
    surface.ts         rayos sobre la malla + "caminar" sobre la superficie
    wrappedDecal.ts    vinilo envolvente que se adhiere a la curvatura
    constraints.ts     reglas: tamaños, giros, límites de zona, capacidad
    rasterize.ts       texto/imagen → texturas (máscara + relieve del borde del vinilo)
    surfaceRegistry.ts registro de superficies del modelo cargado
  viewer/            visor 3D (Canvas, cámara, luces, capas, captura)
  store/             estado del personalizador (Zustand + guardado local)
  export/            imagen final del diseño
  orders/            estructura de pedido, precios, repositorio, WhatsApp
  ui/                pantallas y componentes de interfaz
  dev/               herramientas de desarrollo (exportar gorro provisional a GLB)
public/
  models/            archivos .glb
  decorations/       imágenes PNG/SVG y modelos de decoraciones
```

## 4. Cómo cambiar las cosas

La app vende **un solo gorro** (rojo con borde blanco), con **personalizaciones solo en vinilo dorado**,
**una sola tipografía** y **precios automáticos en COP**. No hay selectores de modelo, color ni fuente.

### Precios (`src/config/app.ts` → `pricing`)
```ts
pricing: { currency: 'COP', basePrice: 2500, pricePerElement: 500 }
```
Total = precio base + precio por elemento × cantidad de elementos.
Cada texto (no vacío) y cada diseño aplicado cuenta como un elemento **una sola vez**: editar su
texto, tamaño, posición o zona no lo vuelve a cobrar. Sin impuestos ni cargos extra.
Ejemplos: sin personalización $2.500 COP · 1 elemento $3.000 · 2 → $3.500 · 3 → $4.000 · 4 → $4.500.

### Tipografía definitiva
Hoy se usa **Great Vibes como provisional**. Para cambiarla:
1. Copia el archivo (.woff2 recomendado) en `src/assets/fonts/`.
2. Descomenta el `@font-face` de `src/styles/text-font.css` y pon el nombre del archivo.
3. En `src/config/fonts.ts` cambia `family` (y `weight`/`sizeAdjust` si hace falta) y borra el import de Great Vibes.
Editor, visor 3D, imagen final y pedido usan esa misma configuración.

### Diseños / decoraciones (`src/config/decorations.ts`)
Catálogo actual: Estrella, Estrella fugaz, Destellos, Corazón y Árbol
(imágenes en `public/decorations/disenos/`). Todos se pintan en vinilo dorado: la imagen solo aporta la silueta.
Para añadir uno: guarda un PNG con fondo transparente (o SVG) en esa carpeta y añade una línea:
```ts
design('copo', 'Copo de nieve', 'copo.png', 1.0),   // id, nombre, archivo, ancho/alto
```
Para ocultar uno sin borrarlo: `enabled: false`. Para apagar todo el módulo: `features.decorations = false` en `app.ts`.

### Tono del dorado (`src/config/finishes.ts`)
`color`, `metalness`, `roughness` y `edgeRelief` del único acabado. Ajusta si el vinilo real se ve distinto.

### Zonas de personalización (`src/config/zones.ts`)
Cada zona define: `id`, `name`, posición (`anchor.azimuthDeg` 0 = frente, 90 = izquierda de quien lo usa,
180 = atrás; `anchor.height`), orientación (`rotationDeg`), `maxSize`, tipos permitidos, `enabled`,
`maxItems`, `maxChars` y restricciones. Al añadir un diseño, la app lo coloca en la primera zona libre.

### Cambiar el modelo 3D por uno real (GLB/GLTF)
1. Pide un `.glb` con **tres mallas separadas**: borde, cuerpo y pompón
   (altura total ≈ 2,4 unidades, borde entre `y = 0` y `y = 0.46`, frente mirando a +Z).
   Puedes darle al modelador el provisional exportado (ver Depuración).
2. Cópialo a `public/models/mi-gorro.glb` y en `src/config/products.ts`:
   ```ts
   model: { type: 'gltf', url: 'models/mi-gorro.glb',
            surfaceMap: { NombreMallaBorde: 'brim', NombreMallaCuerpo: 'body', NombreMallaPompon: 'pompom' } },
   ```
   Si el archivo no carga, la app muestra el gorro provisional en su lugar.

### WhatsApp
Pon el número del negocio en `appConfig.whatsappNumber` (ej. `573001234567`).

## 5. Flujo del cliente
Inicio → personalizar (Nombre · Diseños · Zonas, con total en vivo) → Resumen de compra
(producto, precio base, elementos, cantidad, precio por elemento, total) → Confirmar → código de pedido,
imagen y envío por WhatsApp.

### Pendiente
- Tipografía definitiva (en cuanto llegue el archivo).
- Arrastrar elementos con el dedo sobre el gorro (hoy: deslizadores + tocar una zona).
- Backend de pedidos y pagos (hoy los pedidos se guardan en el navegador).

## 6. Depuración
Abre la app con `?debug` para tener `window.__gorros` en la consola (estado y cámara).
Exportar el gorro provisional a GLB (con `npm run dev`):
```js
const m = await import('/src/dev/exportProceduralGlb.ts'); await m.downloadProceduralGlb();
```
