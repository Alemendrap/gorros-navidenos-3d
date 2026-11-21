/**
 * Configuración general del emprendimiento.
 * Edita estos valores sin tocar el resto del código.
 */
export const appConfig = {
  businessName: 'Taller de Gorros',
  villageName: 'Villa Navideña',
  tagline: 'Personaliza tu gorro navideño con letras y diseños dorados, y míralo en 3D',

  locale: 'es-CO',

  /**
   * PRECIOS (pesos colombianos).
   * Total = precio base + precio por elemento × cantidad de elementos.
   * Un "elemento" es cada texto (no vacío) o cada decoración aplicada al gorro.
   * Editar un elemento existente no cambia el precio; solo añadir o eliminar.
   */
  pricing: {
    currency: 'COP',
    basePrice: 2500,
    pricePerElement: 500,
  },

  /**
   * WHATSAPP — al confirmar, el cliente envía dos mensajes:
   *  - cobro: la FACTURA (detalle y total) para quien recibe el pago.
   *  - taller: el DISEÑO (textos, posiciones, imagen y enlace 3D) para quien fabrica el gorro.
   * Formato internacional sin "+" ni espacios: 57 + número de celular (ej. "573001234567").
   * Si un número queda vacío, WhatsApp deja que el cliente elija el contacto.
   */
  whatsapp: {
    cobro: { label: 'Cobro', number: '573227477433' },
    taller: { label: 'Taller (producción)', number: '573224602713' },
  },

  /**
   * Dirección pública de la página (ej. "https://gorros.netlify.app/").
   * Se usa en el enlace "Ver diseño en 3D" que recibe el taller.
   * Vacío = se usa la dirección desde la que el cliente abrió la página.
   */
  publicUrl: 'https://alemendrap.github.io/gorros-navidenos-3d/',

  features: {
    /** Interruptor global del módulo de decoraciones. */
    decorations: true,
    /** Guardado local de diseños en el navegador. */
    localSaves: true,
    /** Máximo de diseños guardados en el dispositivo. */
    maxSavedDesigns: 20,
  },

  /** Ajustes de rendimiento del visor 3D. */
  viewer: {
    /** Límite de densidad de píxeles (1.5–2 recomendado en móviles de gama media). */
    maxDpr: 1.75,
    shadows: true,
    autoRotateSpeed: 0.35,
  },
} as const;

export type AppConfig = typeof appConfig;
