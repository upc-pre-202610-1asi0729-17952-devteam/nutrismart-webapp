/**
 * Regenerates nutrition-log and body-metrics for all current users
 * with realistic data spread across 90 days.
 * Also removes the stale `analytics` collection.
 */
const fs = require('fs');

const db = JSON.parse(fs.readFileSync('./server/db.json', 'utf8'));
const TODAY = new Date('2026-05-11');

function dateStr(daysAgo) {
  const d = new Date(TODAY);
  d.setDate(TODAY.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function dateISO(daysAgo, hour, min) {
  const d = new Date(TODAY);
  d.setDate(TODAY.getDate() - daysAgo);
  d.setUTCHours(hour, min, 0, 0);
  return d.toISOString();
}

function vary(base, pct, seed) {
  const factor = 1 + ((seed % 20) / 100 - 0.1) * pct;
  return Math.round(base * factor);
}

const MEAL_TEMPLATES = [
  { mealType: 'BREAKFAST', calPct: 0.25, hour: 7,  min: 30 },
  { mealType: 'LUNCH',     calPct: 0.35, hour: 13, min: 0  },
  { mealType: 'DINNER',    calPct: 0.30, hour: 19, min: 30 },
  { mealType: 'SNACK',     calPct: 0.10, hour: 16, min: 0  },
];

function buildLogsForUser(user, startId) {
  const { id: userId, dailyCalorieTarget: cal, proteinTarget: pt,
          carbsTarget: ct, fatTarget: ft, fiberTarget: fit } = user;

  const logs = [];
  let idCounter = startId;

  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    const seed = (userId.toString().charCodeAt(0) + daysAgo) % 100;

    // ~80% chance of logging that day; weekends ~65%
    const dayOfWeek = new Date(TODAY.getTime() - daysAgo * 86400000).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const threshold = isWeekend ? 65 : 80;
    if (seed > threshold) continue;

    // 2-4 meals depending on seed
    const mealCount = seed % 3 === 0 ? 2 : seed % 3 === 1 ? 3 : 4;
    const meals = MEAL_TEMPLATES.slice(0, mealCount);

    for (const meal of meals) {
      const mealSeed = (seed * meal.hour) % 100;
      const calTarget = cal * meal.calPct;
      const calories  = vary(calTarget, 2, mealSeed);
      const protein   = vary(pt  * meal.calPct, 2, mealSeed + 1);
      const carbs     = vary(ct  * meal.calPct, 2, mealSeed + 2);
      const fat       = vary(ft  * meal.calPct, 2, mealSeed + 3);
      const fiber     = vary(fit * meal.calPct, 2, mealSeed + 4);

      logs.push({
        id:           String(idCounter++),
        userId,
        foodItemId:   (idCounter % 25) + 1,
        foodItemName: `Meal ${meal.mealType.toLowerCase()}`,
        mealType:     meal.mealType,
        quantity:     200,
        unit:         'g',
        calories,
        protein,
        carbs,
        fat,
        fiber,
        sugar:        Math.round(carbs * 0.25),
        loggedAt:     dateISO(daysAgo, meal.hour, meal.min),
      });
    }
  }
  return logs;
}

function buildWeightForUser(user, startId) {
  const { id: user_id, weight, goal } = user;
  const isLoss   = goal === 'WEIGHT_LOSS';
  const delta    = isLoss ? -0.06 : 0.045;
  const target   = isLoss
    ? Math.round(weight * 0.88)
    : Math.round(weight * 1.1);

  const entries = [];
  let idCounter = startId;

  // Weekly weigh-ins over 90 days (13 entries)
  for (let week = 12; week >= 0; week--) {
    const daysAgo  = week * 7;
    const weeksIn  = 12 - week;
    const noise    = ((user_id.toString().charCodeAt(0) + week) % 5) * 0.1 - 0.2;
    const weight_kg = parseFloat((weight + weeksIn * delta * 7 + noise).toFixed(1));

    entries.push({
      id:                        `bm-${user_id}-${idCounter++}`,
      user_id,
      weight_kg,
      height_cm:                 170,
      logged_at:                 dateISO(daysAgo, 8, 0),
      target_weight_kg:          target,
      projected_achievement_date: dateStr(-(365)),
    });
  }
  return entries;
}

// ── Rebuild collections ───────────────────────────────────────────────────────
const currentUserIds = new Set(db.users.map(u => String(u.id)));

// Remove logs from current users (keep any unrelated entries)
db['nutrition-log'] = db['nutrition-log'].filter(
  e => !currentUserIds.has(String(e.userId))
);

// Remove body-metrics from current users
db['body-metrics'] = db['body-metrics'].filter(
  e => !currentUserIds.has(String(e.user_id))
);

// Generate new entries
let logId = 1000;
let bmId  = 1;

for (const user of db.users) {
  const logs    = buildLogsForUser(user, logId);
  const weights = buildWeightForUser(user, bmId);
  db['nutrition-log'].push(...logs);
  db['body-metrics'].push(...weights);
  logId += logs.length;
  bmId  += weights.length;
}

// Remove stale analytics collection
delete db.analytics;

fs.writeFileSync('./server/db.json', JSON.stringify(db, null, 2));

console.log('nutrition-log entries:', db['nutrition-log'].length);
console.log('body-metrics entries:', db['body-metrics'].length);
console.log('analytics collection removed');
db.users.forEach(u => {
  const logs = db['nutrition-log'].filter(e => String(e.userId) === String(u.id));
  const bms  = db['body-metrics'].filter(e => String(e.user_id) === String(u.id));
  console.log(` ${u.id}: ${logs.length} logs, ${bms.length} weight entries`);
});
