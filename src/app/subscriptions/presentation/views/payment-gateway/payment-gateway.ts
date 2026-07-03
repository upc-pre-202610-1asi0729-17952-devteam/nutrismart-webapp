import { AfterViewInit, Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import type { Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { PaymentStore } from '../../../application/payment.store';
import { PaymentMethod } from '../../../domain/model/payment-method.value-object';
import { PaymentMethodApi } from '../../../infrastructure/payment-method-api';
import { getStripe, isStripeConfigured } from '../../../infrastructure/stripe-loader';
import { IamStore } from '../../../../iam/application/iam.store';

/** Validates that a string has exactly 16 numeric digits (ignoring spaces). */
function cardNumberValidator(control: AbstractControl): ValidationErrors | null {
  const digits = (control.value ?? '').replace(/\s/g, '');
  return /^\d{16}$/.test(digits) ? null : { invalidCard: true };
}

/** Validates MM/YY format and that the date has not expired. */
function expiryValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!/^\d{2}\/\d{2}$/.test(value)) return { invalidExpiry: true };
  const [mm, yy] = value.split('/').map(Number);
  if (mm < 1 || mm > 12) return { invalidExpiry: true };
  const exp = new Date(2000 + yy, mm - 1);
  return exp >= new Date() ? null : { invalidExpiry: true };
}

/**
 * Payment gateway form (step 2 of the subscription flow).
 *
 * Runs in one of two modes depending on {@link isStripeConfigured}:
 * - **Stripe mode** (publishable key set): renders a Stripe Elements CardElement,
 *   tokenizes the card in the browser (PCI-safe — the PAN never touches our DOM),
 *   registers the payment method against the backend and stores the returned id.
 * - **Simulated mode** (no key): keeps the manual card fields and the live preview,
 *   used by {@link import('../../../infrastructure/simulated-payment-gateway').SimulatedPaymentGateway}.
 *
 * If a {@link PaymentMethod} is already stored in {@link PaymentStore} from a
 * previous step in the same session, the component redirects to checkout.
 */
