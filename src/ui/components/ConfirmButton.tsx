import { useEffect, useState, type ReactNode } from 'react';

/** Botón de dos pasos para acciones destructivas (sin diálogos del navegador). */
export function ConfirmButton({ onConfirm, children, confirmText = '¿Seguro? Toca otra vez', className = 'btn-danger' }: {
  onConfirm: () => void; children: ReactNode; confirmText?: string; className?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button type="button" className={`${className} ${armed ? '!bg-navidad !text-white' : ''}`} onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}>
      {armed ? confirmText : children}
    </button>
  );
}
