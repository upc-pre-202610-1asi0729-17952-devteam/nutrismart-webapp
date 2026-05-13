import { GuardrailSeverity } from './guardrail-severity.enum';
import { GuardrailType } from './guardrail-type.enum';

/** Constructor data for {@link PreLogGuardrail}. */
export interface PreLogGuardrailProps {
  /** Category of the guardrail (calorie, restriction, or medical). */
  type: GuardrailType;
  /** Whether to block the action, warn the user, or simply inform. */
  severity: GuardrailSeverity;
  /** i18n key for the main message shown in the UI. */
  messageKey: string;
  /** i18n key for the suggested corrective action. */
  recommendationKey: string;
  /** Named parameters for i18n interpolation (e.g. `{ percent: 110, overage: 250 }`). */
  params: Record<string, unknown>;
}

/**
 * Immutable value object raised by the domain before a meal is persisted.
 *
 * Guardrails encode pre-log business rules such as calorie budget enforcement,
 * dietary restriction conflicts, and medical risk advisories. They are evaluated
 * synchronously in the application layer before any network call is made.
 *
 * Equality is not defined — each instance is unique per evaluation.
 *
 * @example
 * const g = new PreLogGuardrail({
 *   type: GuardrailType.CALORIE_OVERAGE,
 *   severity: GuardrailSeverity.WARNING,
 *   messageKey: 'nutrition.guardrail.calorie_overage',
 *   recommendationKey: 'nutrition.guardrail.calorie_overage_rec',
 *   params: { percent: 115, overage: 320 },
 * });
 * g.isBlocking(); // false — WARNING does not block
 */
export class PreLogGuardrail {
  /** Category of the guardrail. */
  readonly type: GuardrailType;

  /** Enforcement level. */
  readonly severity: GuardrailSeverity;

  /** i18n key for the main message. */
  readonly messageKey: string;

  /** i18n key for the recommendation text. */
  readonly recommendationKey: string;

  /** Interpolation parameters for i18n (e.g. percentages, food names). */
  readonly params: Record<string, unknown>;

  constructor(props: PreLogGuardrailProps) {
    this.type              = props.type;
    this.severity          = props.severity;
    this.messageKey        = props.messageKey;
    this.recommendationKey = props.recommendationKey;
    this.params            = props.params;
  }

  /**
   * Whether this guardrail prevents the meal from being persisted.
   *
   * @returns `true` only when severity is {@link GuardrailSeverity.BLOCK}.
   */
  isBlocking(): boolean {
    return this.severity === GuardrailSeverity.BLOCK;
  }

  /**
   * Whether this guardrail is informational only (does not affect the action).
   *
   * @returns `true` when severity is {@link GuardrailSeverity.INFO}.
   */
  isInfo(): boolean {
    return this.severity === GuardrailSeverity.INFO;
  }
}
