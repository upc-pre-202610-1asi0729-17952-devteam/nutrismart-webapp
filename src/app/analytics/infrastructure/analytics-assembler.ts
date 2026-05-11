import { Injectable } from '@angular/core';
import { AnalyticsData, AnalyticsPeriod } from '../domain/model/analytics-models';

/**
 * Assembles raw data from the Analytics API into the domain's AnalyticsData model.
 *
 * This class is responsible for any data transformations, calculations, or
 * default value assignments needed to convert API responses into a consistent
 * domain model for the application layer.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsAssembler {
  /**
   * Assembles a full AnalyticsData object from a raw API response.
   *
   * @param rawData The raw data received from the Analytics API.
   * @returns A fully formed AnalyticsData domain object.
   */
  assembleAnalyticsData(rawData: any, period: AnalyticsPeriod): AnalyticsData {
    // In a real application, this would involve more complex mapping,
    // validation, and potentially calculations based on the rawData.
    // For now, we assume rawData is largely compatible with AnalyticsData.

    // Example of a simple transformation/defaulting:
    const assembledData: AnalyticsData = {
      period: period,
      averageCalorieIntake: rawData.averageCalorieIntake ?? 0,
      averageProteinIntake: rawData.averageProteinIntake ?? 0,
      currentStreak: rawData.currentStreak ?? 0,
      weightChange: rawData.weightChange ?? 0,
      weightChangeDirection: rawData.weightChange > 0 ? 'up' : (rawData.weightChange < 0 ? 'down' : 'none'),
      weightChangeStatus: rawData.weightChange > 0 ? 'positive' : (rawData.weightChange < 0 ? 'negative' : 'neutral'), // Assuming positive for muscle gain, negative for weight loss
      dailyCaloriesHistory: rawData.dailyCaloriesHistory ?? [],
      macroAnalysis: rawData.macroAnalysis ?? [],
      daysWithCompleteLog: rawData.daysWithCompleteLog ?? [],
      weightEvolution: rawData.weightEvolution ?? [],
      goalWeight: rawData.goalWeight,
      adherenceHistory: rawData.adherenceHistory,
      behavioralEvents: rawData.behavioralEvents,
      proteinCompliance: rawData.proteinCompliance,
    };

    return assembledData;
  }

  // Potentially other assembly methods for specific parts of the analytics data
  // if the API returns them separately and they need specific processing.
}
