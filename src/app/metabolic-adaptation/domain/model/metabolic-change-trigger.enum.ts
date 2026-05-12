/** Root cause that triggered a recalculation of metabolic targets. */
export enum MetabolicChangeTrigger {
  ONBOARDING              = 'ONBOARDING',
  PROFILE_CHANGE          = 'PROFILE_CHANGE',
  GOAL_SWITCH             = 'GOAL_SWITCH',
  STAGNATION_RESPONSE     = 'STAGNATION_RESPONSE',
  ACTIVITY_TREND          = 'ACTIVITY_TREND',
  BODY_COMPOSITION_UPDATE = 'BODY_COMPOSITION_UPDATE',
}
