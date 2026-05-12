import { MedicalCondition } from './medical-condition.enum';

/** Severity level of a dietary advisory derived from a medical condition. */
export type MedicalWarningSeverity = 'ADVISORY' | 'STRICT';

/** Constructor data for {@link MedicalDietaryWarning}. */
export interface MedicalDietaryWarningProps {
  /** The medical condition that triggers this warning. */
  condition: MedicalCondition;
  /** i18n key for the nutrient the user should limit. */
  nutrientToLimitKey: string;
  /** i18n key for the full advisory description. */
  descriptionKey: string;
  /**
   * STRICT: the domain enforces the rule (e.g. gluten is blocked for coeliac disease).
   * ADVISORY: the UI surfaces a warning but does not block the action.
   */
  severity: MedicalWarningSeverity;
}

/**
 * Immutable value object describing a nutrient limitation derived from a medical condition.
 *
 * Equality is based on the originating {@link MedicalCondition} — two warnings for
 * the same condition are always considered the same warning.
 *
 * @example
 * const warning = new MedicalDietaryWarning({
 *   condition: MedicalCondition.KIDNEY_DISEASE,
 *   nutrientToLimitKey: 'profile.medical_warnings.nutrient.protein',
 *   descriptionKey: 'profile.medical_warnings.KIDNEY_DISEASE',
 *   severity: 'ADVISORY',
 * });
 * warning.isAdvisory(); // true
 */
export class MedicalDietaryWarning {
  /** The medical condition that triggered this warning. */
  readonly condition: MedicalCondition;

  /** i18n key for the nutrient to limit (e.g. 'profile.medical_warnings.nutrient.sodium'). */
  readonly nutrientToLimitKey: string;

  /** i18n key for the full advisory description shown in the UI. */
  readonly descriptionKey: string;

  /** Enforcement level: STRICT blocks actions, ADVISORY only informs. */
  readonly severity: MedicalWarningSeverity;

  constructor(props: MedicalDietaryWarningProps) {
    this.condition = props.condition;
    this.nutrientToLimitKey = props.nutrientToLimitKey;
    this.descriptionKey = props.descriptionKey;
    this.severity = props.severity;
  }

  /**
   * Whether this warning is informational only (does not block user actions).
   *
   * @returns `true` when severity is ADVISORY.
   */
  isAdvisory(): boolean {
    return this.severity === 'ADVISORY';
  }

  /**
   * Whether this warning enforces a hard domain rule that blocks incompatible actions.
   *
   * @returns `true` when severity is STRICT.
   */
  isStrict(): boolean {
    return this.severity === 'STRICT';
  }
}
