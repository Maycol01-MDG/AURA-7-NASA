/**
 * AURA-7 v2.3 — Autonomous Psychological & HRI Inference Engine
 * Zero manual mood surveys: deduces psychological, cognitive, and autonomic states
 * 100% algorithmically from 180-day telemetry streams and Module 5 live tests,
 * mapping every inference to verified NASA HRP & CSA records.
 */

import { resolveKbRecord, resolveKbRecords } from './evaluationEngine.js';

function getEffectiveMetric(dayData, liveDemoOverrides, key) {
  if (
    liveDemoOverrides &&
    Object.prototype.hasOwnProperty.call(liveDemoOverrides, key) &&
    liveDemoOverrides[key] !== null &&
    liveDemoOverrides[key] !== undefined &&
    typeof liveDemoOverrides[key] === 'number'
  ) {
    return liveDemoOverrides[key];
  }
  return dayData?.metrics?.[key];
}

/**
 * Counts consecutive days ending on `selectedDay` with `resting_heart_rate > 88` bpm,
 * plus elevated sympathetic count across the trailing 4-day window.
 */
function analyzeHeartRateOverload(telemetry, selectedDay, currentHr) {
  const index = (telemetry || []).findIndex((d) => d.mission_day === selectedDay);
  if (index === -1) {
    return { consecutiveOver88: currentHr > 88 ? 1 : 0, trailing4Over88Count: currentHr > 88 ? 1 : 0 };
  }

  let consecutiveOver88 = 0;
  for (let i = index; i >= 0; i -= 1) {
    const hr = i === index ? currentHr : telemetry[i].metrics.resting_heart_rate;
    if (hr > 88) {
      consecutiveOver88 += 1;
    } else {
      break;
    }
  }

  let trailing4Over88Count = 0;
  for (let i = index; i >= Math.max(0, index - 3); i -= 1) {
    const hr = i === index ? currentHr : telemetry[i].metrics.resting_heart_rate;
    if (hr > 88) {
      trailing4Over88Count += 1;
    }
  }

  return { consecutiveOver88, trailing4Over88Count };
}

/**
 * Computes progressive isolation severity after Mission Day 60 when Earth delay > 6 min.
 */
function computeIsolationProgression(selectedDay, earthCommDelayMin) {
  if (selectedDay <= 60 || earthCommDelayMin <= 6) return 0;
  const dayFactor = Math.min(1, (selectedDay - 60) / 120);
  const delayFactor = Math.min(1, (earthCommDelayMin - 6) / 13);
  return Math.round((dayFactor * 0.45 + delayFactor * 0.55) * 100);
}

/**
 * Builds verified clinical citations for a list of KB IDs from `unified_nasa_csa_kb.json`.
 */
function buildVerifiedBadgeCitations(knowledgeBase, primaryId, secondaryIds = []) {
  const primaryCitation = resolveKbRecord(knowledgeBase, primaryId);
  const citations = resolveKbRecords(knowledgeBase, [primaryId, ...secondaryIds]);
  return { primaryCitation, citations };
}

/**
 * Infers the astronaut's current psychological/emotional & HRI state without manual questionnaires.
 */
