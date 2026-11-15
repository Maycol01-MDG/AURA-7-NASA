import React, { useEffect, useMemo, useState } from 'react';
import {
  Watch,
  Eye,
  Lightbulb,
  Bell,
  HeartPulse,
  Radio,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  User,
  Music,
  Calendar,
  CalendarHeart,
  Video,
  Wind,
  Volume2,
  Play,
  Pause,
  SkipForward,
  CloudRain,
  Mountain,
  Trees,
  Waves,
  Brain,
  RotateCcw,
  Send,
  Activity,
  Crown,
  Guitar,
  Siren,
  Headphones,
  AppWindow,
  Cpu,
  Home,
} from 'lucide-react';
import { resolveKbRecords } from '../../services/evaluationEngine';
import SproutBotAvatarSvg from '../copilot/SproutBotAvatarSvg';
import { useLanguage } from '../../i18n/LanguageContext';

/* ------------------------------------------------------------------ */
/* DEMO psychological profile (simulated; not sourced from audited JSON) */
/* ------------------------------------------------------------------ */
const CREW_PROFILE = {
  name: 'Cmdr. Elena Ríos',
  firstName: 'Elena',
  role: 'Commander · Mission Specialist',
  origin: 'Santiago de Chile',
  hobbies: [
    { label: 'Ajedrez', Icon: Crown },
    { label: 'Acoustic Guitar', Icon: Guitar },
    { label: 'Earth Photography', Icon: Mountain },
  ],
  playlistName: 'Earth and Roots',
  playlist: [
    { title: 'Thanks to Life', artist: 'Violeta Parra', durationSec: 268 },
    { title: 'Everything Changes', artist: 'Mercedes Sosa', durationSec: 222 },
    { title: 'Back to Seventeen', artist: 'Violeta Parra', durationSec: 255 },
  ],
  favoriteMeal: 'Corn casserole (thermostabilized reserve)',
  family: 'Tomás (husband) · Sofía (daughter)',
};

const EMOTIONAL_CALENDAR = [
  {
    day: 25,
    Icon: CalendarHeart,
    title: 'Wedding anniversary with Tomás',
    phrase: 'your wedding anniversary',
    watchText:
      'Happy anniversary, Elena! I set the dining area lights to warm mode and scheduled your favorite reserve meal for dinner.',
    action: 'Dining area lights set to warm mode and favorite meal scheduled',
  },
  {
    day: 136,
    Icon: Video,
    title: 'Your daughter Sofía’s birthday',
    phrase: 'your daughter Sofía’s birthday',
    watchText: 'It’s Sofía’s birthday today. Your video message is queued for Houston.',
    action: 'Low-bandwidth video message packaged and queued for Houston',
  },
  {
    day: 145,
    Icon: CalendarHeart,
    title: 'Your husband Tomás’s birthday',
    phrase: 'your husband’s birthday',
    watchText: 'It’s Tomás’s birthday today. I prepared your rest module and an audio channel for Houston.',
    action: 'Rest module prepared and audio channel optimized for Houston',
  },
  {
    day: 170,
    Icon: Calendar,
    title: 'Chile’s National Holidays',
    phrase: 'Chile’s National Holidays',
    watchText: 'Happy National Holidays! I added cueca music to your playlist and reserve empanadas to the menu.',
    action: 'Holiday playlist and special reserve menu',
  },
];

const AR_LANDSCAPES = [
  { id: 'andes', label: 'Andes Mountains', Icon: Mountain },
  { id: 'bosque', label: 'Valdivian Rainforest', Icon: Trees },
  { id: 'mar', label: 'Pacific Coast', Icon: Waves },
];

const STAR_FIELD = [
  [12, 14], [34, 52], [58, 22], [77, 96], [96, 38], [118, 70], [139, 18], [152, 104],
  [171, 46], [188, 84], [204, 26], [223, 62], [241, 110], [259, 34], [276, 78], [298, 20],
  [306, 58], [24, 88], [66, 116], [132, 92], [214, 98], [287, 102], [46, 30], [252, 8],
];

const BREATH_WAVE_PATH = (() => {
  let d = '';
  for (let x = 0; x <= 480; x += 4) {
    const y = 18 + 11 * Math.sin((2 * Math.PI * x) / 120);
    d += `${x === 0 ? 'M' : 'L'} ${x} ${y.toFixed(2)} `;
  }
  return d.trim();
})();

const formatClock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

