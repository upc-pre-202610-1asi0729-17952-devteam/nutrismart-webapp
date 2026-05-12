const fs = require('fs');

const db = JSON.parse(fs.readFileSync('./server/db.json', 'utf8'));
const today = new Date('2026-05-11');

function date(daysAgo) {
  const d = new Date(today);
  d.setDate(today.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function buildDailyCal(days, goal, seed) {
  return Array.from({ length: days }, (_, i) => {
    const sinVal = Math.sin((i + seed) * 0.45);
    const calories = (i % 7 === 6) ? 0 : Math.min(goal * 1.3, Math.max(goal * 0.7, Math.round(goal + sinVal * goal * 0.15)));
    return { date: date(days - 1 - i), calories, goal };
  });
}

function buildWeightEvol(days, startWeight, dailyDelta) {
  return Array.from({ length: days }, (_, i) => ({
    date: date(days - 1 - i),
    weight: parseFloat((startWeight + i * dailyDelta).toFixed(1)),
  }));
}

function buildAdherence(days, seed) {
  const pattern = ['ON_TRACK','ON_TRACK','ON_TRACK','AT_RISK','ON_TRACK','DROPPED','RECOVERED','ON_TRACK','ON_TRACK','AT_RISK'];
  return Array.from({ length: days }, (_, i) => ({
    date: date(days - 1 - i),
    status: pattern[(i + seed) % pattern.length],
  }));
}

function buildEvents(offsets) {
  const types = ['BehavioralDropDetected','ConsistencyRecovered','NutritionalAbandonmentRisk'];
  return offsets.map((daysAgo, i) => ({
    date: date(daysAgo),
    description: types[i % types.length],
  }));
}

function buildMacros(p, c, f, fi, pt, ct, ft, fit) {
  return [
    { name: 'Protein',       consumed: p,  target: pt,  colorClass: 'macro-protein' },
    { name: 'Carbohydrates', consumed: c,  target: ct,  colorClass: 'macro-carbs'   },
    { name: 'Fat',           consumed: f,  target: ft,  colorClass: 'macro-fat'     },
    { name: 'Fiber',         consumed: fi, target: fit, colorClass: 'macro-fiber'   },
  ];
}

function buildUserAnalytics(user) {
  const { id, goal, weight, dailyCalorieTarget: cal, proteinTarget: pt, carbsTarget: ct, fatTarget: ft, fiberTarget: fit } = user;
  const isLoss = goal === 'WEIGHT_LOSS';
  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 10;
  const dailyDelta = isLoss ? -0.055 : 0.04;
  const goalWeight = isLoss ? Math.round(weight * 0.9) : Math.round(weight * 1.1);
  const wChange7  = parseFloat((dailyDelta * 6).toFixed(1));
  const wChange30 = parseFloat((dailyDelta * 28).toFixed(1));
  const wChange90 = parseFloat((dailyDelta * 85).toFixed(1));
  const avgCal = Math.round(cal * 0.94);
  const macros = buildMacros(
    Math.round(pt * 0.9), Math.round(ct * 0.86), Math.round(ft * 0.84), Math.round(fit * 0.84),
    pt, ct, ft, fit,
  );

  return [
    {
      id: `${id}-7d`, userId: id, period: '7_DAYS',
      averageCalorieIntake: avgCal,
      averageProteinIntake: Math.round(pt * 0.9),
      currentStreak: 3 + (seed % 5),
      weightChange: wChange7,
      dailyCaloriesHistory: buildDailyCal(7, cal, seed),
      macroAnalysis: macros,
      daysWithCompleteLog: Array.from({ length: 7 }, (_, i) => i < 5),
      weightEvolution: buildWeightEvol(7, weight, dailyDelta),
      goalWeight,
    },
    {
      id: `${id}-30d`, userId: id, period: '30_DAYS',
      averageCalorieIntake: avgCal,
      averageProteinIntake: Math.round(pt * 0.91),
      currentStreak: 3 + (seed % 5),
      weightChange: wChange30,
      dailyCaloriesHistory: buildDailyCal(30, cal, seed),
      macroAnalysis: macros,
      daysWithCompleteLog: Array.from({ length: 30 }, (_, i) => i < 23),
      weightEvolution: buildWeightEvol(30, weight - dailyDelta * 29, dailyDelta),
      goalWeight,
      adherenceHistory: buildAdherence(30, seed),
      behavioralEvents: buildEvents([22, 19, 8, 5]),
    },
    {
      id: `${id}-90d`, userId: id, period: '90_DAYS',
      averageCalorieIntake: avgCal,
      averageProteinIntake: Math.round(pt * 0.91),
      currentStreak: 3 + (seed % 5),
      weightChange: wChange90,
      dailyCaloriesHistory: buildDailyCal(90, cal, seed),
      macroAnalysis: macros,
      daysWithCompleteLog: Array.from({ length: 90 }, (_, i) => i < 75),
      weightEvolution: buildWeightEvol(90, weight - dailyDelta * 89, dailyDelta),
      goalWeight,
      adherenceHistory: buildAdherence(90, seed),
      behavioralEvents: buildEvents([60, 57, 45, 42, 22, 19, 8, 5]),
    },
  ];
}

const analytics = db.users.flatMap(buildUserAnalytics);
db.analytics = analytics;
fs.writeFileSync('./server/db.json', JSON.stringify(db, null, 2));
console.log(`analytics collection: ${analytics.length} entries for ${db.users.length} users`);
analytics.forEach(a => console.log(' ', a.id, '| userId:', a.userId));
