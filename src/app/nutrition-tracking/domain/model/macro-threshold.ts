/**
 * Domain constants defining the caloric threshold levels used to evaluate
 * whether a macro is approaching or has exceeded its daily target.
 *
 * Centralised here so any change in business rules propagates automatically
 * to all consumers without hunting through presentation or application code.
 */
export const MacroThreshold = {
  /** Ratio at which a macro is considered "approaching" its daily limit. */
  APPROACHING: 0.80,
  /** Ratio at which a macro is considered "exceeded". */
  EXCEEDED:    1.00,
} as const;
