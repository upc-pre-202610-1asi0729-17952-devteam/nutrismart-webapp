import { BaseEntity } from '../../../../shared/infrastructure/base-entity';
import { AdherenceStatus } from './adherence-status.enum';

/**
 * Constructor DTO for creating a {@link RecommendationSession} instance.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export interface RecommendationSessionProps {
  /** Unique numeric identifier. */
  id: number;
  /** ID of the user this session belongs to. */
  userId: number;
  /** Current adherence status driving recommendation strategy. */
  adherenceStatus: AdherenceStatus;
  /** Number of consecutive missed days (used in AT_RISK / DROPPED logic). */
  consecutiveMisses: number;
  /** Kcal target for simplified "start small" intervention plan. */
  simplifiedKcalTarget: number;
  /** ISO date string of the session creation. */
  createdAt: string;
  /** Whether this session is still active. */
  isActive: boolean;
}

/**
 * Domain entity representing an active recommendation session.
 *
 * Aggregates adherence state and context references to determine which
 * recommendation strategy (weather, preventive, or intervention) should
 * be applied. Non-anemic: exposes domain behaviour methods that encode
 * the strategy-selection business rules.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export class RecommendationSession implements BaseEntity {
  #id: number;
  #userId: number;
  #adherenceStatus: AdherenceStatus;
  #consecutiveMisses: number;
  #simplifiedKcalTarget: number;
  #createdAt: string;
  #isActive: boolean;

  constructor(props: RecommendationSessionProps) {
    this.#id                   = props.id;
    this.#userId               = props.userId;
    this.#adherenceStatus      = props.adherenceStatus;
    this.#consecutiveMisses    = props.consecutiveMisses;
    this.#simplifiedKcalTarget = props.simplifiedKcalTarget;
    this.#createdAt            = props.createdAt;
    this.#isActive             = props.isActive;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  /** Unique numeric identifier. */
  get id(): number { return this.#id; }
  set id(v: number) { this.#id = v; }

  /** Owner user ID. */
  get userId(): number { return this.#userId; }
  set userId(v: number) { this.#userId = v; }

  /** Current adherence status. */
  get adherenceStatus(): AdherenceStatus { return this.#adherenceStatus; }
  set adherenceStatus(v: AdherenceStatus) { this.#adherenceStatus = v; }

  /** Consecutive missed days. */
  get consecutiveMisses(): number { return this.#consecutiveMisses; }
  set consecutiveMisses(v: number) { this.#consecutiveMisses = v; }

  /** Simplified kcal target for intervention plans. */
  get simplifiedKcalTarget(): number { return this.#simplifiedKcalTarget; }
  set simplifiedKcalTarget(v: number) { this.#simplifiedKcalTarget = v; }

  /** Session creation ISO timestamp. */
  get createdAt(): string { return this.#createdAt; }
  set createdAt(v: string) { this.#createdAt = v; }

  /** Whether the session is still active. */
  get isActive(): boolean { return this.#isActive; }
  set isActive(v: boolean) { this.#isActive = v; }

  // ─── Domain Behaviour ─────────────────────────────────────────────────────

  /**
   * Returns `true` when the session requires a preventive recommendation
   * card (AT_RISK adherence, before full plan abandonment).
   */
  requiresPreventiveRecommendation(): boolean {
    return this.#adherenceStatus === AdherenceStatus.AT_RISK;
  }

  /**
   * Returns `true` when the session requires an intervention plan card
   * (user has already abandoned the plan).
   */
  requiresInterventionRecommendation(): boolean {
    return this.#adherenceStatus === AdherenceStatus.DROPPED;
  }

  /**
   * Returns `true` when standard weather-based recommendations should be shown
   * (user is on track with no special adherence alert).
   */
  usesWeatherRecommendations(): boolean {
    return this.#adherenceStatus === AdherenceStatus.ON_TRACK;
  }

  /**
   * Generates the event label string emitted when a preventive recommendation
   * is displayed (PreventiveRecommendationGenerated domain event label).
   */
  preventiveEventLabel(): string {
    return `PreventiveRecommendationGenerated · ${this.#consecutiveMisses} day${this.#consecutiveMisses !== 1 ? 's' : ''} missed`;
  }

  /**
   * Generates the event label string emitted when an intervention plan is
   * displayed (InterventionRecommendationGenerated domain event label).
   */
  interventionEventLabel(): string {
    return `InterventionRecommendationGenerated · Day 1 of ${this.#consecutiveMisses}-day recovery`;
  }
}
