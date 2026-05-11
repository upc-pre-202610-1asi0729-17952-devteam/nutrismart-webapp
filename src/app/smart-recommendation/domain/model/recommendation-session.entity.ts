import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { AdherenceStatus } from './adherence-status.enum';

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
}
