import { useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

/**
 * Panel de herramientas.
 * - Móvil: hoja inferior que se abre/cierra (botón o deslizando el asa).
 * - Escritorio (lg): panel lateral fijo.
 */
export function Sheet({ open, onToggle, header, children, footer, compact }: {
  open: boolean;
  onToggle: (open: boolean) => void;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Modo compacto mientras se escribe con el teclado abierto. */
  compact?: boolean;
}) {
  const startY = useRef<number | null>(null);
  return (
    <section
      className={`relative z-20 flex w-full flex-col rounded-t-[28px] border-t border-oro/25 bg-crema/95 shadow-sheet backdrop-blur-md
        transition-[max-height] duration-300 ease-out
        lg:h-full lg:max-h-none lg:w-[420px] lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none
        ${compact ? 'max-h-[42%]' : open ? 'max-h-[58%]' : 'max-h-[148px]'}`}
      aria-label="Panel de personalización"
    >
      <button
        type="button"
        className="flex w-full shrink-0 items-center justify-center pb-1 pt-2.5 lg:hidden"
        onClick={() => onToggle(!open)}
        onPointerDown={(e) => { startY.current = e.clientY; }}
        onPointerUp={(e) => {
          if (startY.current === null) return;
          const dy = e.clientY - startY.current;
          startY.current = null;
          if (dy < -25) onToggle(true);
          else if (dy > 25) onToggle(false);
        }}
        aria-label={open ? 'Cerrar panel' : 'Abrir panel'}
        aria-expanded={open}
      >
        <span className="h-1.5 w-11 rounded-full bg-tinta/20" />
        <Icon name={open ? 'chevronDown' : 'chevronUp'} size={16} className="absolute right-5 top-2.5 text-tinta/40" />
      </button>
      {header && <div className="shrink-0 px-4 lg:px-6 lg:pt-5">{header}</div>}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-2 lg:px-6">{children}</div>
      {footer && <div className="shrink-0 border-t border-tinta/10 bg-crema/90 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] lg:px-6">{footer}</div>}
    </section>
  );
}