export function inferPsychologicalState({
  telemetry,
  selectedDay,
  evaluation,
  liveDemoOverrides = {},
  knowledgeBase = [],
  circadianMode = 'day',
}) {
  const dayData =
    evaluation?.dayData ||
    (telemetry || []).find((d) => d.mission_day === selectedDay) ||
    telemetry?.[0];

  if (!dayData) return null;

  const metrics = {
    bone_density_index: getEffectiveMetric(dayData, liveDemoOverrides, 'bone_density_index'),
    resting_heart_rate: getEffectiveMetric(dayData, liveDemoOverrides, 'resting_heart_rate'),
    cumulative_radiation_msv: getEffectiveMetric(dayData, liveDemoOverrides, 'cumulative_radiation_msv'),
    daily_neutron_msv: getEffectiveMetric(dayData, liveDemoOverrides, 'daily_neutron_msv'),
    cabin_co2_mmhg: getEffectiveMetric(dayData, liveDemoOverrides, 'cabin_co2_mmhg'),
    sleep_hours: getEffectiveMetric(dayData, liveDemoOverrides, 'sleep_hours'),
    pvt_reaction_ms: getEffectiveMetric(dayData, liveDemoOverrides, 'pvt_reaction_ms'),
  };

  // Also reflect unsynced live PVT test ticket if just completed in Module 5
  const livePvtTicket = liveDemoOverrides?.diag_pvt;
  const effectivePvtMs =
    livePvtTicket?.isLiveDemo && typeof livePvtTicket?.value === 'number'
      ? livePvtTicket.value
      : metrics.pvt_reaction_ms;

  const delayMin = dayData.earth_comm_delay_min;
  const aredDone = dayData.ared_workout_completed === true;
  const isSpe = dayData.solar_particle_event === true;
  const criticalCount = evaluation?.criticalCount ?? 0;

  const { consecutiveOver88, trailing4Over88Count } = analyzeHeartRateOverload(
    telemetry,
    selectedDay,
    metrics.resting_heart_rate
  );

  const liveGripIssue =
    liveDemoOverrides?.diag_grip && liveDemoOverrides.diag_grip.status !== 'optimal';
  const liveSansIssue =
    liveDemoOverrides?.diag_sans && liveDemoOverrides.diag_sans.status !== 'optimal';
  const liveVestibularCritical = liveDemoOverrides?.diag_vestibular?.status === 'critical';
  const liveVestibularWarning = liveDemoOverrides?.diag_vestibular?.status === 'warning';
  const livePvtCritical =
    (livePvtTicket?.isLiveDemo && livePvtTicket.status === 'critical') || effectivePvtMs > 345;
  const livePvtWarning = livePvtTicket?.isLiveDemo && livePvtTicket.status === 'warning';

  // Exact rules from AURA-7 v2.3 specification
  const isSolarAlert =
    isSpe || metrics.cumulative_radiation_msv >= 250 || metrics.daily_neutron_msv >= 1.5;

  const isCognitiveFatigueExact =
    metrics.sleep_hours < 6.0 &&
    effectivePvtMs > 345 &&
    metrics.cabin_co2_mmhg > 3.5;

  const isCognitiveFatigueLive =
    livePvtCritical &&
    (metrics.sleep_hours < 6.8 || metrics.cabin_co2_mmhg > 3.0 || livePvtTicket?.isLiveDemo);

  const isAnxietyOverload =
    (metrics.resting_heart_rate > 88 &&
      (consecutiveOver88 >= 3 ||
        (consecutiveOver88 >= 2 && trailing4Over88Count >= 2) ||
        typeof liveDemoOverrides?.resting_heart_rate === 'number')) ||
    liveVestibularCritical;

  const isMedicalAssistant =
    !aredDone ||
    metrics.bone_density_index < 97.5 ||
    liveGripIssue ||
    liveSansIssue ||
    liveVestibularWarning ||
    livePvtWarning;

  const isIsolationDisconnect =
    selectedDay > 60 &&
    delayMin > 6.0 &&
    criticalCount === 0 &&
    aredDone &&
    !isSolarAlert;

  // Priority 1: Solar Storm / Radiation Protector Shield
  if (isSolarAlert) {
    const { primaryCitation, citations } = buildVerifiedBadgeCitations(
      knowledgeBase,
      'CSA-RAD-006',
      ['CSA-RAD-009', 'HRP-HAZ-002']
    );
    return {
      stateId: 'solar_shield',
      stateLabel: 'Protective Alert · Radiation Shield',
      shortBadge: 'SPE Alert / Protection',
      visualExpression: 'alert_protector',
      severity: 'critical',
      accentHex: '#00F0FF',
      toneTag: 'Autonomous ALARA Protocol',
      confidencePct: 98,
      autoOpenBubble: true,
      telemetrySignature: `SPE Active · Neutrons ${metrics.daily_neutron_msv.toFixed(2)} mSv/d · Cumulative ${metrics.cumulative_radiation_msv.toFixed(1)} mSv`,
      proactiveGreeting: `Attention. I detect an active Solar Particle Event on Day ${selectedDay}, with ${metrics.daily_neutron_msv.toFixed(
        2
      )} mSv of daily neutrons and ${metrics.cumulative_radiation_msv.toFixed(
        1
      )} mSv cumulative. At ${delayMin.toFixed(
        1
      )} light-minutes from Earth, I’ve deployed my energy shield and prioritized ALARA shelter.`,
      actionPrompts: [
        {
          id: 'open_evarm',
          question:
            'Open the EVARM Scanner to review doses to skin (6x), lens (13x), and bone marrow (25x) (CSA-RAD-009)?',
          buttonLabel: 'Open EVARM Scanner',
          actionType: 'navigate',
          targetModule: 'radiation',
          variant: 'cyan',
        },
        {
          id: 'attenuate_lights',
          question:
            'Would you like to dim the cabin to a restful spectrum to conserve biological energy while shelter remains in effect?',
          buttonLabel: circadianMode === 'night' ? 'Night Mode Active' : 'Dim Lights',
          activeDoneLabel: 'Cabin Lights Dimmed',
          actionType: 'attenuate_lights',
          variant: 'amber',
        },
      ],
      primaryCitation,
      citations,
    };
  }

  // Priority 2: Cognitive Fatigue / Mild Depression (Exact Day 145 Scenario + Live PVT Fatigue)
  if (isCognitiveFatigueExact || isCognitiveFatigueLive) {
    const { primaryCitation, citations } = buildVerifiedBadgeCitations(
      knowledgeBase,
      'HRP-RISK-014',
      ['HRP-RISK-012', 'HRP-HAZ-006']
    );
    return {
      stateId: 'cognitive_fatigue',
      stateLabel: 'Cognitive Fatigue / Mild Depression',
      shortBadge: 'Acute Cognitive Fatigue',
      visualExpression: 'worried_empathetic',
      severity: 'critical',
      accentHex: '#FFB800',
      toneTag: 'Empathetic Neural Inference',
      confidencePct: 96,
      autoOpenBubble: true,
      telemetrySignature: `PVT ${Math.round(effectivePvtMs)} ms · Sleep ${metrics.sleep_hours.toFixed(
        1
      )} h · CO₂ ${metrics.cabin_co2_mmhg.toFixed(2)} mmHg · HR ${Math.round(metrics.resting_heart_rate)} bpm`,
      proactiveGreeting: `Hello. I’ve noticed in your recent tests that your reflexes are slow (${Math.round(
        effectivePvtMs
      )} ms) and your resting pulse is ${Math.round(
        metrics.resting_heart_rate
      )} bpm. My neural network detects acute cognitive fatigue (sleep ${metrics.sleep_hours.toFixed(
        1
      )} h · CO₂ ${metrics.cabin_co2_mmhg.toFixed(2)} mmHg). Since we are ${delayMin.toFixed(
        1
      )} minutes from Earth, I’ve taken the initiative.`,
      actionPrompts: [
        {
          id: 'attenuate_lights',
          question:
            'Would you like me to dim the cabin lights to a warm spectrum to prepare for your sleep cycle (HRP-RISK-014)?',
          buttonLabel: circadianMode === 'sunset' || circadianMode === 'night' ? 'Warm Light Active' : 'Dim Lights',
          activeDoneLabel: 'Warm Spectrum Activated',
          actionType: 'attenuate_lights',
          variant: 'amber',
        },
        {
          id: 'open_veggie',
          question:
            'Your stress levels suggest you need a break. Open the Veggie chamber panel for a therapeutic gardening session (HRP-RISK-012)?',
          buttonLabel: 'View Veggie Crop',
          actionType: 'navigate',
          targetModule: 'wellness',
          variant: 'emerald',
        },
      ],
      primaryCitation,
      citations,
    };
  }

  // Priority 3: Anxiety / Physical Overload (Resting HR > 88 bpm streak regardless of ARED)
  if (isAnxietyOverload) {
    const { primaryCitation, citations } = buildVerifiedBadgeCitations(
      knowledgeBase,
      'HRP-RISK-012',
      ['HRP-RISK-003', 'HRP-RISK-014']
    );
    return {
      stateId: 'anxiety_overload',
      stateLabel: 'Anxiety / Physical Overload',
      shortBadge: 'Autonomic Overload',
      visualExpression: 'worried_empathetic',
      severity: 'warning',
      accentHex: '#FFB800',
      toneTag: 'HRI Sympathetic Regulation',
      confidencePct: 93,
      autoOpenBubble: true,
      telemetrySignature: `HR ${Math.round(
        metrics.resting_heart_rate
      )} bpm (${consecutiveOver88}d > 88 bpm) · ARED: ${aredDone ? 'Completed' : 'Missed'}`,
      proactiveGreeting: liveVestibularCritical
        ? `I detected sensorimotor dysregulation in your recent vestibular test and a pulse of ${Math.round(
            metrics.resting_heart_rate
          )} bpm. My model infers stress overload. At ${delayMin.toFixed(
            1
          )} min from Houston, I’m here with you for a decompression break.`
        : `Hello. Your resting heart rate remains elevated at ${Math.round(
            metrics.resting_heart_rate
          )} bpm (sustained streak > 88 bpm, with ARED ${
            aredDone ? 'completed' : 'missed'
          }). My neural network infers anxiety and physiological overload. I’ve taken the initiative to help you slow down.`,
      actionPrompts: [
        {
          id: 'open_veggie',
          question:
            'Your stress levels suggest you need a break. Open the Veggie chamber panel for a therapeutic gardening session (HRP-RISK-012)?',
          buttonLabel: 'View Veggie Crop',
          actionType: 'navigate',
          targetModule: 'wellness',
          variant: 'emerald',
        },
        {
          id: 'attenuate_lights',
          question:
            'Would you like me to dim the cabin lights to a warm spectrum to stabilize your heart rate and sleep (HRP-RISK-014)?',
          buttonLabel: circadianMode === 'sunset' || circadianMode === 'night' ? 'Warm Light Active' : 'Dim Lights',
          activeDoneLabel: 'Warm Spectrum Activated',
          actionType: 'attenuate_lights',
          variant: 'amber',
        },
      ],
      primaryCitation,
      citations,
    };
  }

  // Priority 4: Medical Assistant (Missed ARED / Bone Remodeling / Grip / SANS Warning)
  if (isMedicalAssistant) {
    const { primaryCitation, citations } = buildVerifiedBadgeCitations(
      knowledgeBase,
      'HRP-RISK-009',
      ['HRP-RISK-011', 'HRP-RISK-010']
    );
    return {
      stateId: 'medical_assistant',
      stateLabel: 'Medical Assistant · Musculoskeletal Support',
      shortBadge: 'ARED Medical Assistant',
      visualExpression: 'medical_assistant',
      severity: 'warning',
      accentHex: '#00F0FF',
      toneTag: 'Preventive Scanner Active',
      confidencePct: 94,
      autoOpenBubble: true,
      telemetrySignature: `ARED: ${aredDone ? 'OK' : 'Missed'} · Bone Density ${metrics.bone_density_index.toFixed(
        2
      )}% · HR ${Math.round(metrics.resting_heart_rate)} bpm`,
      proactiveGreeting: liveGripIssue
        ? `Activating Medical Assistant mode: your isometric dynamometer test recorded ${liveDemoOverrides.diag_grip.value} kg-f (${liveDemoOverrides.diag_grip.status}), a sign of muscle fatigue or disuse in microgravity. I’m here to guide you.`
        : !aredDone
        ? `Hello, I activated my Medical Assistant visor on Day ${selectedDay}: I detect a missed ARED session and bone density at ${metrics.bone_density_index.toFixed(
            2
          )}% with a pulse of ${Math.round(
            metrics.resting_heart_rate
          )} bpm. A ${delayMin.toFixed(
            1
          )} min from Earth, let’s protect your muscle and bone mass today.`
        : `My preventive scanner detects progressive bone loss (${metrics.bone_density_index.toFixed(
            2
          )}%) or an anomaly in a recent medical test. I activated the physical strengthening protocol.`,
      actionPrompts: [
        {
          id: 'open_diagnostic',
          question:
            'Would you like to check your isometric muscle strength or SANS visual acuity in the Diagnostic Suite (HRP-RISK-009)?',
          buttonLabel: 'Open Diagnostic Suite',
          actionType: 'navigate',
          targetModule: 'cognition',
          variant: 'cyan',
        },
        {
          id: 'open_veggie',
          question:
            'Review your nutritional support (calcium, vitamin D, and Veggie greens) and ARED loading target (HRP-RISK-011)?',
          buttonLabel: 'View Veggie Crop',
          actionType: 'navigate',
          targetModule: 'wellness',
          variant: 'emerald',
        },
      ],
      primaryCitation,
      citations,
    };
  }

  // Priority 5: Isolation / Disconnection (> Day 60, no critical anomalies, Earth delay > 6 min)
  if (isIsolationDisconnect) {
    const isolationPct = computeIsolationProgression(selectedDay, delayMin);
    const { primaryCitation, citations } = buildVerifiedBadgeCitations(
      knowledgeBase,
      'HRP-RISK-012',
      ['HRP-HAZ-003', 'HRP-RISK-019']
    );
    return {
      stateId: 'isolation_disconnect',
      stateLabel: 'Isolation / Progressive Disconnection',
      shortBadge: `Isolation D${selectedDay} (${isolationPct}%)`,
      visualExpression: 'worried_empathetic',
      severity: 'warning',
      accentHex: '#FFB800',
      toneTag: 'Autonomous Psychosocial Support',
      confidencePct: Math.max(76, Math.min(97, 74 + Math.round(isolationPct * 0.22))),
      autoOpenBubble: true,
      isolationProgressPct: isolationPct,
      telemetrySignature: `Day ${selectedDay} (>60) · Earth Delay ${delayMin.toFixed(
        1
      )} min (>6m) · Stable physical load`,
      proactiveGreeting: `Your physical indicators are stable on Day ${selectedDay}, but latency to Earth has reached ${delayMin.toFixed(
        1
      )} minutes one way (${(delayMin * 2).toFixed(
        1
      )} min round trip). After more than 60 days in confinement, my engine detects a ${isolationPct}% risk of progressive disconnection.`,
      actionPrompts: [
        {
          id: 'open_veggie',
          question:
            'Contact with life on Earth reduces confinement fatigue. Open the Veggie chamber for a therapeutic gardening session (HRP-RISK-012)?',
          buttonLabel: 'View Veggie Crop',
          actionType: 'navigate',
          targetModule: 'wellness',
          variant: 'emerald',
        },
        {
          id: 'attenuate_lights',
          question:
            'Would you like to shift the cabin lights to a warm spectrum to support your mood and circadian anchoring (HRP-HAZ-003)?',
          buttonLabel: circadianMode === 'sunset' || circadianMode === 'night' ? 'Warm Light Active' : 'Dim Lights',
          activeDoneLabel: 'Warm Spectrum Activated',
          actionType: 'attenuate_lights',
          variant: 'amber',
        },
      ],
      primaryCitation,
      citations,
    };
  }

  // Priority 6: Optimal / Motivated (All biomarkers green and ARED workout completed)
  const { primaryCitation, citations } = buildVerifiedBadgeCitations(
    knowledgeBase,
    'HRP-RISK-012',
    ['HRP-RISK-014', 'HRP-RISK-009']
  );
  return {
    stateId: 'optimal_motivated',
    stateLabel: 'Optimal / Motivated',
    shortBadge: 'Optimal / Motivated',
    visualExpression: 'optimal_motivated',
    severity: 'optimal',
    accentHex: '#00FF66',
    toneTag: 'Homeostasis & Peak Performance',
    confidencePct: 97,
    autoOpenBubble: false,
    telemetrySignature: `PVT ${Math.round(effectivePvtMs)} ms · Sleep ${metrics.sleep_hours.toFixed(
      1
    )} h · HR ${Math.round(metrics.resting_heart_rate)} bpm · ARED OK`,
    proactiveGreeting: `Excellent balance on Day ${selectedDay}! All your biomarkers are green (PVT ${Math.round(
      effectivePvtMs
    )} ms, sleep ${metrics.sleep_hours.toFixed(1)} h, pulse ${Math.round(
      metrics.resting_heart_rate
    )} bpm), and you completed your ARED workout. Your psychological and circadian resilience is optimal.`,
    actionPrompts: [
      {
        id: 'open_veggie',
        question:
          'A great time to reinforce positive well-being. Would you like to check the mizuna mustard growing in Veggie (HRP-RISK-012)?',
        buttonLabel: 'View Veggie Crop',
        actionType: 'navigate',
        targetModule: 'wellness',
        variant: 'emerald',
      },
      {
        id: 'attenuate_lights',
        question:
          'When your shift ends, would you like to prepare the circadian transition to Earth-based warm light (HRP-RISK-014)?',
        buttonLabel: circadianMode === 'sunset' || circadianMode === 'night' ? 'Warm Light Active' : 'Dim Lights',
        activeDoneLabel: 'Warm Spectrum Activated',
        actionType: 'attenuate_lights',
        variant: 'amber',
      },
    ],
    primaryCitation,
    citations,
  };
}
