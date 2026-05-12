/**
 * Wire-format DTO for the `/subscriptions` REST collection.
 *
 * Fields mirror the shape stored in `server/db.json`. Ids are strings in
 * the API but converted to numbers in the domain assembler.
 */
export interface SubscriptionResource {
  id: string | number;
  userId: string | number;
  plan: string;
  status: string;
  startDate: string;
  nextRenewal: string;
  pricePerMonth?: number;
}
