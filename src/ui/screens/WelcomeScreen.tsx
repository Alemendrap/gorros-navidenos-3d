import { appConfig } from '@/config';
import { formatPrice } from '@/orders/pricing';
import { useDesign } from '@/store/designStore';
import { Snow } from '../components/Snow';
import { Icon } from '../components/Icon';

export function WelcomeOverlay() {
  const go = useDesign((s) => s.go);
  const hasDraft = useDesign((s) => s.design.items.length > 0);
  const savedCount = useDesign((s) => s.saved.length);
  return (
    <div className="absolute inset-0 z-10 flex flex-col">
      <Snow />
      <div className="relative flex flex-col items-center px-6 pt-[calc(env(safe-area-inset-top)+36px)] text-center animate-fadeUp">
        <p className="text-[11px] font-semibold uppercase tracking-[.38em] text-oro-light">{appConfig.villageName}</p>
        <h1 className="mt-2 font-display text-[44px] font-semibold leading-[1.02] text-crema sm:text-6xl">
          {appConfig.businessName}
        </h1>
        <div className="mt-3 flex items-center gap-3 text-oro-light/80">
          <span className="h-px w-10 bg-oro-light/50" /><Icon name="sparkle" size={14} /><span className="h-px w-10 bg-oro-light/50" />
        </div>
      </div>
      <div className="flex-1" />
      <div className="relative bg-gradient-to-t from-[#0B1F14] via-[#0B1F14]/85 to-transparent px-6 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-16 text-center animate-fadeUp" style={{ animationDelay: '.15s' }}>
        <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-crema/85">{appConfig.tagline}</p>
        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
          <button className="btn-gold w-full text-base" onClick={() => go('customize')} data-testid="start">
            {hasDraft || savedCount > 0 ? 'Continuar mi diseño' : 'Diseñar mi gorro'} <Icon name="next" size={18} />
          </button>
          <p className="text-sm text-oro-light">
            Gorro desde <b>{formatPrice(appConfig.pricing.basePrice)}</b> · cada nombre o diseño +{formatPrice(appConfig.pricing.pricePerElement, false)}
          </p>

        </div>
        <p className="mt-5 text-[11px] text-crema/45">Gira el gorro con el dedo · Pellizca para acercar</p>
      </div>
    </div>
  );
}