@Component({
  selector: 'app-payment-gateway',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, DecimalPipe, LanguageSwitcher],
  templateUrl: './payment-gateway.html',
  styleUrl: './payment-gateway.css',
})
export class PaymentGateway implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb              = inject(FormBuilder);
  private readonly store           = inject(PaymentStore);
  private readonly router          = inject(Router);
  private readonly location        = inject(Location);
  private readonly paymentMethodApi = inject(PaymentMethodApi);
  private readonly iamStore        = inject(IamStore);

  protected readonly selectedPlan  = this.store.selectedPlan;
  protected readonly selectedPrice = this.store.selectedPrice;

  /** True when a Stripe publishable key is configured (real gateway). */
  protected readonly stripeMode = isStripeConfigured();

  /** Reference to the Stripe CardElement host (only present in Stripe mode). */
  @ViewChild('cardElement') private cardElementRef?: ElementRef<HTMLDivElement>;

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  /** Error message from Stripe (validation/tokenization/registration). */
  readonly stripeError = signal<string>('');
  /** True while tokenizing + registering the card. */
  readonly submitting = signal<boolean>(false);
  /** Card brand reported by Stripe Elements ('' until known). */
  private readonly stripeBrand = signal<string>('');

  readonly form = this.fb.group({
    holderName: ['', [Validators.required, Validators.minLength(2)]],
    cardNumber: ['', this.stripeMode ? [] : [Validators.required, cardNumberValidator]],
    expiry:     ['', this.stripeMode ? [] : [Validators.required, expiryValidator]],
    cvv:        ['', this.stripeMode ? [] : [Validators.required, Validators.pattern(/^\d{3}$/)]],
  });

  /** Reactive snapshot of form values, updates on every keystroke. */
  private readonly formValues = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.value)),
    { requireSync: true },
  );

  /** Card number formatted with groups of 4, padded with bullets. */
  readonly displayNumber = computed(() => {
    const raw = (this.formValues().cardNumber ?? '').replace(/\s/g, '');
    const padded = raw.padEnd(16, '•');
    return `${padded.slice(0,4)} ${padded.slice(4,8)} ${padded.slice(8,12)} ${padded.slice(12,16)}`;
  });

  /** Uppercase cardholder name, or placeholder. */
  readonly displayName = computed(() => {
    const val = (this.formValues().holderName ?? '').trim().toUpperCase();
    return val || 'YOUR NAME';
  });

  /** Expiry as typed, or placeholder. */
  readonly displayExpiry = computed(() => this.formValues().expiry || 'MM/YY');

  /** Detected card brand — from Stripe Elements in Stripe mode, from BIN otherwise. */
  readonly displayBrand = computed(() => {
    if (this.stripeMode) {
      switch (this.stripeBrand()) {
        case 'visa':       return 'VISA';
        case 'mastercard': return 'MC';
        case 'amex':       return 'AMEX';
        default:           return '';
      }
    }
    const d = (this.formValues().cardNumber ?? '').replace(/\s/g, '');
    if (/^4/.test(d))       return 'VISA';
    if (/^5[1-5]/.test(d))  return 'MC';
    if (/^3[47]/.test(d))   return 'AMEX';
    return '';
  });

  /** True while the CVV field is focused — triggers card flip animation. */
  readonly cvvFocused = signal(false);

  ngOnInit(): void {
    if (!this.store.selectedPlan()) {
      this.router.navigate(['/subscription']);
      return;
    }
    if (this.store.paymentMethod()) {
      this.router.navigate(['/subscription/checkout'], { replaceUrl: true });
    }
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.stripeMode || !this.cardElementRef) return;
    try {
      this.stripe = await getStripe();
      if (!this.stripe) { this.stripeError.set('Stripe failed to load'); return; }
      this.elements = this.stripe.elements();
      this.cardElement = this.elements.create('card', {
        style: {
          base: { fontFamily: 'inherit', fontSize: '15px', color: '#1a1a1a', '::placeholder': { color: '#9ca3af' } },
          invalid: { color: '#ef4444' },
        },
      });
      this.cardElement.mount(this.cardElementRef.nativeElement);
      this.cardElement.on('change', (e) => {
        this.stripeError.set(e.error?.message ?? '');
        this.stripeBrand.set(e.brand && e.brand !== 'unknown' ? e.brand : '');
      });
    } catch {
      this.stripeError.set('Stripe failed to load');
    }
  }

  ngOnDestroy(): void {
    this.cardElement?.destroy();
    this.cardElement = null;
    this.elements = null;
  }

  goBack(): void {
    this.location.back();
  }

  /**
   * Formats the card number input with spaces every 4 digits as the user types.
   * (Simulated mode only.)
   *
   * @param event - The native input event.
   */
  onCardInput(event: Event): void {
    const input  = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 16);
    const spaced = digits.match(/.{1,4}/g)?.join(' ') ?? digits;
    input.value  = spaced;
    this.form.get('cardNumber')!.setValue(spaced, { emitEvent: false });
    this.form.get('cardNumber')!.updateValueAndValidity();
  }

  /**
   * Formats the expiry input as MM/YY automatically. (Simulated mode only.)
   *
   * @param event - The native input event.
   */
  onExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val     = input.value.replace(/\D/g, '').slice(0, 4);
    if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
    input.value = val;
    this.form.get('expiry')!.setValue(val, { emitEvent: false });
    this.form.get('expiry')!.updateValueAndValidity();
  }

  /**
   * Validates the form and builds a {@link PaymentMethod}, then navigates to checkout.
   * In Stripe mode the card is tokenized and registered against the backend first.
   */
  async submit(): Promise<void> {
    if (this.stripeMode) { await this.submitStripe(); return; }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { holderName, cardNumber, expiry } = this.form.value;
    const digits = (cardNumber ?? '').replace(/\s/g, '');
    const [mm, yy] = (expiry ?? '').split('/');
    this.store.setPaymentMethod(new PaymentMethod({
      holderName:  holderName!,
      last4:       digits.slice(-4),
      brand:       this.detectBrand(digits),
      expiryMonth: mm,
      expiryYear:  yy,
    }));
    this.router.navigate(['/subscription/checkout']);
  }

  /** Stripe flow: tokenize the card, register it on the backend, store it, go to checkout. */
  private async submitStripe(): Promise<void> {
    const holderCtrl = this.form.get('holderName')!;
    if (holderCtrl.invalid) { holderCtrl.markAsTouched(); return; }
    if (!this.stripe || !this.cardElement) { this.stripeError.set('Stripe is not ready'); return; }

    const user = this.iamStore.currentUser();
    if (!user) { this.stripeError.set('You must be signed in'); return; }

    const holderName = (this.form.value.holderName ?? '').trim();
    this.submitting.set(true);
    this.stripeError.set('');
    try {
      const { paymentMethod, error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement,
        billing_details: { name: holderName },
      });
      if (error || !paymentMethod?.card) {
        this.stripeError.set(error?.message ?? 'Card error');
        return;
      }

      const registered = await firstValueFrom(this.paymentMethodApi.register({
        userId:                Number(user.id),
        lastFour:              paymentMethod.card.last4,
        brand:                 paymentMethod.card.brand,
        expiryMonth:           paymentMethod.card.exp_month,
        expiryYear:            paymentMethod.card.exp_year,
        cardholderName:        holderName,
        stripePaymentMethodId: paymentMethod.id,
      }));

      this.store.setPaymentMethod(registered);
      this.router.navigate(['/subscription/checkout']);
    } catch {
      this.stripeError.set('payment.error_processing_failed');
    } finally {
      this.submitting.set(false);
    }
  }

  /** Returns true when a form control is invalid and has been touched. */
  protected invalid(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  private detectBrand(digits: string): string {
    if (/^4/.test(digits))       return 'Visa';
    if (/^5[1-5]/.test(digits))  return 'Mastercard';
    if (/^3[47]/.test(digits))   return 'Amex';
    return 'Card';
  }
}
