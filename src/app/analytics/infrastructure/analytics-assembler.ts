import { Injectable } from '@angular/core';
import { AnalyticsData, AnalyticsPeriod, WeightChangeDirection, WeightChangeStatus } from '../domain/model/analytics-models';

@Injectable({ providedIn: 'root' })
export class AnalyticsAssembler {
  assembleAnalyticsData(
    rawData: any,
    period: AnalyticsPeriod,
    userGoal: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' = 'WEIGHT_LOSS',
  ): AnalyticsData {
    const weightChange: number = rawData.weightChange ?? 0;
    const direction: WeightChangeDirection =
      weightChange > 0 ? 'up' : weightChange < 0 ? 'down' : 'none';

    const status: WeightChangeStatus = this.resolveStatus(direction, userGoal);

    return {
      period,
      averageCalorieIntake: rawData.averageCalorieIntake ?? 0,
      averageProteinIntake: rawData.averageProteinIntake ?? 0,
      currentStreak: rawData.currentStreak ?? 0,
      weightChange,
      weightChangeDirection: direction,
      weightChangeStatus: status,
      dailyCaloriesHistory: rawData.dailyCaloriesHistory ?? [],
      macroAnalysis: rawData.macroAnalysis ?? [],
      daysWithCompleteLog: rawData.daysWithCompleteLog ?? [],
      weightEvolution: rawData.weightEvolution ?? [],
      goalWeight: rawData.goalWeight,
      adherenceHistory: rawData.adherenceHistory,
      behavioralEvents: rawData.behavioralEvents,
      proteinCompliance: rawData.proteinCompliance,
    };
  }

  private resolveStatus(
    direction: WeightChangeDirection,
    goal: 'WEIGHT_LOSS' | 'MUSCLE_GAIN',
  ): WeightChangeStatus {
    if (direction === 'none') return 'neutral';
    const downIsGood = goal === 'WEIGHT_LOSS';
    if (downIsGood) return direction === 'down' ? 'positive' : 'negative';
    return direction === 'up' ? 'positive' : 'negative';
  }
}
