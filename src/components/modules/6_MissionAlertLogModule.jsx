import React, { useMemo, useState } from 'react';
import {
  ScrollText,
  ExternalLink,
  Send,
  Calendar,
  Filter,
  Radio,
  Search,
} from 'lucide-react';
import { STATUS_META } from '../../services/evaluationEngine';
import { CIRCADIAN_MODES } from '../../utils/circadianThemes';
import { useLanguage } from '../../i18n/LanguageContext';

export default function MissionAlertLogModule({
  alertLog,
  selectedDay,
  dayData,
  circadianMode,
  onSelectMode,
  onOpenTelemetryModal,
  theme,
}) {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Active Today' | 'Monitoring' | 'Resolved'
  const [severityFilter, setSeverityFilter] = useState('all'); // 'all' | 'critical' | 'warning'
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return alertLog.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
      if (
        q &&
        !item.indicator.toLowerCase().includes(q) &&
        !t(item.indicator).toLowerCase().includes(q) &&
        !(item.kbRecord?.id || '').toLowerCase().includes(q) &&
        !String(item.day).includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [alertLog, statusFilter, severityFilter, searchTerm, t]);

  const counts = useMemo(
    () => ({
      activeToday: alertLog.filter((x) => x.status === 'Active Today').length,
      monitoring: alertLog.filter((x) => x.status === 'Monitoring').length,
      resolved: alertLog.filter((x) => x.status === 'Resolved').length,
    }),
    [alertLog]
  );

  const trackingBadge = (st) => {
    if (st === 'Active Today') return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    if (st === 'Monitoring') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/35';
  };

  return (
    <div className="space-y-5">
      {/* Top Grid: Earth Sync Access + Circadian Rhythm Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Earth Link & Modal Trigger Card */}
        <section
          className={`lg:col-span-6 rounded-2xl border p-5 flex flex-col justify-between gap-4 circadian-transition ${theme.cardBg}`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                <span>{t("Asynchronous Link to Earth (Houston MCC)")}</span>
              </h2>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                +{t(dayData.earth_comm_delay_min.toFixed(1))}{t(" min")}</span>
            </div>
            <p className={`text-xs leading-relaxed ${theme.textSecondary}`}>{t("On Day ")}{t(selectedDay)}{t(", signals to Houston take")}{t(' ')}
              <strong>{t(dayData.earth_comm_delay_min.toFixed(1))}{t(" minutes")}</strong>{t(" to arrive (and")}{t(' ')}
              <strong>{t((dayData.earth_comm_delay_min * 2).toFixed(1))}{t(" min")}</strong>{t(" for a response). AURA-7 compiles compressed telemetry packets for asynchronous review by the Flight Surgeons.")}</p>
          </div>

          <button
            type="button"
            onClick={onOpenTelemetryModal}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition ${theme.accentBg}`}
          >
            <Send className="w-4 h-4" />
            <span>{t("Open “Asynchronous Earth Telemetry Packet” Dialog")}</span>
          </button>
        </section>

        {/* Circadian Schedule Calendar */}
        <section
          className={`lg:col-span-6 rounded-2xl border p-5 space-y-3 circadian-transition ${theme.cardBg}`}
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <Calendar className={`w-5 h-5 ${theme.accentText}`} />
              <span>{t("Calendario Circadiano Terrestre (24 h)")}</span>
            </h3>
            <span className={`text-[11px] font-mono ${theme.textMuted}`}>{t("Mitigates 16 orbits/day")}</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {t(Object.values(CIRCADIAN_MODES).map((m) => {
              const active = circadianMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMode(m.id)}
                  className={`text-left p-3 rounded-xl border transition ${
                    active ? theme.pillActive + ' border-transparent' : theme.cardSubtleBg
                  }`}
                >
                  <div className="text-xs font-extrabold">{t(m.label)}</div>
                  <div className="text-[10px] font-mono opacity-85">{t(m.windowLabel)}</div>
                  <div className="text-[10px] mt-1 opacity-80 truncate">{t(m.kelvin)}</div>
                </button>
              );
            }))}
          </div>
          <p className={`text-[11px] ${theme.textMuted}`}>{t("Synchronizes cabin LED lighting (`HRP-RISK-014`) and Sprout-Bot's visual behavior.")}</p>
        </section>
      </div>

      {/* Historical Alert Log (Day 1 to selectedDay) */}
      <section className={`rounded-2xl border p-5 space-y-4 circadian-transition ${theme.cardBg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
              <ScrollText className={`w-5 h-5 ${theme.accentText}`} />
              <span>{t("Historical Alert Log (Day 1 to Day ")}{t(selectedDay)})</span>
            </h2>
            <p className={`text-xs mt-0.5 ${theme.textMuted}`}>
              {t(alertLog.length)}{t(" events recorded to date ·")}{t(' ')}
              <strong className="text-rose-400">{t(counts.activeToday)}{t(" Active Today")}</strong> ·{t(' ')}
              <strong className="text-amber-400">{t(counts.monitoring)}{t(" Monitoring")}</strong> ·{t(' ')}
              <strong className="text-emerald-500">{t(counts.resolved)}{t(" Resolved")}</strong>
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("Filter by day, metric, or code…")}
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 ${theme.inputBg}`}
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold mr-1 ${theme.textMuted}`}>
              <Filter className="w-3.5 h-3.5" />{t(" Status:")}</span>
            {t(['all', 'Active Today', 'Monitoring', 'Resolved'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  statusFilter === st
                    ? theme.pillActive + ' border-transparent'
                    : `${theme.cardSubtleBg} ${theme.textSecondary}`
                }`}
              >
                {t(st === 'all' ? 'All' : st)}
              </button>
            )))}
          </div>

          <div className="flex items-center gap-1.5">
            {t([
              { id: 'all', label: 'All Severities' },
              { id: 'critical', label: 'Critical' },
              { id: 'warning', label: 'Warning' },
            ].map((sev) => (
              <button
                key={sev.id}
                type="button"
                onClick={() => setSeverityFilter(sev.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  severityFilter === sev.id
                    ? theme.pillActive + ' border-transparent'
                    : `${theme.cardSubtleBg} ${theme.textSecondary}`
                }`}
              >
                {t(sev.label)}
              </button>
            )))}
          </div>
        </div>

        {/* Log Table */}
        {t(filteredLogs.length === 0 ? (
          <div className={`p-6 rounded-xl border text-center text-xs ${theme.cardSubtleBg}`}>{t("No historical alerts match the selected filters through Day ")}{t(selectedDay)}.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto rounded-xl border border-slate-500/20">
            <table className="w-full text-left border-collapse text-xs">
              <thead className={`sticky top-0 z-10 ${theme.isDark ? 'bg-slate-900' : 'bg-sky-100'}`}>
                <tr className="border-b border-slate-500/20">
                  <th className="py-2.5 px-3 font-bold">{t("Day")}</th>
                  <th className="py-2.5 px-3 font-bold">{t("Metric")}</th>
                  <th className="py-2.5 px-3 font-bold">{t("Value")}</th>
                  <th className="py-2.5 px-3 font-bold">{t("Severity")}</th>
                  <th className="py-2.5 px-3 font-bold">{t("NASA / CSA Reference")}</th>
                  <th className="py-2.5 px-3 font-bold">{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {t(filteredLogs.map((row) => {
                  const sevMeta = STATUS_META[row.severity];
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-slate-500/15 ${
                        row.day === selectedDay ? 'bg-sky-500/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">{t("Day ")}{t(row.day)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold">{t(row.indicator)}</div>
                        <div className={`text-[11px] ${theme.textMuted}`}>{t(row.note)}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">{t(row.valueText)}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sevMeta.badgeClass}`}
                        >
                          {t(sevMeta.label)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {t(row.kbRecord ? (
                          <a
                            href={row.kbRecord.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t(row.kbRecord.title)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 hover:underline"
                          >
                            <span>{t(row.kbRecord.id)}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          '—'
                        ))}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${trackingBadge(
                            row.status
                          )}`}
                        >
                          {t(row.status)}
                        </span>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </div>
  );
}
