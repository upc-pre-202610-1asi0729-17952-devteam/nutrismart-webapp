// seed-db.js — run once: node server/seed-db.js
'use strict';
const fs = require('fs');
const path = require('path');

const DB = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(DB, 'utf8'));

// ── Guard ────────────────────────────────────────────────────────────────────
const DEMO = ['alice@nutrismart.demo','bob@nutrismart.demo','carol@nutrismart.demo',
  'dan@nutrismart.demo','eva@nutrismart.demo','frank@nutrismart.demo','guest@nutrismart.demo'];
if (db.users.some(u => DEMO.includes(u.email))) {
  console.log('Already seeded. Delete demo users first to re-run.'); process.exit(0);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
let _counter = 1000;
const uid = () => (_counter++).toString(36) + Math.random().toString(36).slice(2, 6);

const BASE = new Date('2026-05-12T00:00:00.000Z');

function isoDate(daysAgo, h = 8) {
  const d = new Date(BASE); d.setUTCDate(d.getUTCDate() - daysAgo); d.setUTCHours(h, 0, 0, 0);
  return d.toISOString();
}
function dateOnly(daysAgo) { return isoDate(daysAgo, 0).slice(0, 10); }

// foods map (updated after new foods are pushed)
const FM = {};
db.foods.forEach(f => { FM[f.id] = f; });

function macro(foodId, qty) {
  const f = FM[String(foodId)]; const r = qty / 100;
  return {
    calories: Math.round(f.calories_per_100g * r * 10) / 10,
    protein:  Math.round(f.protein_per_100g  * r * 10) / 10,
    carbs:    Math.round(f.carbs_per_100g    * r * 10) / 10,
    fat:      Math.round(f.fat_per_100g      * r * 10) / 10,
    fiber:    Math.round(f.fiber_per_100g    * r * 10) / 10,
    sugar:    Math.round(f.sugar_per_100g    * r * 10) / 10,
  };
}

function nl(userId, foodId, mealType, qty, daysAgo, h) {
  const f = FM[String(foodId)]; const m = macro(foodId, qty);
  return { id: uid(), foodItemId: String(foodId), foodItemName: f.name,
    foodItemNameEs: f.name_es, mealType, quantity: qty, unit: 'g',
    ...m, loggedAt: isoDate(daysAgo, h), userId };
}

function bm(userId, weight, height, daysAgo, targetWeight, projDate = '') {
  return { id: uid(), userId, weightKg: weight, heightCm: height,
    loggedAt: isoDate(daysAgo, 7), targetWeightKg: targetWeight,
    projectedAchievementDate: projDate };
}

function db_(userId, daysAgo, consumed, active, goal) {
  return { id: uid(), userId, date: dateOnly(daysAgo), daily_goal: goal,
    consumed: Math.round(consumed), active };
}

function bc(userId, waist, neck, height, weight, daysAgo) {
  return { id: uid(), user_id: userId, waist_cm: waist, neck_cm: neck,
    height_cm: height, weight_kg: weight, measured_at: isoDate(daysAgo, 9),
    previous_body_fat_percent: 0 };
}

function al(userId, type, mins, cal, daysAgo) {
  return { id: uid(), user_id: userId, activity_type: type,
    duration_minutes: mins, calories_burned: cal, timestamp: isoDate(daysAgo, 7) };
}

function ls(userId, city, country, daysAgo) {
  return { id: uid(), user_id: userId, city, country, recorded_at: isoDate(daysAgo, 8) };
}

function mal(userId, trigger, prevCal, newCal, prevBMR, newBMR, prevTDEE, newTDEE, reason, daysAgo) {
  return { id: uid(), userId, trigger, previousCalorieTarget: prevCal, newCalorieTarget: newCal,
    previousBMR: prevBMR, newBMR: newBMR, previousTDEE: prevTDEE, newTDEE: newTDEE,
    reason, createdAt: isoDate(daysAgo, 8) };
}

// ── New foods (IDs 26–30) ─────────────────────────────────────────────────────
const newFoods = [
  { id:'26', name:'Whole wheat bread', name_es:'Pan integral', source:'USDA FoodData',
    serving_size:30, serving_unit:'g', calories_per_100g:247, protein_per_100g:9.0,
    carbs_per_100g:46, fat_per_100g:3.4, fiber_per_100g:6.0, sugar_per_100g:5.0,
    restrictions:['GLUTEN_FREE'] },
  { id:'27', name:'Cottage cheese', name_es:'Requesón', source:'USDA FoodData',
    serving_size:100, serving_unit:'g', calories_per_100g:98, protein_per_100g:11.1,
    carbs_per_100g:3.4, fat_per_100g:4.3, fiber_per_100g:0, sugar_per_100g:2.7,
    restrictions:['LACTOSE_FREE'] },
  { id:'28', name:'Tuna in water', name_es:'Atún en agua', source:'USDA FoodData',
    serving_size:85, serving_unit:'g', calories_per_100g:116, protein_per_100g:25.5,
    carbs_per_100g:0, fat_per_100g:1.0, fiber_per_100g:0, sugar_per_100g:0,
    restrictions:['SEAFOOD_FREE'] },
  { id:'29', name:'Cooked eggs', name_es:'Huevos cocidos', source:'USDA FoodData',
    serving_size:100, serving_unit:'g', calories_per_100g:155, protein_per_100g:13.0,
    carbs_per_100g:1.1, fat_per_100g:10.6, fiber_per_100g:0, sugar_per_100g:1.1,
    restrictions:[] },
  { id:'30', name:'Sweet potato', name_es:'Camote', source:'USDA FoodData',
    serving_size:130, serving_unit:'g', calories_per_100g:86, protein_per_100g:1.6,
    carbs_per_100g:20, fat_per_100g:0.1, fiber_per_100g:3.0, sugar_per_100g:4.2,
    restrictions:[] },
];
db.foods.push(...newFoods);
newFoods.forEach(f => { FM[f.id] = f; });

// ── New ingredient-catalog (IDs 7–21) ─────────────────────────────────────────
db['ingredient-catalog'].push(
  { id:'7',  name_key:'oats',           category:'Grain',           calories_per_100g:389 },
  { id:'8',  name_key:'eggs',           category:'Animal protein',  calories_per_100g:155 },
  { id:'9',  name_key:'spinach',        category:'Vegetable',       calories_per_100g:23  },
  { id:'10', name_key:'sweet_potato',   category:'Vegetable',       calories_per_100g:86  },
  { id:'11', name_key:'tuna',           category:'Animal protein',  calories_per_100g:116 },
  { id:'12', name_key:'olive_oil',      category:'Fat',             calories_per_100g:884 },
  { id:'13', name_key:'salmon',         category:'Animal protein',  calories_per_100g:156 },
  { id:'14', name_key:'broccoli',       category:'Vegetable',       calories_per_100g:34  },
  { id:'15', name_key:'banana',         category:'Fruit',           calories_per_100g:89  },
  { id:'16', name_key:'black_beans',    category:'Legume',          calories_per_100g:132 },
  { id:'17', name_key:'avocado',        category:'Fat',             calories_per_100g:160 },
  { id:'18', name_key:'brown_rice',     category:'Grain',           calories_per_100g:111 },
  { id:'19', name_key:'tomato',         category:'Vegetable',       calories_per_100g:18  },
  { id:'20', name_key:'cottage_cheese', category:'Dairy',           calories_per_100g:98  },
  { id:'21', name_key:'turkey_breast',  category:'Animal protein',  calories_per_100g:135 }
);

// ── New recipes (IDs 5–16) ────────────────────────────────────────────────────
db.recipes.push(
  { id:'5',  name:'Turkey and brown rice bowl',    name_key:'turkey_brown_rice',    name_es:'Bowl de pavo con arroz integral',
    calories:520, protein:48, carbs:52, fat:11, goal_type:'MUSCLE_GAIN', prep_time_minutes:30, covers_macro_pct:38,
    ingredients:['turkey_breast','brown_rice','garlic','spinach'], restrictions_conflict:[] },
  { id:'6',  name:'Egg and spinach scramble',       name_key:'egg_spinach_scramble', name_es:'Revuelto de huevo y espinaca',
    calories:310, protein:26, carbs:6,  fat:21, goal_type:'MUSCLE_GAIN', prep_time_minutes:10, covers_macro_pct:24,
    ingredients:['eggs','spinach','olive_oil','onion'], restrictions_conflict:[] },
  { id:'7',  name:'Chicken and sweet potato',       name_key:'chicken_sweet_potato', name_es:'Pollo con camote',
    calories:460, protein:40, carbs:42, fat:12, goal_type:'MUSCLE_GAIN', prep_time_minutes:35, covers_macro_pct:35,
    ingredients:['chicken_breast','sweet_potato','garlic','olive_oil'], restrictions_conflict:[] },
  { id:'8',  name:'Salmon and quinoa bowl',         name_key:'salmon_quinoa_bowl',   name_es:'Bowl de salmón con quinoa',
    calories:580, protein:46, carbs:44, fat:18, goal_type:'MUSCLE_GAIN', prep_time_minutes:30, covers_macro_pct:42,
    ingredients:['salmon','quinoa','lemon','spinach'], restrictions_conflict:['SEAFOOD_FREE'] },
  { id:'9',  name:'Black bean protein bowl',        name_key:'black_bean_protein',   name_es:'Bowl proteico de frijoles negros',
    calories:420, protein:22, carbs:64, fat:8,  goal_type:'MUSCLE_GAIN', prep_time_minutes:20, covers_macro_pct:28,
    ingredients:['black_beans','brown_rice','onion','garlic'], restrictions_conflict:[] },
  { id:'10', name:'Tuna and avocado salad',         name_key:'tuna_avocado_salad',   name_es:'Ensalada de atún y aguacate',
    calories:380, protein:32, carbs:8,  fat:24, goal_type:'MUSCLE_GAIN', prep_time_minutes:10, covers_macro_pct:29,
    ingredients:['tuna','avocado','lemon','onion'], restrictions_conflict:['SEAFOOD_FREE'] },
  { id:'11', name:'Spinach and egg white scramble', name_key:'spinach_egg_white',    name_es:'Revuelto de espinaca y claras',
    calories:180, protein:20, carbs:5,  fat:8,  goal_type:'WEIGHT_LOSS', prep_time_minutes:10, covers_macro_pct:22,
    ingredients:['eggs','spinach','olive_oil','tomato'], restrictions_conflict:[] },
  { id:'12', name:'Tuna cucumber salad',            name_key:'tuna_cucumber',        name_es:'Ensalada de atún y pepino',
    calories:220, protein:28, carbs:8,  fat:8,  goal_type:'WEIGHT_LOSS', prep_time_minutes:8,  covers_macro_pct:20,
    ingredients:['tuna','onion','lemon','olive_oil'], restrictions_conflict:['SEAFOOD_FREE'] },
  { id:'13', name:'Steamed sweet potato with chicken', name_key:'sweet_potato_chicken', name_es:'Camote al vapor con pollo',
    calories:380, protein:34, carbs:42, fat:8,  goal_type:'WEIGHT_LOSS', prep_time_minutes:30, covers_macro_pct:28,
    ingredients:['chicken_breast','sweet_potato','garlic','lemon'], restrictions_conflict:[] },
  { id:'14', name:'Tomato and broccoli stir fry',   name_key:'tomato_broccoli',      name_es:'Salteado de tomate y brócoli',
    calories:120, protein:6,  carbs:18, fat:4,  goal_type:'WEIGHT_LOSS', prep_time_minutes:12, covers_macro_pct:18,
    ingredients:['broccoli','tomato','garlic','olive_oil'], restrictions_conflict:[] },
  { id:'15', name:'Brown rice with black beans',    name_key:'brown_rice_beans',     name_es:'Arroz integral con frijoles',
    calories:320, protein:14, carbs:60, fat:3,  goal_type:'WEIGHT_LOSS', prep_time_minutes:20, covers_macro_pct:22,
    ingredients:['brown_rice','black_beans','onion','garlic'], restrictions_conflict:[] },
  { id:'16', name:'Avocado and tomato salad',       name_key:'avocado_tomato',       name_es:'Ensalada de aguacate y tomate',
    calories:200, protein:3,  carbs:12, fat:18, goal_type:'WEIGHT_LOSS', prep_time_minutes:5,  covers_macro_pct:16,
    ingredients:['avocado','tomato','lemon','onion'], restrictions_conflict:[] }
);

// ── New users ─────────────────────────────────────────────────────────────────
const ALICE = 'alice001xxa', BOB = 'bob0001xxb', CAROL = 'carol001xc',
      DAN   = 'dan0001xxd',  EVA = 'eva0001xxe', FRANK = 'frank001xf',
      GUEST = 'guest001xg';

db.users.push(
  { id:ALICE, firstName:'Alice', lastName:'Morgan',  email:'alice@nutrismart.demo',
    goal:'WEIGHT_LOSS', weight:68, height:165, activityLevel:'MODERATE', plan:'BASIC',
    restrictions:[], medicalConditions:[],
    dailyCalorieTarget:1440, proteinTarget:108, carbsTarget:144, fatTarget:48, fiberTarget:25,
    streak:10, consecutiveMisses:0, birthday:'1997-08-15', biologicalSex:'female',
    createdAt:'2026-04-01', home_city:'Lima', goal_started_at:'2026-04-01' },

  { id:BOB, firstName:'Bob', lastName:'Torres', email:'bob@nutrismart.demo',
    goal:'MUSCLE_GAIN', weight:75, height:178, activityLevel:'MODERATE', plan:'PRO',
    restrictions:[], medicalConditions:[],
    dailyCalorieTarget:3000, proteinTarget:150, carbsTarget:338, fatTarget:83, fiberTarget:25,
    streak:0, consecutiveMisses:3, birthday:'2001-03-20', biologicalSex:'male',
    createdAt:'2026-04-10', home_city:'Lima', goal_started_at:'2026-04-10' },

  { id:CAROL, firstName:'Carol', lastName:'Quispe', email:'carol@nutrismart.demo',
    goal:'WEIGHT_LOSS', weight:72, height:162, activityLevel:'SEDENTARY', plan:'PREMIUM',
    restrictions:[], medicalConditions:[],
    dailyCalorieTarget:1200, proteinTarget:90, carbsTarget:120, fatTarget:40, fiberTarget:25,
    streak:0, consecutiveMisses:8, birthday:'1994-01-10', biologicalSex:'female',
    createdAt:'2026-04-05', home_city:'Arequipa', goal_started_at:'2026-04-05' },

  { id:DAN, firstName:'Dan', lastName:'Flores', email:'dan@nutrismart.demo',
    goal:'WEIGHT_LOSS', weight:82, height:175, activityLevel:'MODERATE', plan:'PREMIUM',
    restrictions:[], medicalConditions:[],
    dailyCalorieTarget:1900, proteinTarget:143, carbsTarget:190, fatTarget:63, fiberTarget:25,
    streak:14, consecutiveMisses:0, birthday:'1991-07-22', biologicalSex:'male',
    createdAt:'2026-04-01', home_city:'Lima', goal_started_at:'2026-04-01' },

  { id:EVA, firstName:'Eva', lastName:'Salas', email:'eva@nutrismart.demo',
    goal:'MUSCLE_GAIN', weight:60, height:168, activityLevel:'ACTIVE', plan:'PREMIUM',
    restrictions:[], medicalConditions:[],
    dailyCalorieTarget:2380, proteinTarget:130, carbsTarget:268, fatTarget:79, fiberTarget:25,
    streak:4, consecutiveMisses:0, birthday:'1998-11-05', biologicalSex:'female',
    createdAt:'2026-04-08', home_city:'Cusco', goal_started_at:'2026-04-08' },

  { id:FRANK, firstName:'Frank', lastName:'Medina', email:'frank@nutrismart.demo',
    goal:'WEIGHT_LOSS', weight:80, height:172, activityLevel:'MODERATE', plan:'PRO',
    restrictions:['GLUTEN_FREE'], medicalConditions:['COELIAC_DISEASE'],
    dailyCalorieTarget:1880, proteinTarget:141, carbsTarget:188, fatTarget:63, fiberTarget:25,
    streak:5, consecutiveMisses:0, birthday:'1995-09-14', biologicalSex:'male',
    createdAt:'2026-04-15', home_city:'Lima', goal_started_at:'2026-04-15' },

  { id:GUEST, firstName:'Guest', lastName:'User', email:'guest@nutrismart.demo',
    goal:null, weight:null, height:null, activityLevel:null, plan:null,
    restrictions:[], medicalConditions:[],
    dailyCalorieTarget:null, proteinTarget:null, carbsTarget:null, fatTarget:null, fiberTarget:null,
    streak:0, consecutiveMisses:0, birthday:null, biologicalSex:null,
    createdAt:'2026-05-12', home_city:'', goal_started_at:null }
);

// ── Subscriptions ─────────────────────────────────────────────────────────────
db.subscriptions.push(
  { id:uid(), userId:ALICE, plan:'BASIC',   status:'ACTIVE', nextRenewal:'2026-06-01', pricePerMonth:0,     startDate:'2026-04-01' },
  { id:uid(), userId:BOB,   plan:'PRO',     status:'ACTIVE', nextRenewal:'2026-06-10', pricePerMonth:29.9,  startDate:'2026-04-10' },
  { id:uid(), userId:CAROL, plan:'PREMIUM', status:'ACTIVE', nextRenewal:'2026-06-05', pricePerMonth:49.9,  startDate:'2026-04-05' },
  { id:uid(), userId:DAN,   plan:'PREMIUM', status:'ACTIVE', nextRenewal:'2026-06-01', pricePerMonth:49.9,  startDate:'2026-04-01' },
  { id:uid(), userId:EVA,   plan:'PREMIUM', status:'ACTIVE', nextRenewal:'2026-06-08', pricePerMonth:49.9,  startDate:'2026-04-08' },
  { id:uid(), userId:FRANK, plan:'PRO',     status:'ACTIVE', nextRenewal:'2026-06-15', pricePerMonth:29.9,  startDate:'2026-04-15' }
);

// ── Billing history ───────────────────────────────────────────────────────────
function bill(userId, plan, daysAgo, amount, status='PAID') {
  return { id:uid(), userId, date:dateOnly(daysAgo), plan, amount, currency:'S/', status };
}
db['billing-history'].push(
  bill(ALICE,'BASIC',41,0,'TRIAL'), bill(ALICE,'BASIC',11,0),
  bill(BOB,'PRO',32,29.9,'TRIAL'), bill(BOB,'PRO',2,29.9), bill(BOB,'PRO',62,29.9),
  bill(CAROL,'PREMIUM',37,0,'TRIAL'), bill(CAROL,'PREMIUM',7,49.9), bill(CAROL,'PREMIUM',67,49.9),
  bill(DAN,'PREMIUM',41,0,'TRIAL'), bill(DAN,'PREMIUM',11,49.9), bill(DAN,'PREMIUM',71,49.9),
  bill(EVA,'PREMIUM',34,0,'TRIAL'), bill(EVA,'PREMIUM',4,49.9), bill(EVA,'PREMIUM',64,49.9),
  bill(FRANK,'PRO',27,0,'TRIAL'), bill(FRANK,'PRO',3,29.9), bill(FRANK,'PRO',57,29.9)
);

// ── Behavioral-progress: deduplicate existing + add 7 new ─────────────────────
const bpSeen = new Set();
const cleanBP = db['behavioral-progress'].filter(bp => {
  const k = String(bp.userId);
  if (bpSeen.has(k)) return false;
  bpSeen.add(k); return true;
});
db['behavioral-progress'] = cleanBP;

const W7T = [true,true,true,true,true,true,true];
const W7F = [false,false,false,false,false,false,false];
db['behavioral-progress'].push(
  { id:uid(), userId:ALICE, adherenceStatus:'ON_TRACK', streak:10, consecutiveMisses:0,
    lastGoalMetDate:dateOnly(0), weekDots:W7T },
  { id:uid(), userId:BOB, adherenceStatus:'AT_RISK', streak:0, consecutiveMisses:3,
    lastGoalMetDate:dateOnly(3), weekDots:[true,true,true,true,true,false,false] },
  { id:uid(), userId:CAROL, adherenceStatus:'DROPPED', streak:0, consecutiveMisses:8,
    lastGoalMetDate:dateOnly(8), weekDots:W7F },
  { id:uid(), userId:DAN, adherenceStatus:'ON_TRACK', streak:14, consecutiveMisses:0,
    lastGoalMetDate:dateOnly(0), weekDots:W7T },
  { id:uid(), userId:EVA, adherenceStatus:'ON_TRACK', streak:4, consecutiveMisses:0,
    lastGoalMetDate:dateOnly(0), weekDots:[false,false,false,true,true,true,true] },
  { id:uid(), userId:FRANK, adherenceStatus:'ON_TRACK', streak:5, consecutiveMisses:0,
    lastGoalMetDate:dateOnly(0), weekDots:[false,false,true,true,true,true,true] },
  { id:uid(), userId:GUEST, adherenceStatus:'ON_TRACK', streak:0, consecutiveMisses:0,
    lastGoalMetDate:'', weekDots:W7F }
);

// ── nutrition-log ─────────────────────────────────────────────────────────────
const NL = [];

// ALICE – WEIGHT_LOSS BASIC – ON_TRACK – May 3–12 (10 days × 2 entries = 20)
for (let d = 9; d >= 0; d--) {
  NL.push(nl(ALICE,'1', 'BREAKFAST',200,d,8));   // oatmeal
  NL.push(nl(ALICE,'4', 'LUNCH',    200,d,13));  // chicken
  NL.push(nl(ALICE,'5', 'LUNCH',    150,d,13));  // rice
  NL.push(nl(ALICE,'11','DINNER',   150,d,20));  // broccoli
}
// keep only 20 entries for alice
const aliceNL = NL.splice(0, NL.length);
const aliceOnly = [];
for (let i = 0; i < aliceNL.length && aliceOnly.length < 20; i++) aliceOnly.push(aliceNL[i]);

// BOB – MUSCLE_GAIN PRO – AT_RISK – Apr 23 to May 9 (no entries May 10-12) = 19 days
for (let d = 19; d >= 3; d--) {   // 17 days, stops 3 days ago
  BOB_DAYS: {
    const baseH = d % 2 === 0 ? 9 : 8;
    NL.push(nl(BOB,'1', 'BREAKFAST',300,d,baseH));   // oatmeal big
    NL.push(nl(BOB,'4', 'LUNCH',    250,d,13));       // chicken
    NL.push(nl(BOB,'5', 'DINNER',   300,d,20));       // rice
  }
}

// CAROL – WEIGHT_LOSS PREMIUM – DROPPED – Apr 23 to May 4 (last 8 days: no entries)
for (let d = 19; d >= 8; d--) {
  NL.push(nl(CAROL,'1','BREAKFAST',150,d,9));    // oatmeal small
  NL.push(nl(CAROL,'4','LUNCH',    120,d,14));   // chicken small
}
// add a couple partial days to show declining
NL.push(nl(CAROL,'2','SNACK',120,9,16));         // banana only (skipped real meals that day)
NL.push(nl(CAROL,'6','LUNCH',100,8,13));         // just salad (last day before drop)

// DAN – WEIGHT_LOSS PREMIUM – ON_TRACK + PLATEAU – last 20 days, 2 entries/day
for (let d = 19; d >= 0; d--) {
  NL.push(nl(DAN,'1', 'BREAKFAST',220,d,8));     // oatmeal
  NL.push(nl(DAN,'4', 'LUNCH',    200,d,13));    // chicken
  NL.push(nl(DAN,'5', 'LUNCH',    180,d,13));    // rice
  NL.push(nl(DAN,'11','DINNER',   180,d,20));    // broccoli
}

// EVA – MUSCLE_GAIN PREMIUM – RECOVERED – Apr 23-29 (good), gap Apr 30-May 7, May 8-12 (recovery)
for (let d = 19; d >= 13; d--) {                // Apr 23-29: 7 good days
  NL.push(nl(EVA,'1','BREAKFAST',250,d,8));
  NL.push(nl(EVA,'4','LUNCH',    220,d,13));
  NL.push(nl(EVA,'5','LUNCH',    200,d,13));
}
// gap: d=12 to d=5 → no entries for Eva
for (let d = 4; d >= 0; d--) {                  // May 8-12: 5 recovery days
  NL.push(nl(EVA,'1','BREAKFAST',250,d,8));
  NL.push(nl(EVA,'4','LUNCH',    220,d,13));
  NL.push(nl(EVA,'29','DINNER',  150,d,19));    // eggs at dinner
}

// FRANK – WEIGHT_LOSS PRO – ON_TRACK – GLUTEN_FREE – Apr 28-May 12 (15 days × 2 = 18 entries)
// All foods used are safe for GLUTEN_FREE (oatmeal, chicken, rice, salad, salmon, broccoli)
for (let d = 14; d >= 0; d--) {
  NL.push(nl(FRANK,'1', 'BREAKFAST',200,d,8));   // oatmeal (safe)
  NL.push(nl(FRANK,'4', 'LUNCH',    200,d,13));  // chicken (safe)
  NL.push(nl(FRANK,'10','DINNER',   180,d,20));  // salmon (safe)
}

db['nutrition-log'].push(...aliceOnly, ...NL);

// ── daily-balance ─────────────────────────────────────────────────────────────
const DB_ = [];

// Alice: 10 days in target
for (let d = 9; d >= 0; d--) {
  const consumed = [300+330+195+51, 300+330+195+51, 300+330+195+51, 300+330+195+51,
                    300+297+175+45, 300+330+195+51, 300+330+195+51, 300+330+195+51,
                    300+330+195+51, 300+330+195+68][9-d];
  DB_.push(db_(ALICE, d, consumed || 876, 0, 1440));
}

// Bob: 17 days logged (days 3-19), last 3 missing
for (let d = 19; d >= 3; d--)
  DB_.push(db_(BOB, d, 300*1.5+250*1.65+300*1.3, 200, 3000));

// Carol: 12 days (days 8-19)
for (let d = 19; d >= 8; d--) {
  const consumed = d > 10 ? 150*1.5+120*1.65 : (d > 9 ? 107 : 15);
  DB_.push(db_(CAROL, d, consumed, 0, 1200));
}

// Dan: 20 days, all on target (plateau shows in body-metrics, not calories)
for (let d = 19; d >= 0; d--)
  DB_.push(db_(DAN, d, 220*1.5+200*1.65+180*1.3+180*0.34, 250, 1900));

// Eva: 7 good days (13-19), gap (5-12), 5 recovery days (0-4)
for (let d = 19; d >= 13; d--)
  DB_.push(db_(EVA, d, 250*1.5+220*1.65+200*1.3, 300, 2380));
for (let d = 4; d >= 0; d--)
  DB_.push(db_(EVA, d, 250*1.5+220*1.65+150*1.55, 350, 2380));

// Frank: 15 days
for (let d = 14; d >= 0; d--)
  DB_.push(db_(FRANK, d, 200*1.5+200*1.65+180*1.56, 150, 1880));

db['daily-balance'].push(...DB_);

// ── body-metrics ──────────────────────────────────────────────────────────────
// Alice: 70→68kg (weight loss), 11 entries over 40 days
const aliceWeights = [70.0,69.8,69.6,69.4,69.2,69.0,68.8,68.6,68.4,68.2,68.0];
aliceWeights.forEach((w,i) => db['body-metrics'].push(bm(ALICE, w, 165, 40-i*4, 63, '2026-08-01')));

// Bob: 73→75kg (muscle gain), 10 entries, stops at day 3
const bobWeights = [73.0,73.2,73.5,73.7,73.9,74.1,74.3,74.6,74.8,75.0];
bobWeights.forEach((w,i) => db['body-metrics'].push(bm(BOB, w, 178, 35-i*3, 78, '2026-10-01')));

// Carol: 76→73kg but last entry day 8 (8 days ago)
const carolWeights = [76.0,75.5,75.0,74.6,74.2,73.8,73.4,73.1,72.8,72.5];
carolWeights.forEach((w,i) => db['body-metrics'].push(bm(CAROL, w, 162, 37-i*3, 65, '2026-09-01')));

// Dan: plateau at 82kg for last 14 days, lost 2kg before that
const danWeights = [84.2,83.6,83.0,82.5,82.1,82.0,82.0,82.0,82.1,82.0,82.0,82.0,82.0,82.0,82.0];
danWeights.forEach((w,i) => db['body-metrics'].push(bm(DAN, w, 175, 40-i*2, 76, '2026-10-01')));

// Eva: 58→60kg (muscle gain), gap in middle
const evaWeights = [58.0,58.3,58.5,58.8,59.0,59.2,59.4,59.2,59.3,59.5,59.7,60.0];
evaWeights.forEach((w,i) => db['body-metrics'].push(bm(EVA, w, 168, 34-i*2, 63, '2026-11-01')));

// Frank: 82→80kg (weight loss)
const frankWeights = [82.0,81.7,81.4,81.1,80.8,80.6,80.4,80.2,80.0,79.8];
frankWeights.forEach((w,i) => db['body-metrics'].push(bm(FRANK, w, 172, 27-i*2, 75, '2026-10-01')));

// ── body-compositions ─────────────────────────────────────────────────────────
[[ALICE,83,36,165,70.0,40],[ALICE,82,36,165,69.0,20],[ALICE,81,36,165,68.0,0],
 [BOB,  87,38,178,73.0,32],[BOB,  86,38,178,75.0,5],
 [CAROL,91,35,162,76.0,35],[CAROL,89,35,162,73.0,10],
 [DAN,  98,40,175,84.2,40],[DAN,  97,40,175,82.0,14],[DAN,  97,40,175,82.0,0],
 [EVA,  73,33,168,58.0,34],[EVA,  72,33,168,60.0,4],
 [FRANK,93,39,172,82.0,27],[FRANK,91,39,172,80.0,7]
].forEach(([u,w,n,h,wt,d]) => db['body-compositions'].push(bc(u,w,n,h,wt,d)));

// ── activity-logs ─────────────────────────────────────────────────────────────
// Bob: gym sessions before AT_RISK (days 3-17)
[[BOB,'weight_training',50,290,3],[BOB,'weight_training',55,310,5],[BOB,'running',30,280,7],
 [BOB,'weight_training',50,290,9],[BOB,'hiit',25,260,11],[BOB,'weight_training',50,290,13],
 [BOB,'running',35,320,15],[BOB,'cycling',40,340,17]].forEach(a => db['activity-logs'].push(al(...a)));

// Carol: light activity before DROPPED (days 8-19)
[[CAROL,'walking',30,120,8],[CAROL,'walking',40,160,11],[CAROL,'yoga',45,130,14],
 [CAROL,'walking',30,120,17],[CAROL,'walking',25,100,19]].forEach(a => db['activity-logs'].push(al(...a)));

// Dan: wearable sync data (last 14 days)
for (let d = 13; d >= 0; d--)
  db['activity-logs'].push(al(DAN, d%3===0?'running':d%3===1?'walking':'cycling',
    [35,45,40][d%3], [320,180,340][d%3], d));

// Eva: active before gap + recovery
[[EVA,'running',30,280,19],[EVA,'weight_training',50,290,17],[EVA,'hiit',25,255,15],
 [EVA,'running',35,320,13],[EVA,'weight_training',50,290,4],[EVA,'running',30,280,3],
 [EVA,'hiit',25,255,2],[EVA,'cycling',40,340,1],[EVA,'weight_training',50,290,0]
].forEach(a => db['activity-logs'].push(al(...a)));

// ── wearable-connections (Carol, Dan, Eva) ────────────────────────────────────
db['wearable-connections'].push(
  { id:uid(), user_id:CAROL, provider:'google_fit', status:'SYNC_FAILED',
    last_synced_at:isoDate(9,8), authorized_at:isoDate(30,10) },
  { id:uid(), user_id:DAN, provider:'google_fit', status:'CONNECTED',
    last_synced_at:isoDate(0,7), authorized_at:isoDate(40,10) },
  { id:uid(), user_id:EVA, provider:'google_fit', status:'CONNECTED',
    last_synced_at:isoDate(0,6), authorized_at:isoDate(34,9) }
);

// ── user-location-snapshots ───────────────────────────────────────────────────
[ls(CAROL,'Arequipa','Peru',10), ls(CAROL,'Arequipa','Peru',5), ls(CAROL,'Lima','Peru',3),
 ls(DAN,'Lima','Peru',7),   ls(DAN,'Lima','Peru',3),   ls(DAN,'Cusco','Peru',14),
 ls(EVA,'Cusco','Peru',20), ls(EVA,'Lima','Peru',10),  ls(EVA,'Cusco','Peru',2),
 ls(FRANK,'Lima','Peru',7), ls(FRANK,'Lima','Peru',3)
].forEach(e => db['user-location-snapshots'].push(e));

// ── travel-contexts ───────────────────────────────────────────────────────────
[ALICE,BOB,CAROL,DAN,EVA,FRANK,GUEST].forEach(u => {
  db['travel-contexts'].push({ id:uid(), user_id:u, city:'', country:'',
    is_active:false, is_manual:false, activated_at:'' });
});
// Eva was traveling (now back)
const evaTc = db['travel-contexts'].find(t => t.user_id === EVA);
if (evaTc) { evaTc.city='Lima'; evaTc.country='Peru'; evaTc.is_active=false;
  evaTc.activated_at=isoDate(10,9); }

// ── recommendation-sessions ───────────────────────────────────────────────────
db['recommendation-sessions'].push(
  { id:uid(), user_id:BOB,   adherence_status:'AT_RISK', consecutive_misses:3,
    simplified_kcal_target:2700, created_at:isoDate(3,8), is_active:true },
  { id:uid(), user_id:CAROL, adherence_status:'DROPPED', consecutive_misses:8,
    simplified_kcal_target:1000, created_at:isoDate(7,8), is_active:true },
  { id:uid(), user_id:DAN,   adherence_status:'ON_TRACK', consecutive_misses:0,
    simplified_kcal_target:1900, created_at:isoDate(1,8), is_active:true },
  { id:uid(), user_id:EVA,   adherence_status:'ON_TRACK', consecutive_misses:0,
    simplified_kcal_target:2380, created_at:isoDate(4,8), is_active:true }
);

// ── eating-behavior-patterns ──────────────────────────────────────────────────
db['eating-behavior-patterns'].push(
  { id:uid(), userId:BOB, patternType:'DECLINING', weeklyCompletionRate:57,
    consecutiveMisses:3, analyzedAt:isoDate(3,23),
    notes:'Consistently missing dinner and lunch logs for 3 days' },
  { id:uid(), userId:CAROL, patternType:'BINGE_SKIP', weeklyCompletionRate:14,
    consecutiveMisses:8, analyzedAt:isoDate(8,23),
    notes:'Very low intake on last logged days; 8-day gap detected' },
  { id:uid(), userId:EVA, patternType:'POSITIVE_MOMENTUM', weeklyCompletionRate:80,
    consecutiveMisses:0, analyzedAt:isoDate(1,23),
    notes:'Recovered after 8-day gap; consistent for 4 days' },
  { id:uid(), userId:FRANK, patternType:'CONSISTENT', weeklyCompletionRate:95,
    consecutiveMisses:0, analyzedAt:isoDate(1,23),
    restrictionTriggered:true,
    notes:'Attempted to log whole wheat bread; blocked by GLUTEN_FREE restriction (COELIAC_DISEASE)' }
);

// ── recovery-plans ────────────────────────────────────────────────────────────
db['recovery-plans'].push(
  { id:uid(), userId:BOB, status:'ACTIVE', trigger:'CONSECUTIVE_MISSES',
    createdAt:isoDate(3,8), completedAt:null,
    actions:[
      { type:'SEND_MOTIVATIONAL_MSG', message_key:'re_engagement_at_risk' },
      { type:'SUGGEST_SIMPLE_MEAL',   meal_key:'rice_chicken_bowl' },
      { type:'REDUCE_TARGET_BY_10_PCT', duration_days:3 }
    ]},
  { id:uid(), userId:CAROL, status:'ACTIVE', trigger:'NUTRITIONAL_ABANDONMENT_RISK',
    createdAt:isoDate(7,8), completedAt:null,
    actions:[
      { type:'SEND_INTERVENTION_MSG', message_key:'intervention_dropped' },
      { type:'SUGGEST_SIMPLE_MEAL',   meal_key:'chicken_salad' },
      { type:'SIMPLIFY_PLAN_7_DAYS',  duration_days:7 }
    ]},
  { id:uid(), userId:EVA, status:'COMPLETED', trigger:'CONSECUTIVE_MISSES',
    createdAt:isoDate(12,8), completedAt:isoDate(4,20),
    actions:[
      { type:'SEND_MOTIVATIONAL_MSG', message_key:'re_engagement_at_risk' },
      { type:'SUGGEST_SIMPLE_MEAL',   meal_key:'chicken_quinoa' }
    ]}
);

// ── pantry (Bob, Eva, Frank) ──────────────────────────────────────────────────
function pEntry(userId, nameKey, cat, qtyG, cal100, daysAgo) {
  const names = { oats:'Oats', eggs:'Eggs', chicken_breast:'Chicken breast',
    white_rice:'White rice', quinoa:'Quinoa', garlic:'Garlic', broccoli:'Broccoli',
    sweet_potato:'Sweet potato', black_beans:'Black beans', banana:'Banana',
    salmon:'Salmon', turkey_breast:'Turkey breast', spinach:'Spinach',
    brown_rice:'Brown rice', olive_oil:'Olive oil', tomato:'Tomato', avocado:'Avocado' };
  return { id:uid(), name:names[nameKey]||nameKey, name_key:nameKey, category:cat,
    quantity_grams:qtyG, calories_per_100g:cal100, user_id:userId, added_at:isoDate(daysAgo,10) };
}
// Bob (MUSCLE_GAIN)
[['oats','Grain',500,389,10],['eggs','Animal protein',600,155,10],
 ['chicken_breast','Animal protein',800,165,8],['white_rice','Grain',1000,130,8],
 ['quinoa','Grain',400,368,7],['black_beans','Legume',500,132,7],
 ['turkey_breast','Animal protein',600,135,6],['brown_rice','Grain',800,111,6],
 ['garlic','Seasoning',100,149,5],['banana','Fruit',300,89,5],
 ['olive_oil','Fat',200,884,5],['spinach','Vegetable',200,23,4]
].forEach(([k,c,q,cal,d]) => db.pantry.push(pEntry(BOB,k,c,q,cal,d)));

// Eva (MUSCLE_GAIN)
[['oats','Grain',400,389,5],['eggs','Animal protein',400,155,5],
 ['chicken_breast','Animal protein',600,165,4],['salmon','Animal protein',400,156,4],
 ['quinoa','Grain',300,368,3],['sweet_potato','Vegetable',500,86,3],
 ['spinach','Vegetable',200,23,3],['avocado','Fat',300,160,2],
 ['brown_rice','Grain',600,111,2],['banana','Fruit',300,89,2],
 ['garlic','Seasoning',80,149,1],['olive_oil','Fat',150,884,1]
].forEach(([k,c,q,cal,d]) => db.pantry.push(pEntry(EVA,k,c,q,cal,d)));

// Frank (WEIGHT_LOSS, GLUTEN_FREE – no wheat/pasta)
[['oats','Grain',400,389,10],['eggs','Animal protein',500,155,10],
 ['chicken_breast','Animal protein',700,165,8],['salmon','Animal protein',500,156,8],
 ['white_rice','Grain',800,130,7],['broccoli','Vegetable',400,34,7],
 ['tomato','Vegetable',300,18,6],['spinach','Vegetable',200,23,6],
 ['sweet_potato','Vegetable',400,86,5],['olive_oil','Fat',150,884,5],
 ['garlic','Seasoning',80,149,4],['lemon','Fruit',200,29,4]
].forEach(([k,c,q,cal,d]) => db.pantry.push(pEntry(FRANK,k,c,q,cal,d)));

// ── metabolic-adaptation-logs (Dan plateau + Alice initial + Eva recalculation) ─
[
  mal(DAN,'WEIGHT_LOGGED',1900,1900,1744,1744,2398,2398,'Weight unchanged at 82kg – plateau day 1',14),
  mal(DAN,'WEIGHT_LOGGED',1900,1900,1744,1744,2398,2398,'Weight unchanged at 82kg – plateau day 3',12),
  mal(DAN,'WEIGHT_LOGGED',1900,1900,1744,1744,2398,2398,'Weight unchanged at 82kg – plateau day 7',8),
  mal(DAN,'WEIGHT_LOGGED',1900,1900,1744,1744,2398,2398,'Weight unchanged at 82kg – plateau day 10',5),
  mal(DAN,'WEIGHT_LOGGED',1900,1900,1744,1744,2398,2398,'Weight unchanged at 82kg – plateau day 14',0),
  mal(DAN,'STAGNATION_DETECTED',1900,1750,1744,1744,2398,2248,'Strategy adjustment suggested: caloric deficit increased',0),
  mal(ALICE,'ONBOARDING_COMPLETED',0,1440,1410,1410,1939,1939,'Initial targets set on registration',41),
  mal(ALICE,'WEIGHT_LOGGED',1440,1440,1396,1396,1920,1920,'Targets recalculated after 2kg loss',20),
  mal(EVA,'ONBOARDING_COMPLETED',0,2380,1354,1354,2336,2336,'Initial targets set on registration',34),
  mal(EVA,'GOAL_SWITCH',2380,2380,1354,1354,2336,2336,'Goal confirmed: MUSCLE_GAIN',20),
  mal(FRANK,'ONBOARDING_COMPLETED',0,1880,1730,1730,2378,2378,'Initial targets set; GLUTEN_FREE restriction active',27),
  mal(FRANK,'WEIGHT_LOGGED',1880,1880,1714,1714,2357,2357,'Targets recalculated after 2kg loss',10)
].forEach(e => db['metabolic-adaptation-logs'].push(e));

// ── Write ─────────────────────────────────────────────────────────────────────
fs.writeFileSync(DB, JSON.stringify(db, null, 2));

const counts = ['users','nutrition-log','foods','body-metrics','behavioral-progress',
  'daily-balance','body-compositions','activity-logs','wearable-connections',
  'pantry','ingredient-catalog','recipes','subscriptions','billing-history',
  'eating-behavior-patterns','recovery-plans','user-location-snapshots',
  'travel-contexts','recommendation-sessions','metabolic-adaptation-logs']
  .map(k => `  ${k}: ${db[k].length}`).join('\n');

console.log(`\n✓ db.json written\n\nCollection counts:\n${counts}\n`);
