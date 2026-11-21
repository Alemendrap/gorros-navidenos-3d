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
   * Número de WhatsApp del negocio en formato internacional sin "+" ni espacios
   * (ej. "573001234567"). Vacío = el cliente elige a quién enviarlo.
   */
  whatsappNumber: '',

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
