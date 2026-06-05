/**
 * Wire-format DTO for the `/billing-history` REST collection.
 *
 * Fields mirror the shape stored in `server/db.json`.
 */
export interface BillingHistoryResource {
  id: string;
  userId: string | number;
  date: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
}
