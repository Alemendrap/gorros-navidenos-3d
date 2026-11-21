import { useDesign } from '@/store/designStore';

export function Toast() {
  const notice = useDesign((s) => s.notice);
  if (!notice) return null;
  const tone = notice.tone === 'warn' ? 'bg-navidad text-white' : notice.tone === 'ok' ? 'bg-pino text-white' : 'bg-tinta text-white';
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+72px)] z-50 flex justify-center px-4">
      <div key={notice.id} role="status" className={`animate-fadeUp rounded-full px-5 py-2.5 text-sm font-medium shadow-lg ${tone}`}>
        {notice.text}
      </div>
    </div>
  );
}
