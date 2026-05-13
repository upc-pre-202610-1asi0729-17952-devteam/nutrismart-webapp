/**
 * Enforcement level of a {@link PreLogGuardrail}.
 *
 * - BLOCK   — the domain prevents the meal from being persisted.
 * - WARNING — the meal can still be saved; the UI must surface the risk.
 * - INFO    — purely informational; no action required from the user.
 */
export enum GuardrailSeverity {
  BLOCK   = 'BLOCK',
  WARNING = 'WARNING',
  INFO    = 'INFO',
}
