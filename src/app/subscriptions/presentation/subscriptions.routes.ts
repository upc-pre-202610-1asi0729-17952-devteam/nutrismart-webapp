import { Routes } from '@angular/router';

const subscriptionPlans = () =>
  import('./views/subscription-plans/subscription-plans').then(m => m.SubscriptionPlans);

const paymentGateway = () =>
  import('./views/payment-gateway/payment-gateway').then(m => m.PaymentGateway);

const checkoutSummary = () =>
  import('./views/checkout-summary/checkout-summary').then(m => m.CheckoutSummary);

const subscriptionConfirmed = () =>
  import('./views/subscription-confirmed/subscription-confirmed').then(m => m.SubscriptionConfirmed);

const billingPanel = () =>
  import('./views/billing-panel/billing-panel').then(m => m.BillingPanel);

/**
 * Post-onboarding subscription flow:
 *   /subscription          → plan selection
 *   /subscription/payment  → card entry
 *   /subscription/checkout → order review
 *   /subscription/confirmed → success screen
 */
export const subscriptionsRoutes: Routes = [
  {
    path: '',
    loadComponent: subscriptionPlans,
    title: 'NutriSmart - Choose Your Plan',
  },
  {
    path: 'payment',
    loadComponent: paymentGateway,
    title: 'NutriSmart - Payment',
  },
  {
    path: 'checkout',
    loadComponent: checkoutSummary,
    title: 'NutriSmart - Review Order',
  },
  {
    path: 'confirmed',
    loadComponent: subscriptionConfirmed,
    title: 'NutriSmart - Subscription Confirmed',
  },
];

/** Active subscription management (my-plan section in profile). */
export const myPlanRoutes: Routes = [
  {
    path: '',
    loadComponent: billingPanel,
    title: 'NutriSmart - My Plan',
  },
];
