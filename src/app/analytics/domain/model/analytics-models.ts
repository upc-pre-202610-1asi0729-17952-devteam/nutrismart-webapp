export type AnalyticsPeriod = '7_DAYS' | '30_DAYS' | '90_DAYS';
export type WeightChangeDirection = 'up' | 'down' | 'none';
export type WeightChangeStatus = 'positive' | 'negative' | 'neutral';
export type AdherenceStatus = 'ON_TRACK' | 'AT_RISK' | 'DROPPED' | 'RECOVERED';
export type MacroColorKey = 'macro-protein' | 'macro-carbs' | 'macro-fat' | 'macro-fiber';
export type MacroKey = 'protein' | 'carbs' | 'fat' | 'fiber';

export interface DailyCaloriesHistory {
  date: string;
  calories: number;
  goal: number;
}

export interface MacroAnalysis {
  /** Stable identifier used to look up this macro programmatically. */
  key: MacroKey;
  /** i18n translation key rendered in the UI. */
  name: string;
  consumed: number;
  target: number;
  colorClass: MacroColorKey;
  isAboveTarget: boolean;
}

export interface AdherenceHistoryEntry {
  date: string;
  status: AdherenceStatus;
}

export interface BehavioralEvent {
  date: string;
  description: string;
}

export interface AnalyticsData {
  period: AnalyticsPeriod;
  averageCalorieIntake: number;
  averageProteinIntake: number;
  currentStreak: number;
  weightChange: number;
  weightChangeDirection: WeightChangeDirection;
  weightChangeStatus: WeightChangeStatus;
  dailyCaloriesHistory: DailyCaloriesHistory[];
  macroAnalysis: MacroAnalysis[];
  daysWithCompleteLog: boolean[];
  weightEvolution: { date: string; weight: number }[];
  goalWeight?: number;
  adherenceHistory?: AdherenceHistoryEntry[];
  behavioralEvents?: BehavioralEvent[];
  proteinCompliance?: string;
}
