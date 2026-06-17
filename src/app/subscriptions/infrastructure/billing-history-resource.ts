/**
 * Wire-format DTO for the `/billing-history` REST collection.
 *
 * Fields mirror the shape stored in `server/db.json`.
 */
export interface BillingHistoryResource {
  id: string;
  userId: string | number;
  paidAt?: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
}

export interface NewBillingRecord {
  userId: string | number;
  plan: string;
  amount: number;
  currency: string;
  status: string;
}
