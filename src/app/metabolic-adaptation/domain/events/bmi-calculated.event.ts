import { DomainEvent } from '../../../shared/domain/domain-event';

/**
 * Fired when a BMI value is derived from a new body-metrics snapshot.
 *
 * Published by {@link MetabolicStore} immediately after a weight entry is saved,
 * using the formula: BMI = weight(kg) / height(m)².
 */
export class BMICalculated extends DomainEvent {
  override readonly eventType = 'BMICalculated';

  constructor(
    readonly userId:   number,
    readonly bmi:      number,
    readonly weightKg: number,
    readonly heightCm: number,
  ) { super(); }
}
