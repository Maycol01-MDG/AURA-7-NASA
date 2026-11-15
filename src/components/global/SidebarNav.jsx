import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Radiation,
  Sprout,
  Brain,
  ScrollText,
  Watch,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export const NAV_MODULES = [
  {
    id: 'overview',
    num: '01',
    label: 'Dashboard',
    sublabel: 'Overview & Sprout-Bot',
    Icon: LayoutDashboard,
  },
  {
    id: 'health',
    num: '02',
    label: 'Health & Trends',
    sublabel: '180-Day Biomarkers',
    Icon: Activity,
  },
  {
    id: 'radiation',
    num: '03',
    label: 'Radiation & EVARM',
    sublabel: 'CSA / Radi-N2 Scanner',
    Icon: Radiation,
  },
  {
    id: 'wellness',
    num: '04',
    label: 'Wellness & Veggie',
    sublabel: 'Nutrition, ARED & Sleep',
    Icon: Sprout,
  },
  {
    id: 'cognition',
    num: '05',
    label: 'Cognition (PVT)',
    sublabel: 'Live Reaction Test',
    Icon: Brain,
  },
  {
    id: 'mission',
    num: '06',
    label: 'Mission, Earth & Log',
    sublabel: 'Alert History',
    Icon: ScrollText,
  },
  {
    id: 'ecosystem',
    num: '07',
    label: 'Cabin Ecosystem',
    sublabel: 'Watch, EVA Visor & LED',
    Icon: Watch,
  },
];

export default function SidebarNav({
  activeModule,
  onSelectModule,
  evaluation,
  alertLogCount,
  theme,
  mobileMenuOpen,
  onCloseMobileMenu,
}) {
  const { t } = useLanguage();
  const { criticalCount, warningCount, isSpeWindow, hasAnyLiveOverride } = evaluation;

  const getBadge = (id) => {
    if (id === 'overview' && criticalCount > 0) {
      return { text: `${criticalCount} Crit.`, cls: 'bg-rose-500 text-white' };
    }
    if (id === 'health' && (criticalCount > 0 || warningCount > 0)) {
      return {
        text: `${criticalCount + warningCount}`,
        cls: criticalCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400',
      };
    }
    if (id === 'radiation' && isSpeWindow) {
      return { text: 'SPE', cls: 'bg-rose-500 text-white animate-pulse' };
    }
    if (id === 'cognition' && hasAnyLiveOverride) {
      return { text: 'LIVE', cls: 'bg-cyan-500/20 text-cyan-400' };
    }
    if (id === 'mission') {
      return { text: String(alertLogCount), cls: 'bg-slate-500/20 text-slate-400' };
    }
    return null;
  };

  const navContent = (
    <div className="mission-sidebar-content flex flex-col justify-between h-full gap-4">
      <div className="space-y-1.5">
        <div className={`mission-nav-heading px-3 pb-1 text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>{t("Module Navigation (7 Views)")}</div>
        {t(NAV_MODULES.map((mod) => {
          const active = activeModule === mod.id;
          const Icon = mod.Icon;
          const badge = getBadge(mod.id);
          return (
            <button
              key={mod.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => {
                onSelectModule(mod.id);
                onCloseMobileMenu?.();
              }}
              className={`mission-nav-item w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 transition-all border ${
                active
                  ? `${theme.pillActive} border-transparent`
                  : `border-transparent ${theme.pillInactive}`
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="mission-nav-icon"><Icon className="w-4 h-4 shrink-0" strokeWidth={1.6} /></span>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">
                    <span className="font-mono opacity-70 mr-1">{t(mod.num)}.</span>
                    {t(mod.label)}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      active ? 'opacity-90' : theme.textMuted
                    }`}
                  >
                    {t(mod.sublabel)}
                  </div>
                </div>
              </div>
              {t(badge && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${badge.cls}`}
                >
                  {t(badge.text)}
                </span>
              ))}
            </button>
          );
        }))}
      </div>

      {/* Circadian Spectrum Status Card inside Sidebar */}
      <div className={`mission-spectrum-card rounded-xl border p-3 text-[11px] space-y-1.5 ${theme.cardSubtleBg}`}>
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className={`w-3.5 h-3.5 ${theme.accentText}`} />
          <span>{t("Circadian Spectrum")}</span>
        </div>
        <div className="font-mono font-semibold text-xs">{t(theme.spectrumLabel)}</div>
        <div className={theme.textMuted}>{t(theme.melatoninState)}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`mission-sidebar hidden lg:block w-64 shrink-0 rounded-2xl border p-3.5 self-start sticky top-[calc(var(--app-header-height,4rem)+1.25rem)] circadian-transition ${theme.cardBg}`}
      >
        {t(navContent)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {t(mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCloseMobileMenu}
          />
          <aside
            className={`mission-sidebar mission-sidebar-mobile relative z-10 w-72 max-w-[85vw] h-full p-4 overflow-y-auto border-r ${
              theme.isDark ? 'bg-[#091227] border-indigo-400/20' : 'bg-white border-sky-200'
            }`}
          >
            {t(navContent)}
          </aside>
        </div>
      ))}
    </>
  );
}
