const fs = require('fs');

const today = new Date('2026-05-11');
function date(daysAgo) {
  const d = new Date(today);
  d.setDate(today.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

const anaMacros = [
  { name: 'Protein', consumed: 107, target: 120, colorClass: 'macro-protein' },
  { name: 'Carbohydrates', consumed: 172, target: 200, colorClass: 'macro-carbs' },
  { name: 'Fat', consumed: 46, target: 55, colorClass: 'macro-fat' },
  { name: 'Fiber', consumed: 21, target: 25, colorClass: 'macro-fiber' },
];

const antMacros = [
  { name: 'Protein', consumed: 98, target: 112, colorClass: 'macro-protein' },
  { name: 'Carbohydrates', consumed: 180, target: 185, colorClass: 'macro-carbs' },
  { name: 'Fat', consumed: 42, target: 44, colorClass: 'macro-fat' },
  { name: 'Fiber', consumed: 20, target: 25, colorClass: 'macro-fiber' },
];

function buildDailyCal(days, cals, goal) {
  return cals.map((c, i) => ({ date: date(days - 1 - i), calories: c, goal }));
}

function buildWeightEvol(days, startWeight, delta) {
  return Array.from({ length: days }, (_, i) => ({
    date: date(days - 1 - i),
    weight: parseFloat((startWeight + i * delta).toFixed(1)),
  }));
}

function buildAdh30(pattern) {
  return Array.from({ length: 30 }, (_, i) => ({
    date: date(29 - i),
    status: pattern[i % pattern.length],
  }));
}

function buildAdh90(pattern) {
  return Array.from({ length: 90 }, (_, i) => ({
    date: date(89 - i),
    status: pattern[i % pattern.length],
  }));
}

const anaAdh30 = buildAdh30([
  'ON_TRACK','ON_TRACK','AT_RISK','ON_TRACK','ON_TRACK',
  'DROPPED','RECOVERED','ON_TRACK','ON_TRACK','AT_RISK',
  'ON_TRACK','ON_TRACK','ON_TRACK','DROPPED','RECOVERED',
]);
const anaEvents30 = [
  { date: date(22), description: 'BehavioralDropDetected' },
  { date: date(19), description: 'ConsistencyRecovered' },
  { date: date(8), description: 'BehavioralDropDetected' },
  { date: date(5), description: 'ConsistencyRecovered' },
];

const antAdh30 = buildAdh30([
  'ON_TRACK','ON_TRACK','AT_RISK','ON_TRACK','DROPPED',
  'RECOVERED','ON_TRACK','ON_TRACK','ON_TRACK','AT_RISK',
  'ON_TRACK','DROPPED','RECOVERED','ON_TRACK','ON_TRACK',
]);
const antEvents30 = [
  { date: date(25), description: 'BehavioralDropDetected' },
  { date: date(22), description: 'ConsistencyRecovered' },
  { date: date(12), description: 'BehavioralDropDetected' },
  { date: date(9), description: 'ConsistencyRecovered' },
  { date: date(1), description: 'BehavioralDropDetected' },
];

const ANA_GOAL = 1800;
const ANT_GOAL = 1584;

const analytics = [
  // ── ANA 7d ──────────────────────────────────────────────────────────────────
  {
    id: 'ana-7d', userId: '1', period: '7_DAYS',
    averageCalorieIntake: 1698, averageProteinIntake: 107,
    currentStreak: 5, weightChange: -0.4,
    dailyCaloriesHistory: buildDailyCal(7, [1820, 1650, 1900, 1780, 1340, 0, 0], ANA_GOAL),
    macroAnalysis: anaMacros,
    daysWithCompleteLog: [true, true, true, true, true, false, false],
    weightEvolution: buildWeightEvol(7, 70.2, -0.057),
    goalWeight: 64,
  },
  // ── ANA 30d ─────────────────────────────────────────────────────────────────
  {
    id: 'ana-30d', userId: '1', period: '30_DAYS',
    averageCalorieIntake: 1748, averageProteinIntake: 110,
    currentStreak: 5, weightChange: -1.7,
    dailyCaloriesHistory: buildDailyCal(30, [
      1810,1690,1920,1750,1830,1600,0,1780,1850,1700,
      1740,1900,1660,1800,1720,0,1870,1650,1830,1790,
      1710,1940,0,1680,1800,1760,1830,1700,1650,1810,
    ], ANA_GOAL),
    macroAnalysis: anaMacros,
    daysWithCompleteLog: Array.from({ length: 30 }, (_, i) => i < 25),
    weightEvolution: buildWeightEvol(30, 71.5, -0.057),
    goalWeight: 64,
    adherenceHistory: anaAdh30,
    behavioralEvents: anaEvents30,
  },
  // ── ANA 90d ─────────────────────────────────────────────────────────────────
  {
    id: 'ana-90d', userId: '1', period: '90_DAYS',
    averageCalorieIntake: 1762, averageProteinIntake: 109,
    currentStreak: 5, weightChange: -4.2,
    dailyCaloriesHistory: Array.from({ length: 90 }, (_, i) => ({
      date: date(89 - i),
      calories: (i % 7 === 5 || i % 7 === 6) ? 0 : Math.min(2100, Math.max(1400, 1750 + Math.round(Math.sin(i * 0.4) * 150))),
      goal: ANA_GOAL,
    })),
    macroAnalysis: anaMacros,
    daysWithCompleteLog: Array.from({ length: 90 }, (_, i) => i < 78),
    weightEvolution: buildWeightEvol(90, 74.0, -0.047),
    goalWeight: 64,
    adherenceHistory: buildAdh90([
      'ON_TRACK','ON_TRACK','ON_TRACK','AT_RISK',
      'ON_TRACK','DROPPED','RECOVERED','ON_TRACK',
      'ON_TRACK','ON_TRACK','ON_TRACK','AT_RISK',
    ]),
    behavioralEvents: [
      ...anaEvents30,
      { date: date(60), description: 'BehavioralDropDetected' },
      { date: date(57), description: 'ConsistencyRecovered' },
      { date: date(45), description: 'NutritionalAbandonmentRisk' },
      { date: date(42), description: 'ConsistencyRecovered' },
    ],
  },
  // ── ANTONIO 7d ──────────────────────────────────────────────────────────────
  {
    id: 'ant-7d', userId: 'Mv9paKyK60k', period: '7_DAYS',
    averageCalorieIntake: 1555, averageProteinIntake: 98,
    currentStreak: 0, weightChange: -0.4,
    dailyCaloriesHistory: buildDailyCal(7, [1590, 1510, 1620, 1580, 1480, 1550, 0], ANT_GOAL),
    macroAnalysis: antMacros,
    daysWithCompleteLog: [true, true, true, true, true, true, false],
    weightEvolution: buildWeightEvol(7, 70.0, -0.057),
    goalWeight: 62,
  },
  // ── ANTONIO 30d ─────────────────────────────────────────────────────────────
  {
    id: 'ant-30d', userId: 'Mv9paKyK60k', period: '30_DAYS',
    averageCalorieIntake: 1560, averageProteinIntake: 100,
    currentStreak: 0, weightChange: -2.0,
    dailyCaloriesHistory: buildDailyCal(30, [
      1590,1510,1620,1580,1480,1550,0,1600,1540,1610,
      1570,1490,0,1620,1560,1510,1600,1540,1490,0,
      1610,1580,1520,1600,1550,1480,1610,1560,1510,1590,
    ], ANT_GOAL),
    macroAnalysis: antMacros,
    daysWithCompleteLog: Array.from({ length: 30 }, (_, i) => i < 22),
    weightEvolution: buildWeightEvol(30, 71.8, -0.072),
    goalWeight: 62,
    adherenceHistory: antAdh30,
    behavioralEvents: antEvents30,
  },
  // ── ANTONIO 90d ─────────────────────────────────────────────────────────────
  {
    id: 'ant-90d', userId: 'Mv9paKyK60k', period: '90_DAYS',
    averageCalorieIntake: 1572, averageProteinIntake: 99,
    currentStreak: 0, weightChange: -5.1,
    dailyCaloriesHistory: Array.from({ length: 90 }, (_, i) => ({
      date: date(89 - i),
      calories: i % 7 === 6 ? 0 : Math.min(1900, Math.max(1350, 1560 + Math.round(Math.sin(i * 0.35) * 120))),
      goal: ANT_GOAL,
    })),
    macroAnalysis: antMacros,
    daysWithCompleteLog: Array.from({ length: 90 }, (_, i) => i % 7 !== 6 && i % 14 !== 13),
    weightEvolution: buildWeightEvol(90, 75.0, -0.057),
    goalWeight: 62,
    adherenceHistory: buildAdh90([
      'ON_TRACK','ON_TRACK','AT_RISK','ON_TRACK',
      'DROPPED','RECOVERED','ON_TRACK','ON_TRACK',
      'ON_TRACK','AT_RISK','ON_TRACK','AT_RISK',
    ]),
    behavioralEvents: [
      ...antEvents30,
      { date: date(62), description: 'BehavioralDropDetected' },
      { date: date(58), description: 'ConsistencyRecovered' },
      { date: date(40), description: 'NutritionalAbandonmentRisk' },
      { date: date(36), description: 'ConsistencyRecovered' },
    ],
  },
];

const db = JSON.parse(fs.readFileSync('./server/db.json', 'utf8'));
db.analytics = analytics;
fs.writeFileSync('./server/db.json', JSON.stringify(db, null, 2));
console.log('analytics collection updated:', analytics.length, 'entries');
