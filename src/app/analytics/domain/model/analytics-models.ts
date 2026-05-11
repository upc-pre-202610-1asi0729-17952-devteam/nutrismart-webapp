// Placeholder for Analytics data models

export interface DailyCaloriesHistory {
  date: string;
  calories: number;
  goal: number;
}

export interface MacroAnalysis {
  name: string;
  consumed: number;
  target: number;
  colorClass: string;
  isAboveTarget?: boolean;
}

export interface AdherenceHistoryEntry {
  date: string;
  status: 'ON_TRACK' | 'AT_RISK' | 'DROPPED' | 'RECOVERED';
}

export interface BehavioralEvent {
  date: string;
  description: string;
}

export interface AnalyticsData {
  period: '7_DAYS' | '30_DAYS' | '90_DAYS';
  averageCalorieIntake: number;
  averageProteinIntake: number;
  currentStreak: number;
  weightChange: number;
  weightChangeDirection: 'up' | 'down' | 'none';
  weightChangeStatus: 'positive' | 'negative' | 'neutral';
  dailyCaloriesHistory: DailyCaloriesHistory[];
  macroAnalysis: MacroAnalysis[];
  daysWithCompleteLog: boolean[]; // For the 7 dots
  weightEvolution: { date: string; weight: number }[];
  goalWeight?: number;
  adherenceHistory?: AdherenceHistoryEntry[]; // Only for 30 days
  behavioralEvents?: BehavioralEvent[]; // Only for 30 days
  proteinCompliance?: string; // For MUSCLE_GAIN
}

export type AnalyticsPeriod = '7_DAYS' | '30_DAYS' | '90_DAYS';
