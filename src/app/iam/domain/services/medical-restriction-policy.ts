import { DietaryRestriction } from '../model/dietary-restriction.enum';
import { MedicalCondition } from '../model/medical-condition.enum';
import { MedicalDietaryWarning } from '../model/medical-dietary-warning.value-object';

/**
 * Domain service that derives dietary restrictions and nutritional warnings
 * from a user's medical conditions.
 *
 * Only {@link MedicalCondition.COELIAC_DISEASE} maps to a hard {@link DietaryRestriction}
 * (GLUTEN_FREE) because gluten ingestion causes intestinal damage regardless of preference.
 * All other conditions produce ADVISORY warnings that surface in the UI
 * without blocking food selection.
 *
 * This class has no instance state — all methods are static.
 *
 * @example
 * const restrictions = MedicalRestrictionPolicy.deriveRestrictions(['COELIAC_DISEASE']);
 * // → [DietaryRestriction.GLUTEN_FREE]
 *
 * const warnings = MedicalRestrictionPolicy.getWarnings(['TYPE_2_DIABETES', 'GOUT']);
 * // → [MedicalDietaryWarning(TYPE_2_DIABETES), MedicalDietaryWarning(GOUT)]
 */
export class MedicalRestrictionPolicy {
  /**
   * Medical conditions that automatically enforce a {@link DietaryRestriction}.
   * Only conditions where the restriction is medically mandatory (not a preference) are listed.
   */
  private static readonly RESTRICTION_MAP: Partial<Record<MedicalCondition, DietaryRestriction>> = {
    [MedicalCondition.COELIAC_DISEASE]: DietaryRestriction.GLUTEN_FREE,
  };

  /** Pre-built warning instances keyed by condition. Created once, reused on every call. */
  private static readonly WARNING_MAP: Partial<Record<MedicalCondition, MedicalDietaryWarning>> = {
    [MedicalCondition.TYPE_2_DIABETES]: new MedicalDietaryWarning({
      condition: MedicalCondition.TYPE_2_DIABETES,
      nutrientToLimitKey: 'profile.medical_warnings.nutrient.sugar',
      descriptionKey: 'profile.medical_warnings.TYPE_2_DIABETES',
      severity: 'ADVISORY',
    }),
    [MedicalCondition.HIGH_BLOOD_PRESSURE]: new MedicalDietaryWarning({
      condition: MedicalCondition.HIGH_BLOOD_PRESSURE,
      nutrientToLimitKey: 'profile.medical_warnings.nutrient.sodium',
      descriptionKey: 'profile.medical_warnings.HIGH_BLOOD_PRESSURE',
      severity: 'ADVISORY',
    }),
    [MedicalCondition.COELIAC_DISEASE]: new MedicalDietaryWarning({
      condition: MedicalCondition.COELIAC_DISEASE,
      nutrientToLimitKey: 'profile.medical_warnings.nutrient.gluten',
      descriptionKey: 'profile.medical_warnings.COELIAC_DISEASE',
      severity: 'STRICT',
    }),
    [MedicalCondition.KIDNEY_DISEASE]: new MedicalDietaryWarning({
      condition: MedicalCondition.KIDNEY_DISEASE,
      nutrientToLimitKey: 'profile.medical_warnings.nutrient.protein',
      descriptionKey: 'profile.medical_warnings.KIDNEY_DISEASE',
      severity: 'ADVISORY',
    }),
    [MedicalCondition.GOUT]: new MedicalDietaryWarning({
      condition: MedicalCondition.GOUT,
      nutrientToLimitKey: 'profile.medical_warnings.nutrient.purines',
      descriptionKey: 'profile.medical_warnings.GOUT',
      severity: 'ADVISORY',
    }),
    [MedicalCondition.HYPOTHYROIDISM]: new MedicalDietaryWarning({
      condition: MedicalCondition.HYPOTHYROIDISM,
      nutrientToLimitKey: 'profile.medical_warnings.nutrient.soy',
      descriptionKey: 'profile.medical_warnings.HYPOTHYROIDISM',
      severity: 'ADVISORY',
    }),
  };

  /**
   * Returns the {@link DietaryRestriction} values that must be enforced automatically
   * given a set of medical conditions.
   *
   * @param conditions - The user's medical conditions stored as string enum values.
   * @returns Deduplicated array of {@link DietaryRestriction} values to merge with the user's
   *          declared restrictions. Returns an empty array when no mandatory mapping exists.
   */
  static deriveRestrictions(conditions: string[]): DietaryRestriction[] {
    const result: DietaryRestriction[] = [];
    for (const raw of conditions) {
      const restriction = this.RESTRICTION_MAP[raw as MedicalCondition];
      if (restriction && !result.includes(restriction)) {
        result.push(restriction);
      }
    }
    return result;
  }

  /**
   * Returns dietary warnings for all supplied medical conditions that have a known mapping.
   *
   * @param conditions - The user's medical conditions stored as string enum values.
   * @returns Array of {@link MedicalDietaryWarning} value objects, one per recognised condition.
   *          Conditions without a known warning are silently skipped.
   */
  static getWarnings(conditions: string[]): MedicalDietaryWarning[] {
    const result: MedicalDietaryWarning[] = [];
    for (const raw of conditions) {
      const warning = this.WARNING_MAP[raw as MedicalCondition];
      if (warning) result.push(warning);
    }
    return result;
  }
}