/* ------------------------------------------------------------------ */
/* Presentation subcomponents                                          */
/* ------------------------------------------------------------------ */
function KbChips({ records, isDark }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {t(records.map((r) => (
        <a
          key={r.id}
          href={r.source_url}
          target="_blank"
          rel="noopener noreferrer"
          title={t(r.title)}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border hover:underline ${
            isDark
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
              : 'bg-sky-100 text-sky-900 border-sky-400/60'
          }`}
        >
          <span>{t(r.id)}</span>
          <ExternalLink className="w-2 h-2" />
        </a>
      )))}
    </div>
  );
}

function QuadrantCard({ index, title, subtitle, Icon, refs, theme, isDark, children }) {
  const { t } = useLanguage();
  return (
    <article
      className={`rounded-2xl border p-4 sm:p-5 flex flex-col gap-4 backdrop-blur-md circadian-transition ${theme.cardBg}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
              isDark ? 'text-cyan-300' : 'text-cyan-800'
            }`}
          >{t("Cuadrante ")}{t(index)}
          </div>
          <h3 className="text-sm font-extrabold flex items-center gap-2 mt-0.5">
            <Icon className={`w-4 h-4 shrink-0 ${theme.accentText}`} />
            <span>{t(title)}</span>
          </h3>
          {t(subtitle && <p className={`text-[11px] mt-0.5 ${theme.textMuted}`}>{t(subtitle)}</p>)}
        </div>
        <KbChips records={refs} isDark={isDark} />
      </header>
      {t(children)}
    </article>
  );
}

function MiniSprout({ eyeColor, sleeping = false, className = 'w-14 h-14' }) {
  const { t } = useLanguage();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M32 16 V9" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 11 Q24 3 21 9 Q22 14 32 13 Z" fill="#22c55e" />
      <path d="M32 11 Q40 3 43 9 Q42 14 32 13 Z" fill="#4ade80" />
      <rect x="13" y="16" width="38" height="30" rx="12" fill="#e2e8f0" />
      <rect x="17" y="21" width="30" height="19" rx="8" fill="#0f172a" />
      {t(sleeping ? (
        <g stroke={eyeColor} strokeWidth="1.8" fill="none" strokeLinecap="round">
          <path d="M22 30 Q26 33 30 30" />
          <path d="M34 30 Q38 33 42 30" />
        </g>
      ) : (
        <g>
          <circle cx="26" cy="29" r="3" fill={eyeColor} />
          <circle cx="38" cy="29" r="3" fill={eyeColor} />
          <path d="M28 35 Q32 38 36 35" stroke={eyeColor} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      ))}
      <rect x="22" y="47" width="20" height="10" rx="5" fill="#cbd5e1" />
    </svg>
  );
}

function ArViewportScene({ scene, shieldOn }) {
  const { t } = useLanguage();
  return (
    <svg viewBox="0 0 320 130" className="w-full h-auto block" role="img" aria-label={t("Cabin AR window")}>
      <defs>
        <linearGradient id="ami-andes-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="ami-forest-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="ami-sea-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#be185d" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="ami-sea-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e7490" />
          <stop offset="100%" stopColor="#082f49" />
        </linearGradient>
      </defs>

      {t(!shieldOn && (
        <g>
          <rect width="320" height="130" fill="#01030a" />
          {t(STAR_FIELD.map(([x, y], i) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={i % 5 === 0 ? 1.4 : 0.8}
              fill="#e2e8f0"
              className="animate-star-twinkle"
              style={{ animationDelay: `${(i % 7) * 0.4}s` }}
            />
          )))}
        </g>
      ))}

      {t(shieldOn && scene === 'andes' && (
        <g>
          <rect width="320" height="130" fill="url(#ami-andes-sky)" />
          <circle cx="240" cy="80" r="18" fill="#fef3c7" opacity="0.95" />
          <polygon
            points="0,130 0,88 40,60 75,82 115,40 150,74 190,48 230,80 270,52 320,84 320,130"
            fill="#475569"
          />
          <polygon points="105,50 115,40 126,51 118,48 111,52" fill="#f8fafc" />
          <polygon points="181,56 190,48 200,57 193,55 186,58" fill="#f8fafc" />
          <polygon points="261,60 270,52 280,61 273,58 266,62" fill="#f8fafc" />
          <polygon points="0,130 0,104 60,92 120,108 180,94 250,110 320,96 320,130" fill="#1e293b" />
        </g>
      ))}

      {t(shieldOn && scene === 'bosque' && (
        <g>
          <rect width="320" height="130" fill="url(#ami-forest-sky)" />
          <circle cx="60" cy="30" r="14" fill="#fef9c3" />
          <rect y="104" width="320" height="26" fill="#14532d" />
          {t([10, 42, 74, 106, 138, 170, 202, 234, 266, 298].map((x, i) => (
            <g key={x}>
              <rect x={x + 9} y="96" width="4" height="12" fill="#422006" />
              <polygon
                points={`${x},${100} ${x + 11},${i % 2 ? 50 : 60} ${x + 22},${100}`}
                fill={i % 3 === 0 ? '#166534' : i % 3 === 1 ? '#15803d' : '#22c55e'}
              />
            </g>
          )))}
        </g>
      ))}

      {t(shieldOn && scene === 'mar' && (
        <g>
          <rect width="320" height="130" fill="url(#ami-sea-sky)" />
          <circle cx="160" cy="84" r="22" fill="#fef3c7" />
          <rect y="84" width="320" height="46" fill="url(#ami-sea-water)" />
          {t([92, 100, 108, 116].map((y, i) => (
            <line
              key={y}
              x1={160 - (18 - i * 3)}
              y1={y}
              x2={160 + (18 - i * 3)}
              y2={y}
              stroke="#fde68a"
              strokeWidth="2"
              strokeLinecap="round"
              opacity={0.85 - i * 0.18}
            />
          )))}
        </g>
      ))}

      {/* Window frame & mullion */}
      <rect x="1.5" y="1.5" width="317" height="127" rx="14" fill="none" stroke="#94a3b8" strokeWidth="3" />
      <line x1="160" y1="2" x2="160" y2="128" stroke="#94a3b8" strokeWidth="2.5" opacity="0.8" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Module 7 · Ambient Intelligence (AmI)                                */
/* ------------------------------------------------------------------ */
export default function MultiDeviceEcosystem({
  evaluation,
  psychInference,
  selectedDay,
  circadianMode,
  knowledgeBase,
  theme,
}) {
  const { t, locale } = useLanguage();
  const isDark = theme?.isDark ?? circadianMode !== 'day';
  const { dayData, metrics, overallMeta, narrative } = evaluation;
  const day = selectedDay ?? dayData.mission_day;
  const stateId = psychInference?.stateId || 'optimal_motivated';

  const v = useMemo(() => Object.fromEntries(metrics.map((x) => [x.key, x.value])), [metrics]);
  const hr = Math.round(v.resting_heart_rate);
  const pvt = Math.round(v.pvt_reaction_ms);
  const sleep = Number(v.sleep_hours).toFixed(1);
  const co2 = Number(v.cabin_co2_mmhg).toFixed(2);
  const evarm = Number(v.cumulative_radiation_msv).toFixed(1);
  const delay = dayData.earth_comm_delay_min.toFixed(1);
  const isSpe = dayData.solar_particle_event === true;
  const hrElevated = hr > 88;
  const autoPlaylist = stateId === 'cognitive_fatigue';
  const playlist = CREW_PROFILE.playlist;
  const favorite = playlist[0];

  const [earthClock, setEarthClock] = useState(() =>
    new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  );
  const [notifFeedback, setNotifFeedback] = useState(null);
  const [toastAlert, setToastAlert] = useState(null);
  const [intervention, setIntervention] = useState(false);
  const [windowShieldManual, setWindowShieldManual] = useState(null);
  const [landscape, setLandscape] = useState('andes');
  const [evaStressSim, setEvaStressSim] = useState(false);
  const [playback, setPlayback] = useState({ trackIdx: 0, isPlaying: autoPlaylist, elapsed: 0 });

  useEffect(() => {
    setEarthClock(new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }));
    const id = setInterval(() => {
      setEarthClock(new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(id);
  }, [locale]);

  // Reset demo devices whenever the mission day (or inferred state) changes
  useEffect(() => {
    setIntervention(false);
    setWindowShieldManual(null);
    setEvaStressSim(false);
    setPlayback({ trackIdx: 0, isPlaying: autoPlaylist, elapsed: 0 });
  }, [day, autoPlaylist]);

  // Music player clock
  useEffect(() => {
    if (!playback.isPlaying) return undefined;
    const id = setInterval(() => {
      setPlayback((p) => {
        const track = playlist[p.trackIdx];
        if (p.elapsed + 1 >= track.durationSec) {
          return { ...p, trackIdx: (p.trackIdx + 1) % playlist.length, elapsed: 0 };
        }
        return { ...p, elapsed: p.elapsed + 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playback.isPlaying, playlist]);

  /* ---------- KB citations (verified IDs from unified_nasa_csa_kb.json) ---------- */
  const profileRefs = resolveKbRecords(knowledgeBase, ['HRP-RISK-012', 'HRP-RISK-019', 'HRP-HAZ-004']);
  const watchRefs = resolveKbRecords(knowledgeBase, ['HRP-RISK-012', 'HRP-RISK-014']);
  const evaRefs = resolveKbRecords(knowledgeBase, ['HRP-RISK-008', 'HRP-RISK-006', 'CSA-RAD-009']);
  const cabinRefs = resolveKbRecords(knowledgeBase, ['HRP-RISK-014', 'HRP-RISK-019', 'HRP-HAZ-003']);
  const interventionRef = resolveKbRecords(knowledgeBase, ['HRP-RISK-012'])[0];

  /* ---------- Emotional calendar ---------- */
  const todayEvent = EMOTIONAL_CALENDAR.find((e) => e.day === day) || null;
  const nextEvent = EMOTIONAL_CALENDAR.find((e) => e.day > day) || null;

  const relativeLabel = (eventDay) => {
    const diff = eventDay - day;
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'Tomorrow';
    if (diff > 1) return `In ${diff} days`;
    return `${Math.abs(diff)} days ago`;
  };

  /* ---------- Derived device states ---------- */
  const autoShield =
    intervention || stateId === 'isolation_disconnect' || stateId === 'cognitive_fatigue';
  const shieldOn = windowShieldManual ?? autoShield;
  const hapticActive = intervention || hrElevated;
  const evaStress = !isSpe && (hrElevated || evaStressSim);
  const evaHr = evaStressSim && !hrElevated ? 112 : hr;

  const stateEye = psychInference?.accentHex || '#00FF66';
  const isolationPct = psychInference?.isolationProgressPct;

  const watchBg =
    circadianMode === 'day'
      ? 'linear-gradient(160deg, #075985 0%, #0284c7 55%, #38bdf8 100%)'
      : circadianMode === 'sunset'
      ? 'linear-gradient(160deg, #431407 0%, #9a3412 55%, #f59e0b 100%)'
      : 'linear-gradient(160deg, #020617 0%, #1e1b4b 60%, #312e81 100%)';

  const watchNotification = intervention
    ? {
        title: 'Sprout-Bot · Intervention',
        text: `I prepared your rest module, ${CREW_PROFILE.firstName}. Breathe with me.`,
      }
    : todayEvent
    ? { title: todayEvent.title, text: todayEvent.watchText }
    : hrElevated
    ? { title: 'Breathe with me', text: `Pulse ${hr} bpm. Inhale for 4 s · exhale for 6 s, following the vibration.` }
    : { title: psychInference?.shortBadge || 'Sprout-Bot', text: 'Everything is in order. I’m here with you.' };

  const audioStatus = intervention
    ? {
        kind: 'music',
        label: `Rest Module: "${favorite.title}" (${favorite.artist}) at 40 dB`,
        sub: `Audio channel prioritized to Houston · ${delay} min delay`,
      }
    : stateId === 'isolation_disconnect'
    ? {
        kind: 'rain',
        label: 'Module 3: Playing Earth rain sounds',
        sub: `Soundscape at 38 dB · isolation index ${isolationPct ?? 0}%`,
      }
    : stateId === 'cognitive_fatigue'
    ? {
        kind: 'music',
        label: `Rest modules: playlist "${CREW_PROFILE.playlistName}" at 40 dB`,
        sub: `Response to PVT ${pvt} ms and ${sleep} h of sleep`,
      }
    : stateId === 'anxiety_overload'
    ? {
        kind: 'forest',
        label: 'Earth forest white noise at 35 dB',
        sub: `Autonomic stabilization · pulse ${hr} bpm`,
      }
    : stateId === 'solar_shield'
    ? {
        kind: 'alert',
        label: 'Priority ALARA alert channel',
        sub: 'Ambient audio muted during SPE shelter',
      }
    : {
        kind: 'idle',
        label: 'Nominal cabin acoustic environment',
        sub: 'No sound intervention required',
      };

  const melatoninMetric =
    circadianMode === 'day'
      ? { pct: 12, label: 'Daytime melatonin suppression (480 nm alertness)' }
      : circadianMode === 'sunset'
      ? { pct: 60, label: 'Amber transition: melatonin begins to rise (590 nm)' }
      : { pct: 95, label: 'Night protection: no blue light, melatonin preserved' };

  /* ---------- Sprout-Bot integration log (how the profile is used) ---------- */
  const integrationLog = useMemo(() => {
    const log = [];
    if (intervention) {
      log.push({
        tone: 'cyan',
        text: `Severe isolation intervention: 480 nm blue light, "${favorite.title}" at 40 dB, and audio channel prioritized to Houston.`,
        tag: 'HRP-RISK-012',
      });
    }
    if (todayEvent) {
      log.push({
        tone: 'rose',
        text: `${todayEvent.title}: ${todayEvent.action} (Earth delay ${delay} min).`,
        tag: 'HRP-RISK-019',
      });
    }
    if (stateId === 'cognitive_fatigue') {
      log.push({
        tone: 'amber',
        text: `PVT ${pvt} ms detected → Activating playlist "${CREW_PROFILE.playlistName}" at 40 dB in rest modules.`,
        tag: 'HRP-RISK-014',
      });
    }
    if (stateId === 'isolation_disconnect') {
      log.push({
        tone: 'amber',
        text: `Progressive isolation (${isolationPct ?? 0}%) → Earth rain in Module 3 and an Andean landscape in AR windows.`,
        tag: 'HRP-RISK-019',
      });
    }
    if (hrElevated) {
      log.push({
        tone: 'rose',
        text: `Pulse ${hr} bpm (> 88) → Haptic breathing guidance on the smartwatch.`,
        tag: 'HRP-RISK-012',
      });
    }
    if (stateId === 'solar_shield') {
      log.push({
        tone: 'cyan',
        text: 'SPE shelter active → I suggest a chess game in the shielded area to support morale.',
        tag: 'CSA-RAD-009',
      });
    }
    if (stateId === 'medical_assistant') {
      log.push({
        tone: 'cyan',
        text: 'Musculoskeletal deficit → Post-ARED reward: 20 minutes of acoustic guitar.',
        tag: 'HRP-RISK-009',
      });
    }
    if (stateId === 'optimal_motivated') {
      log.push({
        tone: 'emerald',
        text: 'Optimal status → I suggest 20 minutes of guitar and a photo of Earth from the cupola.',
        tag: 'HRP-RISK-012',
      });
    }
    log.push({
      tone: 'slate',
      text: `Emotional memory loaded: ${CREW_PROFILE.hobbies.length} hobbies, playlist "${CREW_PROFILE.playlistName}", and ${EMOTIONAL_CALENDAR.length} important dates.`,
      tag: 'Demo Profile',
    });
    return log;
  }, [intervention, todayEvent, stateId, pvt, delay, isolationPct, hrElevated, hr, favorite.title]);

  const toneCls = (tone) => {
    const map = {
      cyan: isDark ? 'border-cyan-400/40 text-cyan-200' : 'border-cyan-500/50 text-cyan-900',
      rose: isDark ? 'border-rose-400/40 text-rose-200' : 'border-rose-500/50 text-rose-900',
      amber: isDark ? 'border-amber-400/40 text-amber-200' : 'border-amber-500/50 text-amber-900',
      emerald: isDark ? 'border-emerald-400/40 text-emerald-200' : 'border-emerald-500/50 text-emerald-900',
      slate: isDark ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-700',
    };
    return map[tone] || map.slate;
  };

  /* ---------- Actions ---------- */
  const handleToggleIntervention = () => {
    if (intervention) {
      setIntervention(false);
      setWindowShieldManual(null);
      setPlayback({ trackIdx: 0, isPlaying: autoPlaylist, elapsed: 0 });
      return;
    }
    setIntervention(true);
    setWindowShieldManual(null);
    setPlayback({ trackIdx: 0, isPlaying: true, elapsed: 0 });
  };

  const interventionMessage = `Cmdr. ${CREW_PROFILE.firstName}, I know we’ve been away from home for ${day} days and ${
    todayEvent ? `today is ${todayEvent.phrase}` : 'I know how much you miss Tomás and Sofía'
  }. I’ve prepared the rest module with your music, warm light, and an audio channel optimized for Houston. Take your time.`;

  const triggerNativeNotification = async () => {
    const title = `AURA-7 · Day ${dayData.mission_day} (${overallMeta.label})`;
    const body = `${narrative.toneLabel}: HR ${hr} bpm · CO₂ ${co2} mmHg · PVT ${pvt} ms.`;
    setToastAlert({ title, body, time: new Date().toLocaleTimeString(locale) });

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifFeedback('Alert synced to console (Notification API unavailable).');
      return;
    }
    try {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission === 'granted') {
        new Notification(t(title), { body: t(body), lang: document.documentElement.lang, tag: 'aura7-ecosystem-alert' });
        setNotifFeedback('Native browser notification sent and synced to the watch.');
      } else {
        setNotifFeedback('Notification permission denied; alert shown in the console.');
      }
    } catch {
      setNotifFeedback('Alert shown on the console and devices.');
    }
  };

  const currentTrack = playlist[playback.trackIdx];
  const progressPct = Math.min(100, (playback.elapsed / currentTrack.durationSec) * 100);

  const interventionSteps = [
    { Icon: Watch, label: 'Smartwatch: gentle haptic vibration' },
    { Icon: Lightbulb, label: 'Cabin: blue-light therapy (480 nm)' },
    { Icon: Music, label: `Audio: "${favorite.title}" iniciando` },
    { Icon: Sparkles, label: 'Sprout-Bot: empathetic message' },
  ];

  return (
    <div className="space-y-5">
      {/* ================= HEADER ================= */}
      <section
        className={`rounded-2xl border p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 circadian-transition ${theme.cardBg}`}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Cpu className={`w-5 h-5 ${theme.accentText}`} />
            <h2 className="text-lg font-extrabold">{t("Ambient Intelligence (AmI) · AURA-7 v2.4")}</h2>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                isDark
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40'
                  : 'bg-cyan-100 text-cyan-900 border-cyan-500/50'
              }`}
            >{t("Spacecraft IoT · D")}{t(day)} · {t(psychInference?.shortBadge || 'Nominal')}
            </span>
          </div>
          <p className={`text-xs mt-1 ${theme.textMuted}`}>{t("Sprout-Bot coordinates the smartwatch, EVA helmet, lighting, audio, and AR windows using your telemetry and emotional memory to combat isolation.")}</p>
        </div>

        <button
          type="button"
          onClick={triggerNativeNotification}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition shrink-0 ${theme.accentBg}`}
        >
          <Bell className="w-4 h-4" />
          <span>{t("Send Native Notification (Notification API)")}</span>
        </button>
      </section>

      {t(notifFeedback && (
        <div className={`rounded-xl border px-4 py-2.5 text-xs flex items-center gap-2 ${theme.cardSubtleBg}`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{t(notifFeedback)}</span>
        </div>
      ))}

      {t(toastAlert && (
        <div className="rounded-xl border border-sky-400/50 bg-slate-950 text-slate-100 p-4 shadow-xl flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-sky-300">
                {t(toastAlert.title)} <span className="font-mono text-[10px] opacity-60">{t(toastAlert.time)}</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{t(toastAlert.body)}</p>
            </div>
          </div>
          <button type="button" onClick={() => setToastAlert(null)} className="text-xs text-slate-400 hover:text-white">{t("Close")}</button>
        </div>
      ))}

      {/* ================= WOW: SEVERE ISOLATION INTERVENTION ================= */}
      <section
        className={`rounded-2xl border p-5 relative overflow-hidden circadian-transition ${theme.cardBg}`}
        style={intervention ? { boxShadow: '0 0 0 2px rgba(56,189,248,0.55), 0 0 40px rgba(59,130,246,0.25)' } : undefined}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <button
            type="button"
            onClick={handleToggleIntervention}
            className={`inline-flex items-center justify-center gap-3 px-6 sm:px-10 py-4 rounded-2xl text-sm sm:text-base font-black tracking-tight border-2 transition shadow-xl hover:scale-[1.02] ${
              intervention
                ? isDark
                  ? 'bg-slate-900 text-amber-200 border-amber-400/70'
                  : 'bg-white text-amber-900 border-amber-500'
                : 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white border-sky-300 shadow-blue-500/30'
            }`}
          >
            {t(intervention ? <RotateCcw className="w-5 h-5" /> : <Siren className="w-5 h-5" />)}
            <span>{t(intervention ? 'End Intervention and Restore Cabin' : 'Simulate Severe Isolation Intervention')}</span>
          </button>
          <p className={`text-[11px] max-w-2xl ${theme.textMuted}`}>{t("Demo: one trigger coordinates the watch, lights, audio, and Sprout-Bot. It does not modify the audited JSON; everything stays in Module 7’s local state.")}</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full max-w-4xl">
            {t(interventionSteps.map(({ Icon, label }, i) => (
              <div
                key={label}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-semibold text-left transition-all duration-500 ${
                  intervention
                    ? isDark
                      ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200'
                      : 'bg-emerald-50 border-emerald-500/50 text-emerald-900'
                    : `${theme.cardSubtleBg} opacity-70`
                }`}
                style={{ transitionDelay: intervention ? `${i * 120}ms` : '0ms' }}
              >
                {t(intervention ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <Icon className="w-4 h-4 shrink-0" />
                ))}
                <span>
                  {t(i + 1)}. {t(label)}
                </span>
              </div>
            )))}
          </div>
        </div>

        {t(intervention && (
          <div
            className={`animate-bubble-in mt-5 mx-auto max-w-3xl rounded-2xl border p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 ${
              isDark ? 'bg-slate-950/85 border-sky-500/40 text-slate-100' : 'bg-white border-sky-300 text-slate-900'
            }`}
          >
            <SproutBotAvatarSvg
              visualExpression="worried_empathetic"
              circadianMode={circadianMode}
              earthCommDelayMin={dayData.earth_comm_delay_min}
              isDark={isDark}
              compact
              className="w-24 h-24 shrink-0"
            />
            <div className="space-y-2.5 min-w-0">
              <div className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{t("Sprout-Bot · Autonomous Psychosocial Intervention")}</div>
              <p className="text-sm sm:text-base font-bold leading-snug">“{t(interventionMessage)}”</p>
              {t(interventionRef && (
                <a
                  href={interventionRef.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition ${
                    isDark
                      ? 'bg-slate-900/80 border-cyan-500/35 text-cyan-300 hover:border-cyan-400'
                      : 'bg-cyan-50 border-cyan-300 text-cyan-900 hover:border-cyan-500'
                  }`}
                >
                  <span>{t("Based on: ")}{t(interventionRef.id)} ({t(interventionRef.title)})
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ================= 4 QUADRANTS ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ---------- 1. Psychological Profile & Emotional Memory ---------- */}
        <QuadrantCard
          index={1}
          title={t("Psychological Profile and Emotional Memory")}
          subtitle="The crew member’s “soul” that Sprout-Bot uses to empathize"
          Icon={User}
          refs={profileRefs}
          theme={theme}
          isDark={isDark}
        >
          <div className={`rounded-xl border p-3 flex items-center gap-3 ${theme.cardSubtleBg}`}>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
            >{t("ER")}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold">{t(CREW_PROFILE.name)}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                    isDark ? 'border-slate-600 text-slate-400' : 'border-slate-300 text-slate-600'
                  }`}
                >{t("Simulated Demo Profile")}</span>
              </div>
              <div className={`text-[11px] ${theme.textMuted}`}>
                {t(CREW_PROFILE.role)} · {t(CREW_PROFILE.origin)}
              </div>
              <div className={`text-[11px] ${theme.textMuted}`}>{t("Family: ")}{t(CREW_PROFILE.family)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`rounded-xl border p-3 space-y-2 ${theme.cardSubtleBg}`}>
              <div className={`text-[10px] font-mono font-bold uppercase ${theme.textMuted}`}>{t("Hobbies")}</div>
              <div className="flex flex-wrap gap-1.5">
                {t(CREW_PROFILE.hobbies.map(({ label, Icon }) => (
                  <span
                    key={label}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold ${
                      isDark ? 'border-slate-600 bg-slate-900/50' : 'border-slate-300 bg-white'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {t(label)}
                  </span>
                )))}
              </div>
              <div className={`text-[10px] font-mono font-bold uppercase pt-1 ${theme.textMuted}`}>{t("Favorite Playlist")}</div>
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <Headphones className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`} />
                <span>
                  “{t(CREW_PROFILE.playlistName)}” · {t(playlist.length)}{t(" tracks")}</span>
              </div>
              <div className={`text-[10px] ${theme.textMuted}`}>{t("Favorite Meal: ")}{t(CREW_PROFILE.favoriteMeal)}</div>
            </div>

            {/* Emotional Calendar */}
            <div className={`rounded-xl border p-3 space-y-2 ${theme.cardSubtleBg}`}>
              <div className={`text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${theme.textMuted}`}>
                <Calendar className="w-3 h-3" />{t(" Emotional Calendar · Important Dates")}</div>
              <ul className="space-y-1.5">
                {t(EMOTIONAL_CALENDAR.map((ev) => {
                  const isToday = ev.day === day;
                  const isNext = nextEvent && ev.day === nextEvent.day && !todayEvent;
                  return (
                    <li
                      key={ev.day}
                      className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg border text-[11px] ${
                        isToday
                          ? isDark
                            ? 'border-rose-400/60 bg-rose-500/15 text-rose-100'
                            : 'border-rose-400 bg-rose-50 text-rose-900'
                          : isNext
                          ? isDark
                            ? 'border-amber-400/40 text-amber-200'
                            : 'border-amber-400/60 text-amber-900'
                          : `${isDark ? 'border-slate-700' : 'border-slate-200'} ${ev.day < day ? 'opacity-55' : ''}`
                      }`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <ev.Icon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{t("D")}{t(ev.day)} · {t(ev.title)}
                        </span>
                      </span>
                      <span className="font-mono font-bold text-[10px] shrink-0">{t(relativeLabel(ev.day))}</span>
                    </li>
                  );
                }))}
              </ul>
            </div>
          </div>

          {t(todayEvent && (
            <div
              className={`rounded-xl border p-3 flex items-start gap-2.5 text-[11px] leading-relaxed ${
                isDark ? 'border-rose-400/50 bg-rose-500/10 text-rose-100' : 'border-rose-400 bg-rose-50 text-rose-900'
              }`}
            >
              <Send className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>{t("Today: ")}{t(todayEvent.title)}.</strong>{t(" Sprout-Bot pre-packaged a low-bandwidth video message and queued it for the next link window with Houston, accounting for the")}{t(' ')}
                <strong>{t(delay)}{t(" min")}</strong>.
              </span>
            </div>
          ))}

          {/* Integration log */}
          <div className="space-y-1.5">
            <div className={`text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${theme.textMuted}`}>
              <Brain className="w-3 h-3" />{t(" Sprout-Bot Profile Usage Log")}</div>
            <ul className="space-y-1">
              {t(integrationLog.map((entry) => (
                <li
                  key={entry.text}
                  className={`flex items-start justify-between gap-2 pl-2.5 border-l-2 text-[11px] leading-snug ${toneCls(entry.tone)}`}
                >
                  <span className="font-mono">› {t(entry.text)}</span>
                  <span className="text-[9px] font-mono font-bold opacity-75 shrink-0">{t(entry.tag)}</span>
                </li>
              )))}
            </ul>
          </div>
        </QuadrantCard>

        {/* ---------- 2. Smartwatch ---------- */}
        <QuadrantCard
          index={2}
          title={t("Smartwatch · Tactile and Haptic Companion")}
          subtitle="Watch face synchronized to the Earth circadian cycle with human interaction"
          Icon={Watch}
          refs={watchRefs}
          theme={theme}
          isDark={isDark}
        >
          <div className="flex flex-col items-center py-2">
            <div className="relative flex items-center justify-center w-72 h-[19rem]">
              {/* Haptic ripple waves */}
              {t(hapticActive &&
                [0, 0.85, 1.7].map((delaySec) => (
                  <span
                    key={delaySec}
                    className="absolute w-56 h-64 rounded-[2.6rem] border-2 border-sky-400/70 animate-haptic-ripple pointer-events-none"
                    style={{ animationDelay: `${delaySec}s` }}
                  />
                )))}

              <div className={`relative flex flex-col items-center ${hapticActive ? 'animate-watch-buzz' : ''}`}>
                <div className="w-24 h-5 rounded-t-xl bg-slate-800 border-x border-t border-slate-700" />
                <div
                  className="w-52 h-60 rounded-[2.2rem] border-4 border-slate-700 p-3.5 shadow-2xl relative flex flex-col justify-between text-white overflow-hidden transition-all duration-700"
                  style={{ background: watchBg, boxShadow: `0 0 28px ${stateEye}40` }}
                >
                  <div className="absolute -right-2.5 top-16 w-2 h-8 rounded-r bg-slate-600" />
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/80">
                    <span>{t("EARTH ")}{t(earthClock)}</span>
                    <span className="font-bold">{t("D")}{t(day)}</span>
                  </div>

                  <div className="flex flex-col items-center -mt-1">
                    <div className="w-16 h-16 rounded-full bg-black/25 border border-white/25 flex items-center justify-center">
                      <MiniSprout
                        eyeColor={stateEye}
                        sleeping={circadianMode === 'night' && stateId === 'optimal_motivated' && !intervention}
                        className="w-12 h-12"
                      />
                    </div>
                  </div>

                  {/* Notification */}
                  <div className="rounded-xl bg-black/45 border border-white/15 px-2 py-1.5 backdrop-blur-sm">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-amber-200 truncate">
                      {t(watchNotification.title)}
                    </div>
                    <p className="text-[10px] leading-snug text-white/95 line-clamp-3">{t(watchNotification.text)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-center text-[10px] font-mono bg-black/35 rounded-xl p-1 border border-white/10">
                    <div className={hrElevated ? 'text-rose-300 font-bold' : 'text-white'}>
                      <span className="inline-flex items-center gap-1">
                        <HeartPulse className="w-3 h-3" /> {t(hr)}{t(" BPM")}</span>
                    </div>
                    <div className="text-white">{t(pvt)}{t(" ms PVT")}</div>
                  </div>
                </div>
                <div className="w-24 h-5 rounded-b-xl bg-slate-800 border-x border-b border-slate-700" />
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl border p-3 text-[11px] flex items-start gap-2 ${
              hapticActive
                ? isDark
                  ? 'border-sky-400/50 bg-sky-500/10 text-sky-100'
                  : 'border-sky-400 bg-sky-50 text-sky-900'
                : theme.cardSubtleBg
            }`}
          >
            <Activity className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {t(hapticActive
                ? hrElevated
                  ? `Haptic feedback active: resting pulse (${hr} bpm) exceeds 88 bpm. Gentle vibrations guide slow breathing (inhale 4 s · exhale 6 s).`
                  : 'Haptic feedback active: gentle supportive vibration during the intervention.'
                : `Haptics idle. Activates automatically if resting pulse exceeds 88 bpm (today: ${hr} bpm).`)}
            </span>
          </div>
        </QuadrantCard>

        {/* ---------- 3. EVA Helmet HUD ---------- */}
        <QuadrantCard
          index={3}
          title={t("EVA Helmet HUD · Psychological Augmented Reality")}
          subtitle="The visor is the mission’s highest-stress environment"
          Icon={Eye}
          refs={evaRefs}
          theme={theme}
          isDark={isDark}
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEvaStressSim((s) => !s)}
              disabled={isSpe}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition ${
                isSpe
                  ? 'opacity-40 cursor-not-allowed border-slate-500/30'
                  : evaStressSim
                  ? isDark
                    ? 'bg-rose-500/20 text-rose-200 border-rose-400/60'
                    : 'bg-rose-600 text-white border-rose-700'
                  : isDark
                  ? 'bg-slate-900/60 text-slate-200 border-slate-600 hover:border-rose-400'
                  : 'bg-white text-slate-800 border-slate-300 hover:border-rose-500'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>{t(evaStressSim ? 'Stop Stress Simulation' : 'Simulate EVA Stress Spike')}</span>
            </button>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-[46%/38%] p-2.5 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 shadow-2xl">
              <div className="relative rounded-[44%/36%] overflow-hidden bg-gradient-to-b from-[#040916] via-[#08142b] to-[#020611] text-cyan-200 px-8 sm:px-10 py-7 min-h-[290px] flex flex-col justify-between">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_15%,rgba(186,230,253,0.18),transparent_55%)]" />

                {/* Survival metrics */}
                <div className="relative z-10 grid grid-cols-3 gap-1 text-[10px] font-mono text-center border-b border-cyan-500/25 pb-2">
                  <div>
                    <div className="text-cyan-400/80">{t("PRESSURE")}</div>
                    <div className="font-bold text-white">{t("29.6 kPa")}</div>
                  </div>
                  <div>
                    <div className="text-cyan-400/80">{t("CO₂")}</div>
                    <div className={`font-bold ${Number(co2) > 3.5 ? 'text-rose-400' : 'text-emerald-400'}`}>{t(co2)}{t(" mmHg")}</div>
                  </div>
                  <div>
                    <div className="text-cyan-400/80">{t("EVARM")}</div>
                    <div className="font-bold text-white">{t(evarm)}{t(" mSv")}</div>
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between text-[10px] font-mono mt-1.5">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3" /> +{t(delay)}{t(" min to Earth")}</span>
                  <span className={evaStress ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{t("HR ")}{t(evaHr)}{t(" bpm")}{t(evaStressSim && !hrElevated ? ' (sim)' : '')}
                  </span>
                  <span className={evaStress ? 'text-amber-300 font-bold' : 'text-cyan-300'}>{t("O₂ ")}{t(evaStress ? '+15%' : 'nominal')}
                  </span>
                </div>

                {/* Center psychological assistance */}
                <div className="relative z-10 my-2 flex flex-col items-center text-center gap-2">
                  {t(isSpe ? (
                    <div className="px-3 py-2 rounded-xl bg-rose-600/30 border border-rose-400 text-rose-100 animate-pulse space-y-1">
                      <div className="flex items-center justify-center gap-1 text-xs font-black">
                        <ShieldAlert className="w-4 h-4" />
                        <span>{t("EVA SUSPENDED (SPE · ALARA)")}</span>
                      </div>
                      <div className="text-[10px] font-mono">{t("Neutrons: ")}{t(dayData.metrics.daily_neutron_msv.toFixed(2))}{t(" mSv/d · Return to shielded area")}</div>
                    </div>
                  ) : evaStress ? (
                    <>
                      <div className="relative w-14 h-14 flex items-center justify-center">
                        <span className="absolute inset-0 rounded-full bg-sky-400/25 border border-sky-300/60 animate-breathe" />
                        <Wind className="w-5 h-5 text-sky-200 relative" />
                      </div>
                      <p className="text-[11px] font-semibold text-white leading-snug max-w-xs">{t("Elevated heart rate. Increasing O₂ flow to 15%. Playing Earth forest white noise for stabilization. Breathe with me...")}</p>
                    </>
                  ) : (
                    <div className="px-4 py-2.5 rounded-xl border border-dashed border-cyan-400/40 bg-cyan-500/5 space-y-1">
                      <div className="text-[10px] font-mono text-cyan-400">{t("PREBREATHE & LIFE SUPPORT OK")}</div>
                      <div className="text-xs font-bold text-white">{t("VISOR WITHIN NOMINAL RANGE")}</div>
                      <div className="text-[10px] font-mono text-cyan-300">{t("Sprout-Bot silently monitoring your stress")}</div>
                    </div>
                  ))}
                </div>

                {/* Breathing wave */}
                <div className="relative z-10 h-9 overflow-hidden border-t border-cyan-500/25 pt-1">
                  <svg viewBox="0 0 240 36" className="w-full h-full" preserveAspectRatio="none">
                    <g className={evaStress ? 'animate-breath-wave' : ''}>
                      <path
                        d={BREATH_WAVE_PATH}
                        fill="none"
                        stroke={evaStress ? '#7dd3fc' : '#22d3ee'}
                        strokeOpacity={evaStress ? 0.95 : 0.35}
                        strokeWidth="2"
                      />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <p className={`text-[11px] ${theme.textMuted}`}>{t("Reference suit pressure; CO₂, EVARM, and pulse values come from Day ")}{t(day)}{t(" telemetry. The calming message appears if pulse exceeds 88 bpm or when simulating a stress spike.")}</p>
        </QuadrantCard>

        {/* ---------- 4. Smart Cabin ---------- */}
        <QuadrantCard
          index={4}
          title={t("Smart Cabin · Lights, Audio & AR Windows")}
          subtitle="Space “Smart Home” managed by Sprout-Bot to counter confinement"
          Icon={Home}
          refs={cabinRefs}
          theme={theme}
          isDark={isDark}
        >
          {/* LED */}
          <div className={`rounded-xl border p-3 space-y-2.5 ${theme.cardSubtleBg}`}>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="flex items-center gap-1 font-bold">
                <Lightbulb className="w-3.5 h-3.5" />{t(" LED Lighting")}</span>
              <span className="font-bold">{t(intervention ? '480 nm · 6500 K' : `${theme.spectrumLabel} · ${theme.kelvin}`)}</span>
            </div>
            <div
              className={`h-12 rounded-xl border border-white/30 flex items-center justify-center transition-all duration-700 bg-gradient-to-r ${
                intervention ? 'from-sky-300 via-blue-500 to-indigo-500' : theme.ledSwatch
              }`}
              style={{
                boxShadow: intervention ? '0 0 30px rgba(59,130,246,0.6)' : theme.ledGlowShadow,
              }}
            >
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-black/55 text-white">
                {t(intervention ? 'Blue-Light Therapy (480 nm) · Shared Cabin' : `${theme.label} (${theme.windowLabel})`)}
              </span>
            </div>
            {t(intervention && (
              <div className={`text-[11px] ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>{t("Rest module: warm light 2700 K. Blue-light session for 20 min; afterward, I’ll return to the circadian spectrum to protect your melatonin.")}</div>
            ))}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold">
                <span>{t("Nighttime Melatonin Index")}</span>
                <span className="font-mono">{t(melatoninMetric.pct)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-500/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all duration-700"
                  style={{ width: `${melatoninMetric.pct}%` }}
                />
              </div>
              <p className={`text-[10px] ${theme.textMuted}`}>
                {t(melatoninMetric.label)}{t(". The Earth lighting cycle counteracts 16 orbital sunrises per day (HRP-RISK-014).")}</p>
            </div>
          </div>

          {/* Audio */}
          <div className={`rounded-xl border p-3 space-y-2.5 ${theme.cardSubtleBg}`}>
            <div className="flex items-start gap-2">
              <div
                className={`relative w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
                  isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-300'
                }`}
              >
                {t(audioStatus.kind === 'rain' ? (
                  <>
                    <CloudRain className={`w-4 h-4 ${isDark ? 'text-sky-300' : 'text-sky-700'}`} />
                    {t([6, 14, 22, 30].map((x, i) => (
                      <span
                        key={x}
                        className="absolute top-0 w-px h-2 bg-sky-400 animate-rain-drop"
                        style={{ left: `${x}px`, animationDelay: `${i * 0.25}s` }}
                      />
                    )))}
                  </>
                ) : audioStatus.kind === 'forest' ? (
                  <Trees className={`w-4 h-4 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`} />
                ) : audioStatus.kind === 'alert' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className={`w-4 h-4 ${theme.accentText}`} />
                ))}
              </div>
              <div className="min-w-0">
                <div className={`text-[10px] font-mono font-bold uppercase ${theme.textMuted}`}>{t("Cabin Audio System")}</div>
                <div className="text-[12px] font-bold leading-snug">{t(audioStatus.label)}</div>
                <div className={`text-[10px] ${theme.textMuted}`}>{t(audioStatus.sub)}</div>
              </div>
            </div>

            {/* Music player */}
            <div
              className={`rounded-xl border p-2.5 flex items-center gap-3 ${
                isDark ? 'bg-slate-950/70 border-slate-700' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-amber-500 flex items-end justify-center gap-0.5 p-1.5 shrink-0">
                {t([0, 0.2, 0.4, 0.1, 0.3].map((d, i) => (
                  <span
                    key={i}
                    className={`w-1 h-full rounded-sm bg-white/90 ${playback.isPlaying ? 'animate-eq-bar' : ''}`}
                    style={{ animationDelay: `${d}s`, transform: playback.isPlaying ? undefined : 'scaleY(0.3)', transformOrigin: 'bottom' }}
                  />
                )))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-extrabold truncate">
                  {t(currentTrack.title)} <span className={`font-medium ${theme.textMuted}`}>· {t(currentTrack.artist)}</span>
                </div>
                <div className={`text-[10px] font-mono ${theme.textMuted}`}>{t("Playlist “")}{t(CREW_PROFILE.playlistName)}” · {t(playback.isPlaying ? 'Playing at 40 dB' : 'Paused')}
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-500/25 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className={`flex justify-between text-[9px] font-mono mt-0.5 ${theme.textMuted}`}>
                  <span>{t(formatClock(playback.elapsed))}</span>
                  <span>{t(formatClock(currentTrack.durationSec))}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setPlayback((p) => ({ ...p, isPlaying: !p.isPlaying }))}
                  aria-label={t(playback.isPlaying ? 'Pause' : 'Play')}
                  className={`p-1.5 rounded-full border transition ${
                    isDark ? 'border-slate-600 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {t(playback.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />)}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPlayback((p) => ({ ...p, trackIdx: (p.trackIdx + 1) % playlist.length, elapsed: 0 }))
                  }
                  aria-label={t("Next track")}
                  className={`p-1.5 rounded-full border transition ${
                    isDark ? 'border-slate-600 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* AR Viewports */}
          <div className={`rounded-xl border p-3 space-y-2.5 ${theme.cardSubtleBg}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold">
                <AppWindow className="w-3.5 h-3.5" />{t(" Augmented Reality Windows (OLED)")}</span>
              <button
                type="button"
                onClick={() => setWindowShieldManual(!shieldOn)}
                role="switch"
                aria-checked={shieldOn}
                className="inline-flex items-center gap-2 text-[11px] font-bold"
              >
                <span>{t("Window Shield")}</span>
                <span
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    shieldOn ? 'bg-emerald-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      shieldOn ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>
            </div>

            <div className="rounded-xl overflow-hidden">
              <ArViewportScene scene={landscape} shieldOn={shieldOn} />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {t(AR_LANDSCAPES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setLandscape(id);
                    setWindowShieldManual(true);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition ${
                    shieldOn && landscape === id
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60'
                        : 'bg-emerald-600 text-white border-emerald-700'
                      : isDark
                      ? 'border-slate-600 hover:border-emerald-400'
                      : 'border-slate-300 hover:border-emerald-500'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {t(label)}
                </button>
              )))}
            </div>

            <p className={`text-[10px] leading-relaxed ${theme.textMuted}`}>
              {t(shieldOn
                ? `Projecting a familiar Earth landscape${
                    windowShieldManual === null ? ' (automatically activated by Sprout-Bot)' : ''
                  } to ease homesickness and confinement (HRP-RISK-019).`
                : 'Direct view of deep space. Sprout-Bot activates the shield when it detects isolation, fatigue, or homesickness.')}
            </p>
          </div>
        </QuadrantCard>
      </div>
    </div>
  );
}
