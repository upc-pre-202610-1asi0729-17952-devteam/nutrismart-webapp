import { Component, EventEmitter, input, Output } from '@angular/core';
import { SubscriptionPlan } from '../../../../iam/domain/model/subscription-plan.enum';

interface PlanDef {
  key:      SubscriptionPlan;
  name:     string;
  price:    string;
  tagline:  string;
  features: string[];
}

/**
 * Displays the three plan comparison cards (Basic, Pro, Premium).
 *
 * The current plan card shows "Current plan" (disabled).
 * Higher tiers show "Upgrade to X", lower tiers show "Change to X".
 *
 * @author Mora Rivera, Joel Fernando
 */
@Component({
  selector: 'app-plan-cards',
  templateUrl: './plan-cards.html',
  styleUrl: './plan-cards.css',
})
export class PlanCardsComponent {

  /** The user's currently active plan. */
  currentPlan = input.required<SubscriptionPlan>();

  @Output() upgrade   = new EventEmitter<SubscriptionPlan>();
  @Output() downgrade = new EventEmitter<SubscriptionPlan>();

  protected readonly planDefs: PlanDef[] = [
    {
      key:     SubscriptionPlan.BASIC,
      name:    'Basic',
      price:   '9.99',
      tagline: 'Manual registration and basic dashboard.',
      features: [
        'Manual food logging',
        'Basic dashboard',
        'BMI, BMR and TDEE calculation',
      ],
    },
    {
      key:     SubscriptionPlan.PRO,
      name:    'Pro',
      price:   '14.99',
      tagline: 'Smart Scan, weather, travel and wearable.',
      features: [
        'Everything in Basic',
        'Smart Scan (plate photo)',
        'Travel Mode',
        'Wearable Sync (Google Fit)',
        'Pantry and recipes',
      ],
    },
    {
      key:     SubscriptionPlan.PREMIUM,
      name:    'Premium',
      price:   '19.99',
      tagline: 'Everything in Pro + restaurant menu and PDF.',
      features: [
        'Everything in Pro',
        'Restaurant menu analysis',
        'Unlimited history',
        'Export PDF report',
        'Google Fit Sync Premium',
      ],
    },
  ];

  private planOrder = [SubscriptionPlan.BASIC, SubscriptionPlan.PRO, SubscriptionPlan.PREMIUM];

  /** Returns true when the given plan is a higher tier than the current one. */
  protected isUpgrade(plan: SubscriptionPlan): boolean {
    return this.planOrder.indexOf(plan) > this.planOrder.indexOf(this.currentPlan());
  }
}
