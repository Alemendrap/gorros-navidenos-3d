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
   * Total = precio base + precio por letra × letras + precio por diseño × diseños.
   * Cada letra (o número/símbolo) de los textos se cobra por aparte; los espacios no se cobran.
   *   Ej.: "Samuel" = 6 letras × $500 = $3.000 → total $5.500 con el gorro.
   */
  pricing: {
    currency: 'COP',
    basePrice: 2500,
    pricePerLetter: 500,
    pricePerDecoration: 500,
  },

  /**
   * WHATSAPP — destinatarios del pedido, en el orden en que el cliente los envía.
   * Un solo botón va abriendo cada chat con el mensaje ya escrito.
   *   message: 'factura'  → detalle de precios y total (para cobrar)
   *            'diseno'   → textos, medidas, zonas y enlace 3D (para fabricar)
   *            'completo' → factura + diseño en un solo mensaje (y se copia la imagen para pegarla)
   * Número: 57 + celular, sin "+" ni espacios. Para quitar un destinatario, borra su bloque.
   */
  whatsapp: {
    recipients: [
      { id: 'principal', label: 'Pedidos', number: '573227477433', message: 'completo' },
      { id: 'copia', label: 'Copia del pedido', number: '573106630055', message: 'completo' },
    ],
  } as { recipients: { id: string; label: string; number: string; message: 'factura' | 'diseno' | 'completo' }[] },

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
