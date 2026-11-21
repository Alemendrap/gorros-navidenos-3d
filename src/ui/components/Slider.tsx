import { useId } from 'react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
  hint?: string;
}

export function Slider({ label, value, min, max, step = 0.005, onChange, format, disabled, hint }: Props) {
  const id = useId();
  const span = max - min;
  const fill = span > 0 ? ((value - min) / span) * 100 : 50;
  const off = disabled || span <= 1e-6;
  return (
    <div className={off ? 'opacity-45' : ''}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="label">{label}</label>
        <span className="text-xs tabular-nums text-tinta/60">{format ? format(value) : value.toFixed(2)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        disabled={off}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ ['--fill' as string]: `${fill}%` }}
        aria-label={label}
      />
      {hint && <p className="-mt-1 text-[11px] text-oro-dark">{hint}</p>}
    </div>
  );
}
