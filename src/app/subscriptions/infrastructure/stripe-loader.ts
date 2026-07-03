import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment.development';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Loads the Stripe.js instance once and caches the promise.
 *
 * Requires `environment.stripePublishableKey` to be set. When it is empty the
 * app is expected to run with the {@link import('./simulated-payment-gateway').SimulatedPaymentGateway}
 * instead, so this loader is never invoked.
 *
 * @returns Promise resolving to the Stripe instance (or null if it fails to load).
 * @throws Error when the publishable key is not configured.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = environment.stripePublishableKey;
    if (!key) throw new Error('stripePublishableKey is not defined');
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

/** True when a Stripe publishable key is configured (real gateway available). */
export function isStripeConfigured(): boolean {
  return !!environment.stripePublishableKey;
}
