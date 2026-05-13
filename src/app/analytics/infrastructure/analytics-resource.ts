export interface NutritionLogResource {
  id: string;
  userId: string | number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  loggedAt: string;
}

export interface BodyMetricResource {
  id: string;
  userId: string;
  weightKg: number;
  targetWeightKg?: number;
  loggedAt: string;
}

export interface AnalyticsRawInput {
  nutritionLogs: NutritionLogResource[];
  weightEntries: BodyMetricResource[];
}

export interface UserTargets {
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  fiberTarget: number;
}
