/**
 * Mock authenticated user for Sprint 2 frontend development.
 *
 * All team members import this constant to avoid depending on the IAM bounded
 * context being fully implemented. Replace with real auth state once the
 * login flow is complete.
 *
 * @remarks
 * - `restrictions` controls which foods the recommendation engine blocks.
 * - `dailyCalorieTarget`, `proteinTarget`, `carbsTarget`, `fatTarget` and
 *   `fiberTarget` are calculated using the Mifflin-St Jeor formula for Ana's
 *   physical data with a MODERATE activity level.
 */
export const MOCK_USER = {
  id: 1,
  firstName: 'Ana',
  lastName: 'García',
  email: 'ana.garcia@gmail.com',
  goal: 'WEIGHT_LOSS',
  weight: 70.2,
  height: 163,
  activityLevel: 'MODERATE',
  plan: 'PRO',
  restrictions: ['LACTOSE_FREE', 'SEAFOOD_FREE'],
  medicalConditions: [] as string[],
  dailyCalorieTarget: 1800,
  proteinTarget: 120,
  carbsTarget: 200,
  fatTarget: 55,
  fiberTarget: 25,
  adherenceStatus: 'ON_TRACK',
  streak: 5,
  consecutiveMisses: 0,
  currentWeight: 70.2,
  targetWeight: 65.0,
  bmi: 26.4,
  bmr: 1480,
  tdee: 2035,
  activeCaloriesBurned: 300,
  googleFitConnected: true,
};
