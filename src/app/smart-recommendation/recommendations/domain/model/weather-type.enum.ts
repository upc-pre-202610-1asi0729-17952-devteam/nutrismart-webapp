/**
 * Classifies current weather conditions for recommendation filtering.
 *
 * HOT triggers light/hydrating suggestions; COLD triggers warm/dense ones.
 */
export enum WeatherType {
  HOT  = 'HOT',
  COLD = 'COLD',
  MILD = 'MILD',
}
