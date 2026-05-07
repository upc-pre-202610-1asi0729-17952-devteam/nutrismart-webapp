/**
 * Mock authenticated user for Sprint 2 frontend development.
 * All team members use this mock to avoid depending on IAM being complete.
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
