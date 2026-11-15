import React from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const QUICK_DEMO_DAYS = [
  {
    day: 25,
    label: 'Day 25: Nominal',
    tone: 'emerald',
  },
  {
    day: 98,
    label: 'Day 98: Missed ARED Workout & Bone Risk',
    tone: 'amber',
  },
  {
    day: 112,
    label: 'Day 112: Solar Particle Event (SPE) & Radiation Alert',
    tone: 'rose',
  },
  {
    day: 145,
    label: 'Day 145: Rising CO₂, Sleep Deficit & Cognitive Fatigue',
    tone: 'orange',
  },
];

export default function BottomMissionSimulator({
  selectedDay,
  onSelectDay,
  isPlaying,
  onTogglePlay,
  theme,
}) {
  const { t } = useLanguage();
  const toneClass = {
    emerald: {
      active: 'bg-emerald-500 text-white border-emerald-400 shadow-sm',
      idle: 'border-emerald-500/35 text-emerald-500 hover:bg-emerald-500/10',
    },
    amber: {
      active: 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm',
      idle: 'border-amber-500/35 text-amber-400 hover:bg-amber-500/10',
    },
    rose: {
      active: 'bg-rose-600 text-white border-rose-400 shadow-sm',
      idle: 'border-rose-500/40 text-rose-400 hover:bg-rose-500/10',
    },
    orange: {
      active: 'bg-orange-500 text-stone-950 border-orange-400 shadow-sm',
      idle: 'border-orange-500/40 text-orange-400 hover:bg-orange-500/10',
    },
  };

  return (
    <footer
      className={`mission-timeline fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl circadian-transition ${theme.headerBg}`}
    >
      <div className="mission-timeline-inner max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 space-y-2">
        {/* Top Row: Simulator Slider 1-180 + Playback */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className={`w-4 h-4 ${theme.accentText}`} />
            <span className="text-xs font-extrabold tracking-tight">{t("180-Day Simulator")}</span>
            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${theme.accentSoft}`}>{t("D")}{t(selectedDay)}
            </span>
          </div>

          {/* Range Slider with Event Zones */}
          <div className="flex-1 min-w-[180px] relative flex items-center">
            <div
              className={`w-full h-2 rounded-full overflow-hidden flex ${
                theme.isDark ? 'bg-slate-800' : 'bg-sky-200'
              }`}
            >
              <div style={{ width: `${(84 / 180) * 100}%` }} className="bg-emerald-500/35" />
              <div style={{ width: `${(25 / 180) * 100}%` }} className="bg-amber-500/60" />
              <div style={{ width: `${(5 / 180) * 100}%` }} className="bg-rose-500/90" />
              <div style={{ width: `${(20 / 180) * 100}%` }} className="bg-emerald-500/35" />
              <div style={{ width: `${(21 / 180) * 100}%` }} className="bg-orange-500/75" />
              <div style={{ width: `${(25 / 180) * 100}%` }} className="bg-emerald-500/35" />
            </div>
            <input
              type="range"
              min={1}
              max={180}
              value={selectedDay}
              onChange={(e) => onSelectDay(Number(e.target.value))}
              aria-label={t("Mission day simulator, days 1 to 180")}
              className="mission-slider w-full absolute inset-0"
            />
          </div>

          {/* Step & Play Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onSelectDay(Math.max(1, selectedDay - 1))}
              className={`p-1.5 rounded-lg border transition ${theme.cardSubtleBg} hover:border-sky-400`}
              title={t("Previous day")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onTogglePlay}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${theme.accentBg}`}
            >
              {t(isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />)}
              <span className="hidden sm:inline">{t(isPlaying ? 'Pause' : 'Auto')}</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectDay(Math.min(180, selectedDay + 1))}
              className={`p-1.5 rounded-lg border transition ${theme.cardSubtleBg} hover:border-sky-400`}
              title={t("Next day")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Row: 4 Quick Demo Jump Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
          {t(QUICK_DEMO_DAYS.map((btn) => {
            const active = selectedDay === btn.day;
            const style = toneClass[btn.tone];
            return (
              <button
                key={btn.day}
                type="button"
                onClick={() => onSelectDay(btn.day)}
                data-active={active}
                data-tone={btn.tone}
                className={`mission-scenario px-2.5 py-1.5 rounded-lg border text-[11px] font-bold truncate transition text-left ${
                  active ? style.active : `${theme.cardSubtleBg} ${style.idle}`
                }`}
                title={t(btn.label)}
              >
                {t(btn.label)}
              </button>
            );
          }))}
        </div>
      </div>
    </footer>
  );
}
