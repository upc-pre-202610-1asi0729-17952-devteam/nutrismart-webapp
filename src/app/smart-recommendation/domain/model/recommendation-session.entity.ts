import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { AdherenceStatus } from './adherence-status.enum';
import { ContextualTargetAdjustment } from './contextual-target-adjustment.value-object';

export interface RecommendationSessionProps {
  id: number;
  userId: number;
  adherenceStatus: AdherenceStatus;
  consecutiveMisses: number;
  simplifiedKcalTarget: number;
  createdAt: string;
  isActive: boolean;
}

export class RecommendationSession implements BaseEntity {
  #id: number;
  #userId: number;
  #adherenceStatus: AdherenceStatus;
  #consecutiveMisses: number;
  #simplifiedKcalTarget: number;
  #createdAt: string;
  #isActive: boolean;
  #contextualAdjustment: ContextualTargetAdjustment | null = null;

  constructor(props: RecommendationSessionProps) {
    this.#id                   = props.id;
    this.#userId               = props.userId;
    this.#adherenceStatus      = props.adherenceStatus;
    this.#consecutiveMisses    = props.consecutiveMisses;
    this.#simplifiedKcalTarget = props.simplifiedKcalTarget;
    this.#createdAt            = props.createdAt;
    this.#isActive             = props.isActive;
  }

  get id(): number { return this.#id; }
  set id(v: number) { this.#id = v; }

  get userId(): number { return this.#userId; }
  set userId(v: number) { this.#userId = v; }

  get adherenceStatus(): AdherenceStatus { return this.#adherenceStatus; }
  set adherenceStatus(v: AdherenceStatus) { this.#adherenceStatus = v; }

  get consecutiveMisses(): number { return this.#consecutiveMisses; }
  set consecutiveMisses(v: number) { this.#consecutiveMisses = v; }

  get simplifiedKcalTarget(): number { return this.#simplifiedKcalTarget; }
  set simplifiedKcalTarget(v: number) { this.#simplifiedKcalTarget = v; }

  get createdAt(): string { return this.#createdAt; }
  set createdAt(v: string) { this.#createdAt = v; }

  get isActive(): boolean { return this.#isActive; }
  set isActive(v: boolean) { this.#isActive = v; }

  /** The active contextual adjustment, or null if none has been applied. */
  get contextualAdjustment(): ContextualTargetAdjustment | null { return this.#contextualAdjustment; }

  /**
   * Calorie target after applying the active contextual adjustment.
   * Falls back to {@link simplifiedKcalTarget} when no adjustment is set.
   */
  get adjustedKcalTarget(): number {
    return this.#contextualAdjustment
      ? this.#contextualAdjustment.apply(this.#simplifiedKcalTarget)
      : this.#simplifiedKcalTarget;
  }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  requiresPreventiveRecommendation(): boolean {
    return this.#adherenceStatus === AdherenceStatus.AT_RISK;
  }

  requiresInterventionRecommendation(): boolean {
    return this.#adherenceStatus === AdherenceStatus.DROPPED;
  }

  usesWeatherRecommendations(): boolean {
    return this.#adherenceStatus === AdherenceStatus.ON_TRACK;
  }

  preventiveEventLabel(): string {
    return `PreventiveRecommendationGenerated · ${this.#consecutiveMisses} day${this.#consecutiveMisses !== 1 ? 's' : ''} missed`;
  }

  interventionEventLabel(): string {
    return `InterventionRecommendationGenerated · Day 1 of ${this.#consecutiveMisses}-day recovery`;
  }

  /**
   * Applies a contextual calorie adjustment to this session.
   *
   * Replaces any previously stored adjustment; the new adjusted target is
   * available immediately via {@link adjustedKcalTarget}.
   *
   * @param adjustment - The contextual adjustment derived from travel or weather.
   */
  applyContextualAdjustment(adjustment: ContextualTargetAdjustment): void {
    this.#contextualAdjustment = adjustment;
  }
}
