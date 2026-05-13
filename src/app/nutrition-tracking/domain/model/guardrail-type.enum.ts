/** Categories of pre-log guardrail that the domain can raise before persisting a meal. */
export enum GuardrailType {
  /** Adding this meal would exceed the user's adjusted daily calorie budget. */
  CALORIE_OVERAGE = 'CALORIE_OVERAGE',

  /** The food item conflicts with one or more of the user's effective dietary restrictions. */
  RESTRICTION_CONFLICT = 'RESTRICTION_CONFLICT',

  /** The food item may be inadvisable given the user's active medical conditions. */
  MEDICAL_RISK = 'MEDICAL_RISK',
}
