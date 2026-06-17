/** Rounds a number to one decimal place, eliminating floating-point drift. */
export const roundToOneDecimal = (value: number): number =>
  Math.round(value * 10) / 10;
