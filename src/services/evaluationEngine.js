/**
 * AURA-7 Evaluation Engine (Non-Diagnostic Clinical Support)
 * Evaluates immutable telemetry dynamically against `clinical_thresholds`
 * and traces every recommendation to verified NASA HRP & CSA records.
 */

export const STATUS_META = {
  optimal: {
    id: 'optimal',
    label: 'Optimal',
    badgeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/35',
    dotClass: 'bg-emerald-500',
    ringClass: 'border-emerald-500/30',
    hex: '#10b981',
  },
  warning: {
    id: 'warning',
    label: 'Warning',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    dotClass: 'bg-amber-500',
    ringClass: 'border-amber-500/45',
    hex: '#f59e0b',
  },
  critical: {
    id: 'critical',
    label: 'Critical',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/45',
    dotClass: 'bg-rose-500',
    ringClass: 'border-rose-500/60',
    hex: '#fb7185',
  },
};

export const METRIC_DEFINITIONS = {
  bone_density_index: {
    key: 'bone_density_index',
    label: 'Bone Density Index',
    shortLabel: 'Bone Density',
    decimals: 2,
    targetModule: 'wellness',
  },
  resting_heart_rate: {
    key: 'resting_heart_rate',
    label: 'Resting Heart Rate',
    shortLabel: 'Resting Pulse',
    decimals: 0,
    targetModule: 'health',
  },
  cumulative_radiation_msv: {
    key: 'cumulative_radiation_msv',
    label: 'Cumulative Radiation',
    shortLabel: 'Cumulative Rad.',
    decimals: 2,
    targetModule: 'radiation',
  },
  cabin_co2_mmhg: {
    key: 'cabin_co2_mmhg',
    label: 'Cabin CO₂ Partial Pressure',
    shortLabel: 'Cabin CO₂',
    decimals: 2,
    targetModule: 'ecosystem',
  },
  sleep_hours: {
    key: 'sleep_hours',
    label: 'Sleep Duration',
    shortLabel: 'Sleep Hours',
    decimals: 1,
    targetModule: 'wellness',
  },
  pvt_reaction_ms: {
    key: 'pvt_reaction_ms',
    label: 'Psychomotor Vigilance (PVT)',
    shortLabel: 'PVT Reaction',
    decimals: 0,
    targetModule: 'cognition',
  },
};

export function resolveKbRecord(knowledgeBase, id) {
  return (knowledgeBase || []).find((r) => r.id === id) || null;
}

