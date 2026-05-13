import { DomainEvent } from './domain-event';

/** Published by RestaurantMenuStore when RankCompatibleDishes completes successfully. */
export class CompatibleDishesRanked extends DomainEvent {
  override readonly eventType = 'CompatibleDishesRanked';

  /**
   * @param userId             - Owner of the scan session.
   * @param bestDishName       - Display name of the top-ranked dish.
   * @param bestDishNameKey    - i18n key for the dish name, or null.
   * @param bestDishCalories   - Estimated kilocalories of the best dish.
   * @param bestDishProtein    - Protein grams of the best dish.
   * @param bestDishCarbs      - Carbohydrate grams of the best dish.
   * @param bestDishFat        - Fat grams of the best dish.
   * @param rankedCount        - Total number of compatible (non-restricted) ranked dishes.
   */
  constructor(
    readonly userId: number,
    readonly bestDishName: string,
    readonly bestDishNameKey: string | null,
    readonly bestDishCalories: number,
    readonly bestDishProtein: number,
    readonly bestDishCarbs: number,
    readonly bestDishFat: number,
    readonly rankedCount: number,
  ) {
    super();
  }
}
