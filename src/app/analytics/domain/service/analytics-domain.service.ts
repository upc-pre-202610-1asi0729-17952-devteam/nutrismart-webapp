import { Injectable } from '@angular/core';
import {
  AdherenceHistoryEntry,
  AdherenceStatus,
  BehavioralEvent,
  WeightChangeDirection,
  WeightChangeStatus,
} from '../model/analytics-models';

/** Encapsulates all business rules and invariants for the Analytics context. */
@Injectable({ providedIn: 'root' })
export class AnalyticsDomainService {

  /**
   * Classifies daily adherence based on calories consumed vs. target.
   * Invariant: 0 kcal = DROPPED; ≥80 % = ON_TRACK; ≥50 % = AT_RISK; else DROPPED.
   * @param calories - Total calories consumed that day.
   * @param target - User's daily calorie target.
   */
  classifyAdherence(calories: number, target: number): AdherenceStatus {
    if (calories === 0) return 'DROPPED';
    if (calories >= target * 0.8) return 'ON_TRACK';
    if (calories >= target * 0.5) return 'AT_RISK';
    return 'DROPPED';
  }

  /**
   * Returns true when a day's calories reach the 80 % completeness threshold.
   * @param calories - Total calories consumed that day.
   * @param target - User's daily calorie target.
   */
  isCompleteDay(calories: number, target: number): boolean {
    return calories >= target * 0.8;
  }

  /**
   * Counts consecutive days with at least one log entry, going back from the most recent date.
   * @param dailyMap - Map of date strings to aggregated nutritional data.
   * @param dateArray - Ordered array of date strings covering the selected period.
   */
  computeStreak(dailyMap: Map<string, unknown>, dateArray: string[]): number {
    let streak = 0;
    for (let i = dateArray.length - 1; i >= 0; i--) {
      if (dailyMap.has(dateArray[i])) streak++;
      else break;
    }
    return streak;
  }

  /**
   * Detects behavioral transitions across consecutive adherence entries.
   * Emits BehavioralDropDetected, ConsistencyRecovered, and NutritionalAbandonmentRisk events.
   * @param history - Ordered adherence entries for the selected period.
   */
  detectBehavioralTransitions(history: AdherenceHistoryEntry[]): BehavioralEvent[] {
    const events: BehavioralEvent[] = [];
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1].status;
      const curr = history[i].status;
      if (prev !== 'DROPPED' && curr === 'DROPPED')
        events.push({ date: history[i].date, description: 'BehavioralDropDetected' });
      else if (prev === 'DROPPED' && curr === 'ON_TRACK')
        events.push({ date: history[i].date, description: 'ConsistencyRecovered' });
      else if (prev === 'ON_TRACK' && curr === 'AT_RISK')
        events.push({ date: history[i].date, description: 'NutritionalAbandonmentRisk' });
    }
    return events;
  }

  /**
   * Maps weight change direction to a status value based on the user's goal.
   * Losing weight is positive for WEIGHT_LOSS; gaining is positive for MUSCLE_GAIN.
   * @param direction - Observed weight change direction.
   * @param goal - User's nutritional goal.
   */
  resolveWeightChangeStatus(
    direction: WeightChangeDirection,
    goal: 'WEIGHT_LOSS' | 'MUSCLE_GAIN',
  ): WeightChangeStatus {
    if (direction === 'none') return 'neutral';
    const downIsGood = goal === 'WEIGHT_LOSS';
    if (downIsGood) return direction === 'down' ? 'positive' : 'negative';
    return direction === 'up' ? 'positive' : 'negative';
  }

  /**
   * Computes protein compliance as a percentage string.
   * @param consumed - Average protein consumed (g).
   * @param target - Daily protein target (g).
   */
  computeProteinCompliance(consumed: number, target: number): string {
    if (target === 0) return '0%';
    return `${Math.round((consumed / target) * 100)}%`;
  }
}
