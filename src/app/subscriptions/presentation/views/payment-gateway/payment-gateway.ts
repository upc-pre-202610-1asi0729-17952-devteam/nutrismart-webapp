import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { PaymentStore } from '../../../application/payment.store';
import { PaymentMethod } from '../../../domain/model/payment-method.value-object';

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
 * Renders a live-updating card preview that mirrors the user's input and
 * flips to show the CVV panel when that field is focused.
 *
 * If a {@link PaymentMethod} is already stored in {@link PaymentStore} from a
 * previous step in the same session, the component redirects to checkout
 * immediately so the user does not need to re-enter card details.
 *
 * When integrating Stripe: replace the manual fields with Stripe Elements and
 * call {@link PaymentStore.setPaymentMethod} from the `token` callback.
 */
@Component({
  selector: 'app-payment-gateway',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, DecimalPipe],
  templateUrl: './payment-gateway.html',
  styleUrl: './payment-gateway.css',
})
export class PaymentGateway implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly store  = inject(PaymentStore);
  private readonly router = inject(Router);

  protected readonly selectedPlan  = this.store.selectedPlan;
  protected readonly selectedPrice = this.store.selectedPrice;

  readonly form = this.fb.group({
    holderName: ['', [Validators.required, Validators.minLength(2)]],
    cardNumber: ['', [Validators.required, cardNumberValidator]],
    expiry:     ['', [Validators.required, expiryValidator]],
    cvv:        ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
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

  /** CVV as typed, or placeholder bullets. */
  readonly displayCvv = computed(() => this.formValues().cvv || '•••');

  /** Detected card brand from BIN prefix. */
  readonly displayBrand = computed(() => {
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
      this.router.navigate(['/subscription/checkout']);
    }
  }

  /**
   * Formats the card number input with spaces every 4 digits as the user types.
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
   * Formats the expiry input as MM/YY automatically.
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
   * Validates the form, builds a {@link PaymentMethod} and navigates to checkout.
   */
  submit(): void {
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
