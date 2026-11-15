import React, { useState } from 'react';
import {
  Activity,
  Bone,
  HeartPulse,
  Radiation,
  Wind,
  MoonStar,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const METRIC_ICONS = {
  bone_density_index: Bone,
  resting_heart_rate: HeartPulse,
  cumulative_radiation_msv: Radiation,
  cabin_co2_mmhg: Wind,
  sleep_hours: MoonStar,
  pvt_reaction_ms: Brain,
};

const TIME_WINDOWS = [
  { id: '1d', label: 'Yesterday vs. Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '180d', label: 'Full History (180 Days)' },
];

export default function HealthTrendsModule({
  evaluation,
  histories,
  selectedDay,
  theme,
}) {
  const { t } = useLanguage();
  const [selectedMetricKey, setSelectedMetricKey] = useState('cabin_co2_mmhg');
  const [timeWindow, setTimeWindow] = useState('30d');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const activeMetric =
    evaluation.metrics.find((m) => m.key === selectedMetricKey) || evaluation.metrics[0];
  const activeHistory = histories[activeMetric.key];
  const points = activeHistory.series[timeWindow] || [];

  // Build SVG chart geometry
  const W = 720;
  const H = 240;
  const PAD_L = 48;
  const PAD_R = 20;
  const PAD_T = 20;
  const PAD_B = 34;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const threshold = activeMetric.threshold;
  const thresholdLines = [];
  if (threshold.optimal_min !== undefined) {
    thresholdLines.push({ val: threshold.optimal_min, label: `Optimal ≥ ${threshold.optimal_min}`, color: '#10b981' });
  }
  if (threshold.warning_min !== undefined) {
    thresholdLines.push({ val: threshold.warning_min, label: `Warning < ${threshold.warning_min}`, color: '#f59e0b' });
  }
  if (threshold.optimal_max !== undefined) {
    thresholdLines.push({ val: threshold.optimal_max, label: `Optimal ≤ ${threshold.optimal_max}`, color: '#10b981' });
  }
  if (threshold.warning_max !== undefined) {
    thresholdLines.push({ val: threshold.warning_max, label: `Warning > ${threshold.warning_max}`, color: '#f59e0b' });
  }
  if (threshold.critical_max !== undefined) {
    thresholdLines.push({ val: threshold.critical_max, label: `Critical ≥ ${threshold.critical_max}`, color: '#fb7185' });
  }

  const allVals = [
    ...points.map((p) => p.value),
    ...thresholdLines.map((t) => t.val),
  ];
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const span = Math.max(0.5, rawMax - rawMin);
  const yMin = rawMin - span * 0.12;
  const yMax = rawMax + span * 0.12;

  const toX = (idx) =>
    points.length <= 1 ? PAD_L + plotW / 2 : PAD_L + (idx / (points.length - 1)) * plotW;
  const toY = (val) => PAD_T + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

  // Split past/present vs future in 180d mode
  const pastPoints = points.filter((p) => !p.isFuture);
  const futurePoints = points.filter((p) => p.isFuture);

  const pastPolyline = pastPoints
    .map((p) => {
      const idx = points.indexOf(p);
      return `${toX(idx).toFixed(1)},${toY(p.value).toFixed(1)}`;
    })
    .join(' ');

  const futurePolyline =
    futurePoints.length > 0 && pastPoints.length > 0
      ? [pastPoints[pastPoints.length - 1], ...futurePoints]
          .map((p) => {
            const idx = points.indexOf(p);
            return `${toX(idx).toFixed(1)},${toY(p.value).toFixed(1)}`;
          })
          .join(' ')
      : '';

  const formatDelta = (delta, unit) => {
    if (delta === null || delta === undefined) return '—';
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta} ${unit}`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={`rounded-2xl border p-5 circadian-transition ${theme.cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
              <Activity className={`w-5 h-5 ${theme.accentText}`} />
              <span>{t("Health & Historical Trends (180 Days)")}</span>
            </h2>
            <p className={`text-xs mt-0.5 ${theme.textMuted}`}>{t("Select any of the 6 biomarkers to analyze its trend against NASA/CSA clinical thresholds")}</p>
          </div>
          <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${theme.cardSubtleBg}`}>{t("Selected day: ")}<strong>{t(selectedDay)}</strong> / 180
          </span>
        </div>

        {/* 6 Biomarker Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 mt-4">
          {t(evaluation.metrics.map((m) => {
            const Icon = METRIC_ICONS[m.key] || Activity;
            const hist = histories[m.key];
            const isSelected = m.key === activeMetric.key;

            return (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setSelectedMetricKey(m.key);
                  setHoveredPoint(null);
                }}
                className={`text-left rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? `ring-2 ring-sky-400 ${theme.cardSubtleBg}`
                    : `${theme.cardSubtleBg} opacity-90 hover:opacity-100 hover:border-sky-400/60`
                } ${m.status !== 'optimal' ? m.statusMeta.ringClass : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{t(m.label)}</div>
                      <div className="text-[10px] font-mono opacity-70">{t(m.sourceBadge)}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.statusMeta.badgeClass}`}
                  >
                    {t(m.statusMeta.label)}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-2xl font-black font-mono">{t(m.formattedValue)}</span>{t(' ')}
                    <span className={`text-xs font-semibold ${theme.textMuted}`}>{t(m.unit)}</span>
                  </div>

                  <div className={`text-[11px] font-mono flex items-center gap-1 ${theme.textSecondary}`}>
                    {t(hist.prevDelta > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : hist.prevDelta < 0 ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    ))}
                    <span>{t("vs yesterday: ")}{t(formatDelta(hist.prevDelta, m.unit))}</span>
                  </div>
                </div>

                <div className={`mt-2 pt-2 border-t ${theme.divider} flex justify-between text-[10px] font-mono ${theme.textMuted}`}>
                  <span>{t("7-day avg: ")}{t(hist.avg7d)} {t(m.unit)}</span>
                  <span>{t("30-day avg: ")}{t(hist.avg30d)} {t(m.unit)}</span>
                </div>
              </button>
            );
          }))}
        </div>
      </div>

      {/* Interactive SVG Historical Visualizer */}
      <section className={`rounded-2xl border p-5 circadian-transition ${theme.cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold">{t("Trend: ")}{t(activeMetric.label)} ({t(activeMetric.unit)})
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${activeMetric.statusMeta.badgeClass}`}
              >
                {t(activeMetric.statusMeta.label)}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-400">
                {t(activeMetric.sourceBadge)}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${theme.textMuted}`}>{t("Change vs yesterday: ")}<strong>{t(formatDelta(activeHistory.prevDelta, activeMetric.unit))}</strong>{t(" · Change vs 7-day avg: ")}<strong>{t(formatDelta(activeHistory.delta7d, activeMetric.unit))}</strong>{t(" · Change vs 30-day avg: ")}<strong>{t(formatDelta(activeHistory.delta30d, activeMetric.unit))}</strong>
            </p>
          </div>

          {/* 4 Time Filter Buttons */}
          <div className={`flex flex-wrap gap-1 p-1 rounded-xl border ${theme.cardSubtleBg}`}>
            {t(TIME_WINDOWS.map((w) => {
              const active = timeWindow === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setTimeWindow(w.id);
                    setHoveredPoint(null);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                    active ? theme.pillActive : theme.pillInactive
                  }`}
                >
                  {t(w.label)}
                </button>
              );
            }))}
          </div>
        </div>

        {/* SVG Line Chart */}
        <div className={`rounded-xl border p-3 sm:p-4 ${theme.cardSubtleBg}`}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-56 sm:h-64 overflow-visible"
            role="img"
            aria-label={t(`Historical chart of ${activeMetric.label}`)}
          >
            {/* Horizontal grid & Y axis labels */}
            {t([0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
              const val = yMin + (yMax - yMin) * (1 - tick);
              const y = PAD_T + plotH * tick;
              return (
                <g key={i}>
                  <line
                    x1={PAD_L}
                    y1={y}
                    x2={W - PAD_R}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.1"
                  />
                  <text
                    x={PAD_L - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="currentColor"
                    opacity="0.6"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {t(val.toFixed(activeMetric.decimals > 0 ? 1 : 0))}
                  </text>
                </g>
              );
            }))}

            {/* Clinical Threshold Reference Lines */}
            {t(thresholdLines.map((tl, idx) => {
              const y = toY(tl.val);
              return (
                <g key={idx}>
                  <line
                    x1={PAD_L}
                    y1={y}
                    x2={W - PAD_R}
                    y2={y}
                    stroke={tl.color}
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />
                  <text
                    x={W - PAD_R - 4}
                    y={y - 5}
                    textAnchor="end"
                    fill={tl.color}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {t(tl.label)}
                  </text>
                </g>
              );
            }))}

            {/* Future projection dashed line (in 180d mode) */}
            {t(futurePolyline && (
              <polyline
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.22"
                strokeWidth="2"
                strokeDasharray="4 4"
                points={futurePolyline}
              />
            ))}

            {/* Past / Active Polyline */}
            {t(pastPolyline && (
              <polyline
                fill="none"
                stroke={theme.chartStroke}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pastPolyline}
              />
            ))}

            {/* Interactive Data Points */}
            {t(points.map((pt, idx) => {
              const x = toX(idx);
              const y = toY(pt.value);
              const isSelectedPt = pt.day === selectedDay;
              const showDot =
                points.length <= 35 || isSelectedPt || pt.spe || hoveredPoint?.day === pt.day;
              return (
                <g key={pt.day}>
                  {/* Invisible wider hover target */}
                  <circle
                    cx={x}
                    cy={y}
                    r={points.length > 60 ? 5 : 10}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {t(showDot && (
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelectedPt ? 6 : 3.8}
                      fill={
                        isSelectedPt
                          ? activeMetric.statusMeta.hex
                          : pt.isFuture
                          ? '#64748b'
                          : theme.chartStroke
                      }
                      stroke="#ffffff"
                      strokeWidth={isSelectedPt ? '2.5' : '1.5'}
                      className="pointer-events-none"
                    />
                  ))}
                </g>
              );
            }))}

            {/* X-axis day markers */}
            {t(points.length > 0 && (
              <>
                <text
                  x={PAD_L}
                  y={H - 8}
                  fill="currentColor"
                  opacity="0.65"
                  fontSize="10"
                  fontFamily="monospace"
                >{t("Day ")}{t(points[0].day)}
                </text>
                <text
                  x={W - PAD_R}
                  y={H - 8}
                  textAnchor="end"
                  fill="currentColor"
                  opacity="0.65"
                  fontSize="10"
                  fontFamily="monospace"
                >{t("Day ")}{t(points[points.length - 1].day)}
                </text>
              </>
            ))}
          </svg>

          {/* Interactive Readout Bar */}
          <div className={`mt-2 pt-2 border-t ${theme.divider} flex flex-wrap items-center justify-between gap-2 text-xs font-mono`}>
            {t(hoveredPoint ? (
              <span>{t("Inspecting ")}<strong>{t("Day ")}{t(hoveredPoint.day)}</strong>:{t(' ')}
                <strong className="text-sky-400">
                  {t(hoveredPoint.value)} {t(activeMetric.unit)}
                </strong>{t(' ')}
                {t(hoveredPoint.isLiveOverride && '· [Live Demo Measurement]')}
                {t(hoveredPoint.spe && ' · [SPE Active]')}
                {t(!hoveredPoint.aredCompleted && ' · [No ARED]')}
              </span>
            ) : (
              <span className={theme.textMuted}>{t("Hover over the chart to inspect exact daily values.")}</span>
            ))}
            <span className={theme.textMuted}>{t("Active window: ")}{t(points.length)}{t(" point")}{t(points.length > 1 ? 's' : '')}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
