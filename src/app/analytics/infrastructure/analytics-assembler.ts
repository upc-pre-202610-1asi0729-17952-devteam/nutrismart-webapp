import { inject, Injectable } from '@angular/core';
import {
  AnalyticsData,
  AnalyticsPeriod,
  AdherenceHistoryEntry,
  BehavioralEvent,
  DailyCaloriesHistory,
  MacroAnalysis,
  WeightChangeDirection,
} from '../domain/model/analytics-models';
import { AnalyticsDomainService } from '../domain/service/analytics-domain.service';
import { AnalyticsRawInput, UserTargets } from './analytics-resource';

@Injectable({ providedIn: 'root' })
export class AnalyticsAssembler {
  private readonly domain = inject(AnalyticsDomainService);

  /**
   * Converts raw API data into a fully computed {@link AnalyticsData} domain object.
   * DTO aggregation lives here; all business rules are delegated to {@link AnalyticsDomainService}.
   *
   * @param raw - Raw nutrition logs and weight entries from the API.
   * @param period - Selected analytics period.
   * @param userGoal - User's nutritional goal (defaults to WEIGHT_LOSS).
   * @param targets - User's daily macro targets.
   */
  assembleAnalyticsData(
    raw: AnalyticsRawInput,
    period: AnalyticsPeriod,
    userGoal: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' = 'WEIGHT_LOSS',
    targets: UserTargets,
  ): AnalyticsData {
    const days  = period === '7_DAYS' ? 7 : period === '30_DAYS' ? 30 : 90;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateArray = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - 1 - i));
      return d.toISOString().split('T')[0];
    });

    const dateSet = new Set(dateArray);

    // Aggregate nutrition logs by day (DTO aggregation — not domain logic)
    const dailyMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number; fiber: number }>();
    for (const log of raw.nutritionLogs) {
      const date = log.loggedAt.split('T')[0];
      if (!dateSet.has(date)) continue;
      const prev = dailyMap.get(date) ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      dailyMap.set(date, {
        calories: prev.calories + (log.calories ?? 0),
        protein:  prev.protein  + (log.protein  ?? 0),
        carbs:    prev.carbs    + (log.carbs    ?? 0),
        fat:      prev.fat      + (log.fat      ?? 0),
        fiber:    prev.fiber    + (log.fiber    ?? 0),
      });
    }

    const loggedDays = dateArray.filter(d => dailyMap.has(d));
    const n = loggedDays.length || 1;

    const avg = (key: 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber') =>
      Math.round(loggedDays.reduce((sum, d) => sum + (dailyMap.get(d)?.[key] ?? 0), 0) / n);

    const averageCalorieIntake = loggedDays.length ? avg('calories') : 0;
    const averageProteinIntake = loggedDays.length ? avg('protein')  : 0;

    const currentStreak = this.domain.computeStreak(dailyMap, dateArray);

    const dailyCaloriesHistory: DailyCaloriesHistory[] = dateArray.map(date => ({
      date,
      calories: dailyMap.get(date)?.calories ?? 0,
      goal: targets.dailyCalorieTarget,
    }));

    const daysWithCompleteLog: boolean[] = dateArray.map(date =>
      this.domain.isCompleteDay(dailyMap.get(date)?.calories ?? 0, targets.dailyCalorieTarget)
    );

    const avgProtein = loggedDays.length ? avg('protein') : 0;
    const avgCarbs   = loggedDays.length ? avg('carbs')   : 0;
    const avgFat     = loggedDays.length ? avg('fat')     : 0;
    const avgFiber   = loggedDays.length ? avg('fiber')   : 0;

    const macroAnalysis: MacroAnalysis[] = [
      { key: 'protein', name: 'analytics.macros.protein', consumed: avgProtein, target: targets.proteinTarget, colorClass: 'macro-protein', isAboveTarget: avgProtein > targets.proteinTarget },
      { key: 'carbs',   name: 'analytics.macros.carbs',   consumed: avgCarbs,   target: targets.carbsTarget,   colorClass: 'macro-carbs',   isAboveTarget: avgCarbs   > targets.carbsTarget   },
      { key: 'fat',     name: 'analytics.macros.fat',     consumed: avgFat,     target: targets.fatTarget,     colorClass: 'macro-fat',     isAboveTarget: avgFat     > targets.fatTarget     },
      { key: 'fiber',   name: 'analytics.macros.fiber',   consumed: avgFiber,   target: targets.fiberTarget,   colorClass: 'macro-fiber',   isAboveTarget: avgFiber   > targets.fiberTarget   },
    ];

    const weightEvolution = [...raw.weightEntries]
      .sort((a, b) => (a.loggedAt ?? '').localeCompare(b.loggedAt ?? ''))
      .map(e => ({ date: (e.loggedAt ?? '').split('T')[0], weight: e.weightKg }));

    let weightChange = 0;
    let weightChangeDirection: WeightChangeDirection = 'none';
    if (weightEvolution.length >= 2) {
      const diff = weightEvolution[weightEvolution.length - 1].weight - weightEvolution[0].weight;
      weightChange = parseFloat(diff.toFixed(1));
      weightChangeDirection = diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : 'none';
    }

    const weightChangeStatus = this.domain.resolveWeightChangeStatus(weightChangeDirection, userGoal);

    const lastMetric = raw.weightEntries.at(-1);
    const goalWeight = lastMetric?.targetWeightKg;

    let adherenceHistory: AdherenceHistoryEntry[] | undefined;
    let behavioralEvents: BehavioralEvent[] | undefined;

    if (period !== '7_DAYS') {
      adherenceHistory = dateArray.map(date => ({
        date,
        status: this.domain.classifyAdherence(
          dailyMap.get(date)?.calories ?? 0,
          targets.dailyCalorieTarget,
        ),
      }));
      behavioralEvents = this.domain.detectBehavioralTransitions(adherenceHistory);
    }

    const proteinMacro = macroAnalysis.find(m => m.key === 'protein');
    const proteinCompliance = proteinMacro
      ? this.domain.computeProteinCompliance(proteinMacro.consumed, proteinMacro.target)
      : undefined;

    return {
      period,
      averageCalorieIntake,
      averageProteinIntake,
      currentStreak,
      weightChange,
      weightChangeDirection,
      weightChangeStatus,
      dailyCaloriesHistory,
      macroAnalysis,
      daysWithCompleteLog,
      weightEvolution,
      goalWeight,
      adherenceHistory,
      behavioralEvents,
      proteinCompliance,
    };
  }
}
