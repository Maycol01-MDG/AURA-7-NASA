import React, { useEffect, useRef, useState } from 'react';
import {
  Sun,
  Sunset,
  Moon,
  Clock,
  Radio,
  Send,
  ShieldCheck,
  Database,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';

export default function TopEarthHeader({
  selectedDay,
  dayData,
  circadianMode,
  onSelectMode,
  theme,
  onOpenTelemetryModal,
  hasAnyLiveOverride,
  overallMeta,
  mobileMenuOpen,
  onToggleMobileMenu,
}) {
  const { t, locale } = useLanguage();
  const headerRef = useRef(null);
  const [earthTime, setEarthTime] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setEarthTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      if (!headerRef.current) return;
      document.documentElement.style.setProperty('--app-header-height', `${headerRef.current.offsetHeight}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--app-header-height');
    };
  }, []);

  const utcStr = earthTime.toISOString().slice(11, 19);
  const localStr = earthTime.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const modes = [
    { id: 'day', label: 'Day', range: '06:00-17:30', Icon: Sun },
    { id: 'sunset', label: 'Sunset', range: '17:30-20:00', Icon: Sunset },
    { id: 'night', label: 'Night', range: '20:00-06:00', Icon: Moon },
  ];

  return (
    <header
      ref={headerRef}
      className={`mission-header fixed top-0 left-0 right-0 z-40 border-b backdrop-blur-xl circadian-transition ${theme.headerBg}`}
    >
      <div className="mission-header-inner max-w-[1600px] mx-auto px-3 sm:px-6 h-auto py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Mobile Menu + Brand + MISSION DAY Badge */}
        <div className="mission-brand flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className={`lg:hidden p-2 rounded-xl border ${theme.cardSubtleBg}`}
            aria-label={t("Toggle module navigation")}
          >
            {t(mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />)}
          </button>

          <div className="mission-brand-mark shrink-0" aria-hidden="true">{t("A7")}</div>

          <div className="leading-tight">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="mission-wordmark font-extrabold text-sm sm:text-base tracking-tight">{t("AURA-7")}</span>
              <span className="mission-day-badge px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/35 text-sky-500 font-mono text-[11px] font-bold">{t("MISSION DAY ")}{t(selectedDay)} / 180
              </span>
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${overallMeta.badgeClass}`}
              >
                {t(overallMeta.label)}
              </span>
            </div>
            <div className={`text-[11px] flex items-center gap-2 flex-wrap ${theme.textMuted}`}>
              <span className="mission-brand-caption font-semibold text-sky-500">{t("Andes Space Labs")}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline font-mono">
                {t(hasAnyLiveOverride ? (
                  <span className="inline-flex items-center gap-1 text-cyan-400 font-bold">
                    <Sparkles className="w-3 h-3" />{t(" [Live Demo Measurement]")}</span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Database className="w-3 h-3" />{t(" [Audited Historical Telemetry]")}</span>
                ))}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Autonomy Status + Earth Clock + Circadian Selector + Houston Modal */}
        <div className="mission-header-controls flex flex-wrap items-center gap-2">
          <LanguageSelector theme={theme} />
          {/* Autonomy & Earth Comm Delay Indicator */}
          <div
            className={`mission-autonomy-indicator hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border circadian-transition ${theme.cardSubtleBg}`}
          >
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
            <div className="leading-tight">
              <div className="text-[11px] font-mono font-bold">{t("Earth Comm Delay: ")}{t(dayData.earth_comm_delay_min.toFixed(1))}{t(" min (One-Way)")}</div>
              <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{t("LOCAL AUTONOMOUS MODE ACTIVE")}</span>
              </div>
            </div>
          </div>

          {/* Earth Clock */}
          <div
            className={`mission-clock hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border circadian-transition ${theme.cardSubtleBg}`}
          >
            <Clock className={`w-4 h-4 ${theme.accentText}`} />
            <div className="leading-tight">
              <div className={`text-[10px] font-semibold uppercase ${theme.textMuted}`}>{t("Earth Clock")}</div>
              <div className="font-mono text-xs font-bold">
                {t(localStr)} <span className="opacity-50">|</span> {t(utcStr)}{t(" UTC")}</div>
            </div>
          </div>

          {/* Circadian Mode Selector */}
          <div
            className={`mission-mode-selector flex items-center p-1 rounded-xl border circadian-transition ${theme.cardSubtleBg}`}
            role="group"
            aria-label={t("Earth Circadian Mode Selector")}
          >
            {t(modes.map(({ id, label, range, Icon }) => {
              const active = circadianMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectMode(id)}
                  title={t(`${label} (${range})`)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    active ? theme.pillActive : theme.pillInactive
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t(label)}</span>
                  <span className="hidden 2xl:inline text-[10px] font-mono opacity-80">
                    {t(range)}
                  </span>
                </button>
              );
            }))}
          </div>

          {/* Open Asynchronous Earth Telemetry Packet Modal */}
          <button
            type="button"
            onClick={onOpenTelemetryModal}
            className={`mission-packet-button inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition ${theme.accentBg}`}
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("Houston Packet")}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20">
              +{t(dayData.earth_comm_delay_min.toFixed(1))}{t("m")}</span>
          </button>
        </div>
      </div>

      {/* Compact Autonomy Strip on <xl screens */}
      <div
        className={`mission-autonomy-strip xl:hidden px-3 sm:px-6 py-1 border-t text-[11px] flex flex-wrap items-center justify-between gap-2 ${theme.divider}`}
      >
        <span className="font-mono">{t("Earth Comm Delay: ")}<strong>{t(dayData.earth_comm_delay_min.toFixed(1))}{t(" min (One-Way)")}</strong>
        </span>
        <span className="font-bold text-emerald-500 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />{t("LOCAL AUTONOMOUS MODE ACTIVE")}</span>
      </div>
    </header>
  );
}
