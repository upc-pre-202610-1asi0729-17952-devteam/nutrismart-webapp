import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { AdherenceDropTrigger } from './adherence-drop-trigger.enum';
import { RecoveryPlanStatus } from './recovery-plan-status.enum';
import { RecoveryAction } from './recovery-action.value-object';
import { RecoveryActionType } from './recovery-action-type.enum';

export interface RecoveryPlanProps {
  id?:          number;
  userId:       number;
  trigger:      AdherenceDropTrigger;
  status:       RecoveryPlanStatus;
  actions:      RecoveryAction[];
  activatedAt:  string;
  resolvedAt?:  string | null;
}

/**
 * Domain entity representing a prescribed adherence recovery plan.
 *
 * Created automatically when the system detects a behavioral drop event.
 * Encapsulates the corrective actions the user should follow to regain
 * consistent nutritional adherence.
 */
export class RecoveryPlan implements BaseEntity {
  private _id:         number;
  private _userId:     number;
  private _trigger:    AdherenceDropTrigger;
  private _status:     RecoveryPlanStatus;
  private _actions:    RecoveryAction[];
  private _activatedAt: string;
  private _resolvedAt: string | null;

  constructor(props: RecoveryPlanProps) {
    this._id          = props.id ?? 0;
    this._userId      = props.userId;
    this._trigger     = props.trigger;
    this._status      = props.status;
    this._actions     = [...props.actions];
    this._activatedAt = props.activatedAt;
    this._resolvedAt  = props.resolvedAt ?? null;
  }

  // ─── Getters & Setters ────────────────────────────────────────────────────

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  get userId(): number { return this._userId; }

  get trigger(): AdherenceDropTrigger { return this._trigger; }

  get status(): RecoveryPlanStatus { return this._status; }

  /** Ordered list of corrective actions, sorted by ascending priority. */
  get actions(): RecoveryAction[] { return [...this._actions].sort((a, b) => a.priority - b.priority); }

  get activatedAt(): string { return this._activatedAt; }

  get resolvedAt(): string | null { return this._resolvedAt; }

  // ─── Business methods ─────────────────────────────────────────────────────

  /** Whether this plan is currently active. */
  isActive(): boolean {
    return this._status === RecoveryPlanStatus.ACTIVE;
  }

  /** Marks the plan as completed. */
  complete(date: string = new Date().toISOString()): void {
    this._status     = RecoveryPlanStatus.COMPLETED;
    this._resolvedAt = date;
  }

  /** Marks the plan as expired (user did not follow through). */
  expire(date: string = new Date().toISOString()): void {
    this._status     = RecoveryPlanStatus.EXPIRED;
    this._resolvedAt = date;
  }

  // ─── Factory ──────────────────────────────────────────────────────────────

  /**
   * Creates a new active recovery plan for the given trigger.
   *
   * Each trigger maps to a tailored set of corrective actions ordered by
   * their expected impact on re-engagement.
   *
   * @param userId  - User who needs the plan.
   * @param trigger - Event that caused the plan to be activated.
   * @param now     - ISO timestamp for the activation (defaults to current time).
   */
  static create(
    userId:  number,
    trigger: AdherenceDropTrigger,
    now:     string = new Date().toISOString(),
  ): RecoveryPlan {
    return new RecoveryPlan({
      userId,
      trigger,
      status:      RecoveryPlanStatus.ACTIVE,
      actions:     RecoveryPlan.actionsFor(trigger),
      activatedAt: now,
    });
  }

  /** Returns the prescribed actions for a given drop trigger. */
  private static actionsFor(trigger: AdherenceDropTrigger): RecoveryAction[] {
    const actionMap: Record<AdherenceDropTrigger, RecoveryAction[]> = {
      [AdherenceDropTrigger.STRATEGY_MISMATCH]: [
        new RecoveryAction({ type: RecoveryActionType.REDUCE_CALORIE_TARGET, descriptionKey: 'behavioral.recovery.action.reduce_calorie_target', priority: 1 }),
        new RecoveryAction({ type: RecoveryActionType.SIMPLIFY_TRACKING,     descriptionKey: 'behavioral.recovery.action.simplify_tracking',     priority: 2 }),
      ],
      [AdherenceDropTrigger.BEHAVIORAL_DROP]: [
        new RecoveryAction({ type: RecoveryActionType.LOG_ANY_MEAL,      descriptionKey: 'behavioral.recovery.action.log_any_meal',      priority: 1 }),
        new RecoveryAction({ type: RecoveryActionType.SIMPLIFY_TRACKING, descriptionKey: 'behavioral.recovery.action.simplify_tracking', priority: 2 }),
      ],
      [AdherenceDropTrigger.NUTRITIONAL_ABANDONMENT]: [
        new RecoveryAction({ type: RecoveryActionType.LOG_ANY_MEAL,        descriptionKey: 'behavioral.recovery.action.log_any_meal',        priority: 1 }),
        new RecoveryAction({ type: RecoveryActionType.FOCUS_SINGLE_MEAL,   descriptionKey: 'behavioral.recovery.action.focus_single_meal',   priority: 2 }),
        new RecoveryAction({ type: RecoveryActionType.SIMPLIFY_TRACKING,   descriptionKey: 'behavioral.recovery.action.simplify_tracking',   priority: 3 }),
      ],
    };

    return actionMap[trigger];
  }
}
