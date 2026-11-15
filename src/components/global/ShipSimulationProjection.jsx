import React, { useState } from 'react';
import { Rocket, X } from 'lucide-react';
import alertProjection from '../../data/gift/astronauta_alerta.gif';
import cabinProjection from '../../data/gift/astronauta_hogar.gif';
import plantProjection from '../../data/gift/astronauta_planta.gif';
import testProjection from '../../data/gift/astronauta_test.gif';
import { useLanguage } from '../../i18n/LanguageContext';

const PROJECTIONS = {
  radiation: { image: alertProjection, label: 'Radiation Alert' },
  wellness: { image: plantProjection, label: 'Veggie Plant Care' },
  cognition: { image: testProjection, label: 'Cognition Test' },
  ecosystem: { image: cabinProjection, label: 'Cabin Environment' },
};

export default function ShipSimulationProjection({ moduleId }) {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const projection = PROJECTIONS[moduleId];
  const isProjected = isHovered || isPinned;

  if (!projection) return null;

  return (
    <>
      <div
        className="fixed bottom-40 left-4 z-[80]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          onClick={() => setIsPinned((current) => !current)}
          aria-pressed={isPinned}
          aria-label={t(isPinned ? 'Turn off ship simulation projection' : 'Project ship simulation')}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/70 bg-slate-950/90 px-3 py-2 text-xs font-bold text-cyan-100 shadow-lg shadow-cyan-950/40 backdrop-blur transition hover:border-cyan-200 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          {t(isPinned ? <X className="h-4 w-4" /> : <Rocket className="h-4 w-4" />)}
          <span className="hidden sm:inline">
            {t(isPinned ? 'Projection On' : 'Ship Simulation')}
          </span>
        </button>
      </div>

      {t(isProjected && (
        <div
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          aria-live="polite"
        >
          <div className="animate-bubble-in relative flex max-h-[88vh] max-w-[92vw] flex-col items-center">
            <div className="mb-2 rounded-full border border-cyan-300/50 bg-slate-950/80 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100 shadow-lg shadow-cyan-950/40 backdrop-blur">{t("Ship Simulation · ")}{t(projection.label)}
            </div>
            <img
              src={projection.image}
              alt={t(`${projection.label} astronaut simulation`)}
              className="max-h-[78vh] max-w-[92vw] object-contain drop-shadow-[0_0_32px_rgba(34,211,238,0.5)]"
            />
          </div>
        </div>
      ))}
    </>
  );
}
