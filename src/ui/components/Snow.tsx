import { useMemo } from 'react';

/** Nieve ligera en CSS (sin coste en el hilo principal). */
export function Snow({ count = 28 }: { count?: number }) {
  const flakes = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      left: (i * 37.7) % 100,
      size: 4 + ((i * 13) % 9),
      dur: 9 + ((i * 7) % 11),
      delay: -((i * 3.3) % 14),
      drift: ((i % 5) - 2) * 18,
      op: 0.35 + ((i * 17) % 50) / 100,
    })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {flakes.map((f, i) => (
        <span
          key={i}
          className="snowflake"
          style={{
            left: `${f.left}%`, fontSize: f.size, opacity: f.op,
            animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`,
            ['--drift' as string]: `${f.drift}px`,
          }}
        >
          ●
        </span>
      ))}
    </div>
  );
}
