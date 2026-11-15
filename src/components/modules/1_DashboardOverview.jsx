import React from 'react';
import {
  ArrowRight,
  ExternalLink,
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Dumbbell,
  Radiation,
} from 'lucide-react';
import SproutBotHero from '../copilot/SproutBotHero';
import { STATUS_META } from '../../services/evaluationEngine';
import { useLanguage } from '../../i18n/LanguageContext';

export default function DashboardOverview({
  evaluation,
  psychInference,
  circadianMode,
  theme,
  onNavigateModule,
  onTriggerCopilotAction,
}) {
  const { t } = useLanguage();
  const {
    dayData,
    readinessScore,
    readinessDelta,
    optimalCount,
    warningCount,
    criticalCount,
    overallMeta,
    activeAlerts,
  } = evaluation;

  const deltaLabel =
    readinessDelta === null
      ? 'First mission day'
      : readinessDelta > 0
      ? `+${readinessDelta}% vs yesterday`
      : readinessDelta < 0
      ? `${readinessDelta}% vs yesterday`
      : 'No change vs yesterday';

  return (
    <div className="mission-overview space-y-5">
      {/* 1. Sprout-Bot Hero Experience */}
      <SproutBotHero
        evaluation={evaluation}
        psychInference={psychInference}
        circadianMode={circadianMode}
        theme={theme}
        onTriggerAction={onTriggerCopilotAction}
      />

      {/* 2. Executive General Status Summary */}
      <section className={`mission-summary rounded-2xl border p-5 circadian-transition ${theme.cardBg}`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Readiness Score 0-100% */}
          <div className="md:col-span-4 flex items-center gap-4">
            <div
              className={`mission-readiness w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${overallMeta.ringClass} ${theme.cardSubtleBg}`}
            >
              <span className="text-2xl font-black font-mono" style={{ color: overallMeta.hex }}>
                {t(readinessScore)}%
              </span>
              <span className={`text-[10px] font-bold uppercase ${theme.textMuted}`}>{t("Readiness")}</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-500">
                <Gauge className="w-3.5 h-3.5" />
                <span>{t("Overall Status Summary")}</span>
              </div>
              <div className="text-sm font-extrabold">{t("Day Status: ")}<span style={{ color: overallMeta.hex }}>{t(overallMeta.label)}</span>
              </div>
              <div className={`text-xs flex items-center gap-1 ${theme.textSecondary}`}>
                {t(readinessDelta > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                ) : readinessDelta < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Minus className="w-3.5 h-3.5 opacity-60" />
                ))}
                <span>{t(deltaLabel)}</span>
              </div>
            </div>
          </div>

          {/* 3-Level Traffic Light Counts */}
          <div className="mission-stat-grid md:col-span-5 grid grid-cols-3 gap-2.5">
            <div className={`mission-stat mission-stat-optimal rounded-xl border p-3 text-center ${theme.cardSubtleBg}`}>
              <div className="flex items-center justify-center gap-1 text-emerald-500 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t("Optimal")}</span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-500 mt-0.5">
                {t(optimalCount)}
              </div>
              <div className={`text-[10px] ${theme.textMuted}`}>{t("of 6 metrics")}</div>
            </div>

            <div className={`mission-stat mission-stat-warning rounded-xl border p-3 text-center ${theme.cardSubtleBg}`}>
              <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t("Warning")}</span>
              </div>
              <div className="text-2xl font-black font-mono text-amber-400 mt-0.5">
                {t(warningCount)}
              </div>
              <div className={`text-[10px] ${theme.textMuted}`}>{t("under monitoring")}</div>
            </div>

            <div className={`mission-stat mission-stat-critical rounded-xl border p-3 text-center ${theme.cardSubtleBg}`}>
              <div className="flex items-center justify-center gap-1 text-rose-400 text-xs font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{t("Critical")}</span>
              </div>
              <div className="text-2xl font-black font-mono text-rose-400 mt-0.5">
                {t(criticalCount)}
              </div>
              <div className={`text-[10px] ${theme.textMuted}`}>{t("priority")}</div>
            </div>
          </div>

          {/* Operational Context Flags + Jump to Trends */}
          <div className="md:col-span-3 flex flex-col gap-2">
            <div
              className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between ${
                dayData.ared_workout_completed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : 'bg-amber-500/15 border-amber-500/35 text-amber-400 font-semibold'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5" />{t(" ARED Workout")}</span>
              <span className="font-mono font-bold">
                {t(dayData.ared_workout_completed ? 'OK' : 'MISSED')}
              </span>
            </div>

            <div
              className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between ${
                dayData.solar_particle_event
                  ? 'bg-rose-500/20 border-rose-500/45 text-rose-400 font-bold'
                  : `${theme.cardSubtleBg} ${theme.textSecondary}`
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Radiation className="w-3.5 h-3.5" />{t(" SPE")}</span>
              <span className="font-mono font-bold">
                {t(dayData.solar_particle_event ? 'ACTIVE' : 'INACTIVE')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigateModule('health')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${theme.accentBg}`}
            >
              <span>{t("View 6 Biomarkers & Trends")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Active Alerts & Day Recommendations */}
      <section className="mission-alerts space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight">{t("Active Alerts & Traceable Daily Recommendations")}</h2>
            <p className={`text-xs ${theme.textMuted}`}>{t("Non-diagnostic correlations directly linked to official NASA HRP and CSA documents")}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateModule('mission')}
            className={`text-xs font-semibold hover:underline ${theme.accentText}`}
          >{t("View full history from Day 1 →")}</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {t(activeAlerts.map((alert) => {
            const st = STATUS_META[alert.severity];
            return (
              <article
                key={alert.id}
                data-severity={alert.severity}
                className={`mission-alert-card rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-3 circadian-transition ${theme.cardBg} ${st.ringClass}`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold leading-snug">
                      {t(alert.title)}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${st.badgeClass}`}
                    >
                      {t(st.label)}
                    </span>
                  </div>

                  <div className={`text-xs font-mono px-3 py-2 rounded-xl border ${theme.cardSubtleBg}`}>
                    {t(alert.metricChanged)}
                  </div>

                  <div className={`text-xs space-y-1.5 ${theme.textSecondary}`}>
                    <p>
                      <strong className={theme.textPrimary}>{t("Physiological correlation:")}</strong>{t(' ')}
                      {t(alert.correlations)}
                    </p>
                    <p>
                      <strong className={theme.textPrimary}>{t("Documented risk:")}</strong>{t(' ')}
                      {t(alert.documentedRisk)}
                    </p>
                    <p>
                      <strong className="text-emerald-500">{t("Preventive countermeasure:")}</strong>{t(' ')}
                      {t(alert.countermeasure)}
                    </p>
                  </div>
                </div>

                <div className={`pt-3 border-t ${theme.divider} flex flex-wrap items-center justify-between gap-2`}>
                  <div className="flex flex-wrap gap-1.5">
                    {t(alert.citations.map((rec) => (
                      <a
                        key={rec.id}
                        href={rec.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t(rec.title)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 hover:bg-sky-500/25 transition"
                      >
                        <span>{t(rec.id)}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateModule(alert.targetModule)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${theme.cardSubtleBg} hover:border-sky-400`}
                  >
                    <span>{t(alert.targetLabel)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          }))}
        </div>
      </section>
    </div>
  );
}
