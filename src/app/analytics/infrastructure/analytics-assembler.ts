import { Injectable } from '@angular/core';
import {
  AnalyticsData, AnalyticsPeriod,
  AdherenceHistoryEntry, AdherenceStatus,
  BehavioralEvent, DailyCaloriesHistory, MacroAnalysis,
  WeightChangeDirection, WeightChangeStatus,
} from '../domain/model/analytics-models';
import { AnalyticsRawInput, UserTargets } from './analytics-resource';

@Injectable({ providedIn: 'root' })
export class AnalyticsAssembler {

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

    // ── Aggregate logs by day ────────────────────────────────────────────────
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

    // ── Core metrics ─────────────────────────────────────────────────────────
    const averageCalorieIntake = loggedDays.length ? avg('calories') : 0;
    const averageProteinIntake = loggedDays.length ? avg('protein')  : 0;

    // ── Streak ───────────────────────────────────────────────────────────────
    let currentStreak = 0;
    for (let i = dateArray.length - 1; i >= 0; i--) {
      if (dailyMap.has(dateArray[i])) currentStreak++;
      else break;
    }

    // ── Daily history ─────────────────────────────────────────────────────────
    const dailyCaloriesHistory: DailyCaloriesHistory[] = dateArray.map(date => ({
      date,
      calories: dailyMap.get(date)?.calories ?? 0,
      goal:     targets.dailyCalorieTarget,
    }));

    // ── Days with complete log (≥ 80 % of calorie target) ────────────────────
    const daysWithCompleteLog: boolean[] = dateArray.map(date => {
      const cals = dailyMap.get(date)?.calories ?? 0;
      return cals >= targets.dailyCalorieTarget * 0.8;
    });

    // ── Macro analysis ───────────────────────────────────────────────────────
    const macroAnalysis: MacroAnalysis[] = [
      { name: 'Protein',       consumed: loggedDays.length ? avg('protein') : 0, target: targets.proteinTarget, colorClass: 'macro-protein' },
      { name: 'Carbohydrates', consumed: loggedDays.length ? avg('carbs')   : 0, target: targets.carbsTarget,   colorClass: 'macro-carbs'   },
      { name: 'Fat',           consumed: loggedDays.length ? avg('fat')     : 0, target: targets.fatTarget,     colorClass: 'macro-fat'     },
      { name: 'Fiber',         consumed: loggedDays.length ? avg('fiber')   : 0, target: targets.fiberTarget,   colorClass: 'macro-fiber'   },
    ];

    // ── Weight evolution ─────────────────────────────────────────────────────
    const weightEvolution = [...raw.weightEntries]
      .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
      .map(e => ({ date: e.logged_at.split('T')[0], weight: e.weight_kg }));

    // ── Weight change ─────────────────────────────────────────────────────────
    let weightChange = 0;
    let weightChangeDirection: WeightChangeDirection = 'none';
    if (weightEvolution.length >= 2) {
      const diff = weightEvolution[weightEvolution.length - 1].weight - weightEvolution[0].weight;
      weightChange = parseFloat(diff.toFixed(1));
      weightChangeDirection = diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : 'none';
    }
    const weightChangeStatus: WeightChangeStatus = this.resolveStatus(weightChangeDirection, userGoal);

    // ── Goal weight ───────────────────────────────────────────────────────────
    const lastMetric = raw.weightEntries.at(-1);
    const goalWeight = lastMetric?.target_weight_kg;

    // ── Adherence history (30d / 90d only) ───────────────────────────────────
    let adherenceHistory: AdherenceHistoryEntry[] | undefined;
    let behavioralEvents: BehavioralEvent[] | undefined;

    if (period !== '7_DAYS') {
      adherenceHistory = dateArray.map(date => {
        const cals = dailyMap.get(date)?.calories ?? 0;
        let status: AdherenceStatus;
        if      (cals === 0)                                     status = 'DROPPED';
        else if (cals >= targets.dailyCalorieTarget * 0.8)      status = 'ON_TRACK';
        else if (cals >= targets.dailyCalorieTarget * 0.5)      status = 'AT_RISK';
        else                                                     status = 'DROPPED';
        return { date, status };
      });

      const events: BehavioralEvent[] = [];
      for (let i = 1; i < adherenceHistory.length; i++) {
        const prev = adherenceHistory[i - 1].status;
        const curr = adherenceHistory[i].status;
        if (prev !== 'DROPPED' && curr === 'DROPPED')
          events.push({ date: adherenceHistory[i].date, description: 'BehavioralDropDetected' });
        else if (prev === 'DROPPED' && curr === 'ON_TRACK')
          events.push({ date: adherenceHistory[i].date, description: 'ConsistencyRecovered' });
        else if (prev === 'ON_TRACK' && curr === 'AT_RISK')
          events.push({ date: adherenceHistory[i].date, description: 'NutritionalAbandonmentRisk' });
      }
      behavioralEvents = events;
    }

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
