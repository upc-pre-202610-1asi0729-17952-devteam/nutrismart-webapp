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
  user_id: string;
  weight_kg: number;
  target_weight_kg?: number;
  logged_at: string;
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