export function resolveKbRecords(knowledgeBase, ids) {
  const byId = new Map((knowledgeBase || []).map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

/**
 * Evaluates a single metric dynamically against `clinical_thresholds`.
 */
export function classifyMetric(key, value, thresholds, dayFlags = {}) {
  const cfg = thresholds?.[key];
  if (!cfg) return 'optimal';

  switch (key) {
    case 'bone_density_index': {
      if (value < cfg.warning_min) return 'critical';
      if (value < cfg.optimal_min || dayFlags.ared_workout_completed === false) return 'warning';
      return 'optimal';
    }
    case 'resting_heart_rate': {
      if (value > cfg.warning_max) return 'critical';
      if (value > cfg.optimal_max) return 'warning';
      return 'optimal';
    }
    case 'cumulative_radiation_msv': {
      if (dayFlags.solar_particle_event === true || value >= cfg.critical_max) return 'critical';
      if (value > cfg.warning_max) return 'warning';
      return 'optimal';
    }
    case 'cabin_co2_mmhg': {
      if (value > cfg.warning_max) return 'critical';
      if (value > cfg.optimal_max) return 'warning';
      return 'optimal';
    }
    case 'sleep_hours': {
      if (value < cfg.warning_min) return 'critical';
      if (value < cfg.optimal_min) return 'warning';
      return 'optimal';
    }
    case 'pvt_reaction_ms': {
      if (value > cfg.warning_max) return 'critical';
      if (value > cfg.optimal_max) return 'warning';
      return 'optimal';
    }
    default:
      return 'optimal';
  }
}

function getEffectiveValue(dayData, key, liveDemoOverrides = {}) {
  if (
    liveDemoOverrides &&
    Object.prototype.hasOwnProperty.call(liveDemoOverrides, key) &&
    liveDemoOverrides[key] !== null &&
    liveDemoOverrides[key] !== undefined
  ) {
    return {
      value: liveDemoOverrides[key],
      isLiveOverride: true,
    };
  }
  return {
    value: dayData.metrics[key],
    isLiveOverride: false,
  };
}

function computeReadinessScore(statuses, dayData) {
  let score = 100;
  Object.values(statuses).forEach((st) => {
    if (st === 'warning') score -= 9;
    if (st === 'critical') score -= 22;
  });
  if (dayData.ared_workout_completed === false) score -= 6;
  if (dayData.solar_particle_event === true) score -= 12;
  return Math.max(12, Math.min(100, Math.round(score)));
}

/**
 * Full clinical assessment for `dayData` with optional `prevDayData` and `liveDemoOverrides`.
 */
export function evaluateDay({
  dayData,
  prevDayData = null,
  thresholds,
  knowledgeBase,
  liveDemoOverrides = {},
}) {
  if (!dayData || !thresholds) return null;

  const metricKeys = Object.keys(METRIC_DEFINITIONS);
  const statuses = {};
  const metrics = [];

  metricKeys.forEach((key) => {
    const def = METRIC_DEFINITIONS[key];
    const cfg = thresholds[key];
    const { value, isLiveOverride } = getEffectiveValue(dayData, key, liveDemoOverrides);
    const status = classifyMetric(key, value, thresholds, {
      ared_workout_completed: dayData.ared_workout_completed,
      solar_particle_event: dayData.solar_particle_event,
    });
    statuses[key] = status;

    const prevValue = prevDayData ? prevDayData.metrics[key] : null;
    const deltaPrev = prevValue !== null ? Number((value - prevValue).toFixed(2)) : null;

    metrics.push({
      ...def,
      value,
      formattedValue: def.decimals > 0 ? Number(value).toFixed(def.decimals) : String(Math.round(value)),
      unit: cfg.unit,
      hazard: cfg.hazard,
      threshold: cfg,
      status,
      statusMeta: STATUS_META[status],
      prevValue,
      deltaPrev,
      dataSource: isLiveOverride ? 'live_demo' : 'historical_audited',
      sourceBadge: isLiveOverride
        ? '[Live Demo Measurement]'
        : '[Audited Historical Telemetry]',
      isLiveOverride,
    });
  });

  // Readiness Score & Delta vs Yesterday
  const readinessScore = computeReadinessScore(statuses, dayData);
  let prevReadinessScore = null;
  let readinessDelta = null;
  if (prevDayData) {
    const prevStatuses = {};
    metricKeys.forEach((key) => {
      prevStatuses[key] = classifyMetric(key, prevDayData.metrics[key], thresholds, {
        ared_workout_completed: prevDayData.ared_workout_completed,
        solar_particle_event: prevDayData.solar_particle_event,
      });
    });
    prevReadinessScore = computeReadinessScore(prevStatuses, prevDayData);
    readinessDelta = readinessScore - prevReadinessScore;
  }

  const optimalCount = metrics.filter((m) => m.status === 'optimal').length;
  const warningCount = metrics.filter((m) => m.status === 'warning').length;
  const criticalCount = metrics.filter((m) => m.status === 'critical').length;

  const overallStatus =
    criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'optimal';

  // Build active traceable alerts (never diagnosing, always explaining correlations + citations)
  const activeAlerts = buildActiveAlerts({
    dayData,
    prevDayData,
    metrics,
    statuses,
    thresholds,
    knowledgeBase,
  });

  // Mascot posture rules:
  // 1) Acute SPE or critical radiation -> shield
  // 2) Missed ARED workout -> weights
  // 3) Fatigue / sleep deficit / high CO2 -> veggie
  // 4) Elevated radiation (warning) when other wellness/ARED systems are nominal -> shield
  // 5) Otherwise -> nominal
  let mascotPosture = 'nominal';
  if (dayData.solar_particle_event || statuses.cumulative_radiation_msv === 'critical') {
    mascotPosture = 'shield';
  } else if (!dayData.ared_workout_completed) {
    mascotPosture = 'weights';
  } else if (
    statuses.pvt_reaction_ms !== 'optimal' ||
    statuses.sleep_hours !== 'optimal' ||
    statuses.cabin_co2_mmhg !== 'optimal'
  ) {
    mascotPosture = 'veggie';
  } else if (statuses.cumulative_radiation_msv === 'warning') {
    mascotPosture = 'shield';
  }

  const pvtMetric = metrics.find((m) => m.key === 'pvt_reaction_ms');
  const narrative = buildSproutBotNarrative({
    dayData,
    statuses,
    metrics,
    mascotPosture,
    pvtMetric,
  });

  const hasAnyLiveOverride = metrics.some((m) => m.isLiveOverride);

  return {
    dayData,
    prevDayData,
    metrics,
    statuses,
    readinessScore,
    prevReadinessScore,
    readinessDelta,
    optimalCount,
    warningCount,
    criticalCount,
    overallStatus,
    overallMeta: STATUS_META[overallStatus],
    activeAlerts,
    mascotPosture,
    narrative,
    hasAnyLiveOverride,
    isSpeWindow: dayData.mission_day >= 110 && dayData.mission_day <= 114,
  };
}

function buildActiveAlerts({ dayData, prevDayData, metrics, statuses, thresholds, knowledgeBase }) {
  const alerts = [];
  const byKey = Object.fromEntries(metrics.map((m) => [m.key, m]));

  // 1. Solar Particle Event / Radiation Alert
  if (dayData.solar_particle_event || statuses.cumulative_radiation_msv !== 'optimal') {
    const rad = byKey.cumulative_radiation_msv;
    const isSpe = dayData.solar_particle_event === true;
    const citations = resolveKbRecords(
      knowledgeBase,
      isSpe
        ? ['CSA-RAD-009', 'CSA-RAD-010', 'CSA-RAD-006', 'HRP-HAZ-002']
        : ['CSA-RAD-005', 'CSA-RAD-010', 'HRP-RISK-017']
    );
    alerts.push({
      id: 'alert-radiation',
      severity: rad.status,
      title: isSpe
        ? 'Solar Particle Event (SPE) & Radi-N2 Neutron Spike'
        : 'Cumulative Radiation Dose Monitoring',
      metricChanged: `Cumulative radiation at ${rad.formattedValue} mSv (Daily neutrons: ${dayData.metrics.daily_neutron_msv.toFixed(
        2
      )} mSv)`,
      correlations: isSpe
        ? 'The acute increase in solar particles raises neutron flux (~30% of biological contribution) and coincides with the temporary suspension of ARED exercise, increasing systemic stress.'
        : 'Sustained exposure to galactic cosmic rays and secondary neutrons accumulates during transit beyond Earth’s magnetosphere.',
      documentedRisk:
        'Differential exposure in sensitive tissues documented by CSA EVARM (Skin 6x, Lens 13x, Bone Marrow 25x), with risk of cataracts and long-term degenerative effects.',
      countermeasure:
        'Apply the ALARA (As Low As Reasonably Achievable) principle: postpone EVAs, remain in areas with greater water/polyethylene shielding, and notify the SRAG/Flight Surgeon medical team.',
      citations,
      targetModule: 'radiation',
      targetLabel: 'Open EVARM & Radi-N2 Scanner',
    });
  }

  // 2. Missed ARED / Bone & Cardiovascular Risk
  if (!dayData.ared_workout_completed || statuses.bone_density_index !== 'optimal') {
    const bone = byKey.bone_density_index;
    const hr = byKey.resting_heart_rate;
    const citations = resolveKbRecords(knowledgeBase, [
      'HRP-RISK-011',
      'HRP-RISK-009',
      'HRP-RISK-003',
      'HRP-RES-011',
    ]);
    alerts.push({
      id: 'alert-ared-bone',
      severity: bone.status === 'critical' ? 'critical' : 'warning',
      title: !dayData.ared_workout_completed
        ? 'Missed ARED Session & Deconditioning'
        : 'Declining Bone Density Index',
      metricChanged: `Bone density index at ${bone.formattedValue}% (${
        bone.deltaPrev !== null ? `${bone.deltaPrev >= 0 ? '+' : ''}${bone.deltaPrev}% vs yesterday` : 'no change'
      }) · ARED: ${dayData.ared_workout_completed ? 'Completed' : 'Missed'}`,
      correlations: `The lack of resistive loading coincides with a resting heart rate of ${hr.formattedValue} bpm and contributes to progressive bone mass and muscle strength loss in microgravity.`,
      documentedRisk:
        'In microgravity, weight-bearing bones lose an average of 1% to 1.5% density per month without mechanical countermeasures, increasing the risk of fractures and kidney stones due to calcium release.',
      countermeasure:
        'Resume the 1.5-hour daily protocol combining resistive (ARED) and aerobic exercise, stay well hydrated, and review musculoskeletal follow-up with the Flight Surgeons.',
      citations,
      targetModule: 'wellness',
      targetLabel: 'View ARED & Wellness Tracking',
    });
  }

  // 3. Elevated Cabin CO2
  if (statuses.cabin_co2_mmhg !== 'optimal') {
    const co2 = byKey.cabin_co2_mmhg;
    const sleep = byKey.sleep_hours;
    const pvt = byKey.pvt_reaction_ms;
    const citations = resolveKbRecords(knowledgeBase, ['HRP-HAZ-006', 'HRP-RISK-006', 'HRP-RISK-008']);
    alerts.push({
      id: 'alert-co2',
      severity: co2.status,
      title: 'Elevated Cabin CO₂',
      metricChanged: `ppCO₂ at ${co2.formattedValue} mmHg (optimal threshold ≤ ${thresholds.cabin_co2_mmhg.optimal_max} mmHg)`,
      correlations: `The rise in CO₂ coincides with ${sleep.formattedValue} h of sleep and a PVT latency of ${pvt.formattedValue} ms, a pattern consistent with a closed-environment burden on cognitive alertness.`,
      documentedRisk:
        'Closed environments with compromised ventilation and CO₂ buildup can be associated with headaches, fatigue, and reduced performance during operational tasks or EVAs.',
      countermeasure:
        'Check airflow in crew quarters, inspect environmental scrubbers, and avoid complex maneuvers while the metric exceeds 3.5 mmHg.',
      citations,
      targetModule: 'ecosystem',
      targetLabel: 'Inspect Cabin & EVA HUD',
    });
  }

  // 4. Sleep Deficit / Circadian & Behavioral Risk
  if (statuses.sleep_hours !== 'optimal' || statuses.pvt_reaction_ms !== 'optimal') {
    const sleep = byKey.sleep_hours;
    const pvt = byKey.pvt_reaction_ms;
    const worstStatus =
      sleep.status === 'critical' || pvt.status === 'critical' ? 'critical' : 'warning';
    const citations = resolveKbRecords(knowledgeBase, [
      'HRP-RISK-014',
      'HRP-RISK-012',
      'HRP-RES-010',
      'HRP-RES-007',
    ]);
    alerts.push({
      id: 'alert-sleep-pvt',
      severity: worstStatus,
      title: 'Sleep Deficit & Neurobehavioral Fatigue (PVT)',
      metricChanged: `Sleep: ${sleep.formattedValue} h · PVT: ${pvt.formattedValue} ms ${pvt.sourceBadge}`,
      correlations: `Sleep below ${thresholds.sleep_hours.optimal_min} h correlates directly with psychomotor slowing (${pvt.formattedValue} ms) and elevated resting pulse (${byKey.resting_heart_rate.formattedValue} bpm).`,
      documentedRisk:
        'Chronic sleep loss and circadian desynchronization (16 sunrises/sunsets per day) degrade psychomotor performance and mood, and may alter immune responses.',
      countermeasure:
        'Follow circadian light hygiene (590 nm amber light at sunset, low brightness at night), prioritize rest before critical activities, and spend time on self-care in the Veggie garden.',
      citations,
      targetModule: 'cognition',
      targetLabel: 'Go to Cognition Module (PVT)',
    });
  }

  // 5. Elevated Resting Heart Rate (if not already explained solely by ARED)
  if (statuses.resting_heart_rate !== 'optimal' && dayData.ared_workout_completed) {
    const hr = byKey.resting_heart_rate;
    const citations = resolveKbRecords(knowledgeBase, ['HRP-RISK-003', 'HRP-RISK-001', 'HRP-RES-009']);
    alerts.push({
      id: 'alert-heart-rate',
      severity: hr.status,
      title: 'Elevated Resting Heart Rate',
      metricChanged: `Resting pulse: ${hr.formattedValue} bpm (optimal ≤ ${thresholds.resting_heart_rate.optimal_max} bpm)`,
      correlations: `Accompanies changes in sleep (${byKey.sleep_hours.formattedValue} h) and cabin environment (CO₂ ${byKey.cabin_co2_mmhg.formattedValue} mmHg), reflecting greater autonomic physiological load.`,
      documentedRisk:
        'Microgravity and spaceflight stress alter cardiovascular regulation and the distribution of body fluids.',
      countermeasure:
        'Increase hydration, eat foods rich in omega-3 and antioxidants (flavonoids/lycopene), and share the trend with the assigned Flight Surgeon.',
      citations,
      targetModule: 'health',
      targetLabel: 'Analyze Health Trends',
    });
  }

  // 6. Distance / Autonomy awareness when comm delay >= 10 min
  if (dayData.earth_comm_delay_min >= 10.0) {
    const citations = resolveKbRecords(knowledgeBase, ['HRP-HAZ-004', 'CSA-SCI-003', 'HRP-RISK-015']);
    alerts.push({
      id: 'alert-distance',
      severity: 'warning',
      title: `Operational Autonomy Due to Earth Delay (${dayData.earth_comm_delay_min.toFixed(1)} min)`,
      metricChanged: `One-way latency of ${dayData.earth_comm_delay_min.toFixed(1)} min (${(
        dayData.earth_comm_delay_min * 2
      ).toFixed(1)} min round trip to Houston)`,
      correlations:
        'As distance from Earth increases, real-time medical consultations are no longer immediate and local preventive protocols take priority.',
      documentedRisk:
        'Distance limits immediate medical assistance and rapid resupply.',
      countermeasure:
        'Operate in Local Autonomous Mode and queue the compressed telemetry packet for asynchronous review by the Flight Surgeon in Houston.',
      citations,
      targetModule: 'mission',
      targetLabel: 'View Log & Earth Transmission',
    });
  }

  // Nominal day fallback preventive guidance
  if (alerts.length === 0) {
    const citations = resolveKbRecords(knowledgeBase, ['HRP-HAZ-001', 'HRP-RES-010', 'HRP-RES-009']);
    alerts.push({
      id: 'alert-nominal',
      severity: 'optimal',
      title: 'Metrics Within Optimal Mission Range',
      metricChanged: `All biomarkers in optimal range · ARED completed · No SPE events`,
      correlations:
        'Adherence to ARED exercise, clean cabin air, and ≥ 7.0 h of sleep support fast PVT reaction times and cardiovascular stability.',
      documentedRisk:
        'Even on nominal days, 16 orbital sunrises and menu monotony call for ongoing prevention against the five NASA HRP hazards.',
      countermeasure:
        'Maintain the Earth-based circadian lighting cycle, tend/harvest Veggie, and continue a preventive nutrient-enriched diet.',
      citations,
      targetModule: 'wellness',
      targetLabel: 'Explore Veggie Garden & Nutrition',
    });
  }

  // Keep prevDayData referenced for future enhancements
  void prevDayData;

  return alerts;
}

function buildSproutBotNarrative({ dayData, statuses, metrics, mascotPosture, pvtMetric }) {
  const byKey = Object.fromEntries(metrics.map((m) => [m.key, m]));
  const delay = dayData.earth_comm_delay_min;
  const co2 = byKey.cabin_co2_mmhg.formattedValue;
  const sleep = byKey.sleep_hours.formattedValue;
  const pvt = byKey.pvt_reaction_ms.formattedValue;
  const hr = byKey.resting_heart_rate.formattedValue;
  const bone = byKey.bone_density_index.formattedValue;
  const rad = byKey.cumulative_radiation_msv.formattedValue;

  if (mascotPosture === 'shield') {
    if (dayData.solar_particle_event) {
      return {
        toneLabel: 'Solar Radiation Alert (SPE)',
        summaryLine: `I’ve activated my energy shield! On Day ${dayData.mission_day}, we detected a solar particle event (SPE) with a neutron flux of ${dayData.metrics.daily_neutron_msv.toFixed(
          2
        )} mSv/day and a cumulative dose of ${rad} mSv.`,
        correlationBody: `Since Houston is ${delay.toFixed(
          1
        )} light-minutes away and your ARED session wasn’t recorded today (pulse at ${hr} bpm), my non-diagnostic priority is to help reduce exposure. According to EVARM data (CSA-RAD-009), tissues such as the lens (13x) and bone marrow (25x) are more sensitive outside the main shielding. I recommend staying in the protected cabin area, postponing EVAs under the ALARA principle, and sharing this packet with the Flight Surgeons.`,
        disclaimer:
          'Autonomous preventive guidance based on NASA HRP/CSA thresholds. It does not replace medical evaluation by the Flight Surgeons.',
      };
    }

    return {
      toneLabel: 'ALARA Preventive Shield',
      summaryLine: `I’m keeping the preventive shield active on Day ${dayData.mission_day}: your cumulative dose reached ${rad} mSv (caution zone > 120 mSv).`,
      correlationBody: `Your other metrics are stable (sleep ${sleep} h, CO₂ ${co2} mmHg, and PVT ${pvt} ms), which is positive. However, daily neutrons (${dayData.metrics.daily_neutron_msv.toFixed(
        2
      )} mSv) require ongoing monitoring under CSA Radi-N2 to protect the lens and bone marrow over the long term.`,
      disclaimer:
        'Autonomous preventive guidance based on NASA HRP/CSA thresholds. It does not replace medical evaluation by the Flight Surgeons.',
    };
  }

  if (mascotPosture === 'weights') {
    return {
      toneLabel: 'ARED Mechanical Loading Reminder',
      summaryLine: `I’ve brought out my training weights on Day ${dayData.mission_day}: today’s ARED session wasn’t completed, and your bone index is ${bone}%.`,
      correlationBody: `This change coincides with a resting pulse of ${hr} bpm. NASA HRP evidence (HRP-RISK-011 and HRP-RISK-009) documents that without daily resistive loading in microgravity, bone tissue loses 1% to 1.5% monthly. I recommend scheduling your 1.5-hour resistive and aerobic exercise block today, staying well hydrated, and reviewing your progress with your medical team.`,
      disclaimer:
        'Autonomous preventive guidance based on NASA HRP/CSA thresholds. It does not replace medical evaluation by the Flight Surgeons.',
    };
  }

  if (mascotPosture === 'veggie') {
    return {
      toneLabel: 'Circadian Care, Air & Veggie',
      summaryLine: `I noticed you slept ${sleep} h today, CO₂ rose to ${co2} mmHg, and your reaction time ${
        pvtMetric.isLiveOverride ? '(live measurement)' : ''
      } was ${pvt} ms.`,
      correlationBody: `These combined changes (along with a resting pulse of ${hr} bpm) may be related to neurobehavioral fatigue and altered immunity described in HRP-RISK-014 and HRP-HAZ-006. This is not a medical diagnosis, but it is a clear signal to rest before your next critical activity, ventilate your rest area, spend a few minutes caring for the mizuna mustard in Veggie, and review official recommendations with the Flight Surgeons.`,
      disclaimer:
        'Autonomous preventive guidance based on NASA HRP/CSA thresholds. It does not replace medical evaluation by the Flight Surgeons.',
    };
  }

  return {
    toneLabel: 'Overall Status: Optimal',
    summaryLine: `Excellent work on Day ${dayData.mission_day}! All 6 metrics are within optimal thresholds: ${sleep} h of sleep, clean CO₂ at ${co2} mmHg, pulse at ${hr} bpm, and a fast PVT of ${pvt} ms.`,
    correlationBody: `Although we are ${delay.toFixed(
      1
    )} light-minutes from Earth, your ARED training discipline (bone index ${bone}%) and adherence to the Earth lighting cycle are protecting your body clock from 16 orbital sunrises each day. I suggest continuing the circadian transition and enjoying fresh leaves from the Veggie garden.`,
    disclaimer:
      'Autonomous preventive guidance based on NASA HRP/CSA thresholds. It does not replace medical evaluation by the Flight Surgeons.',
  };
}
