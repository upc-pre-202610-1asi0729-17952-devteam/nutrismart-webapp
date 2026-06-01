import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { PaymentStore } from '../../../application/payment.store';
import { PaymentMethod } from '../../../domain/model/payment-method.value-object';

/** Validates that a string has exactly 16 numeric digits (ignoring spaces). */
function cardNumberValidator(control: AbstractControl): ValidationErrors | null {
  const digits = (control.value ?? '').replace(/\s/g, '');
  return /^\d{16}$/.test(digits) ? null : { invalidCard: true };
}

/** Validates MM/YY format and that the date is in the future. */
function expiryValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!/^\d{2}\/\d{2}$/.test(value)) return { invalidExpiry: true };
  const [mm, yy] = value.split('/').map(Number);
  if (mm < 1 || mm > 12) return { invalidExpiry: true };
  const now = new Date();
  const exp = new Date(2000 + yy, mm - 1);
  return exp >= now ? null : { invalidExpiry: true };
}

/**
 * Payment gateway form (step 2 of the subscription flow).
 *
 * Collects and validates card data locally, then passes a {@link PaymentMethod}
 * value object to {@link PaymentStore} before navigating to the checkout step.
 *
 * This component is intentionally gateway-agnostic: when Stripe Elements are
 * integrated, replace the manual form fields with the Stripe Elements mount point
 * and construct the {@link PaymentMethod} from the Stripe tokenisation result.
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

  ngOnInit(): void {
    if (!this.store.selectedPlan()) {
      this.router.navigate(['/subscription']);
    }
  }

  /**
   * Formats the card number input with spaces every 4 digits as the user types.
   *
   * @param event - The native input event.
   */
  onCardInput(event: Event): void {
    const input   = event.target as HTMLInputElement;
    const digits  = input.value.replace(/\D/g, '').slice(0, 16);
    const spaced  = digits.match(/.{1,4}/g)?.join(' ') ?? digits;
    input.value   = spaced;
    this.form.get('cardNumber')!.setValue(spaced, { emitEvent: false });
  }

  /**
   * Formats the expiry input as MM/YY.
   *
   * @param event - The native input event.
   */
  onExpiryInput(event: Event): void {
    const input  = event.target as HTMLInputElement;
    let val      = input.value.replace(/\D/g, '').slice(0, 4);
    if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
    input.value  = val;
    this.form.get('expiry')!.setValue(val, { emitEvent: false });
  }

  /**
   * Submits the card form, builds a {@link PaymentMethod} and navigates to checkout.
   */
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { holderName, cardNumber, expiry } = this.form.value;
    const digits = (cardNumber ?? '').replace(/\s/g, '');
    const [mm, yy] = (expiry ?? '').split('/');
    const method = new PaymentMethod({
      holderName:  holderName!,
      last4:       digits.slice(-4),
      brand:       this.detectBrand(digits),
      expiryMonth: mm,
      expiryYear:  yy,
    });
    this.store.setPaymentMethod(method);
    this.router.navigate(['/subscription/checkout']);
  }

  /** Returns true when a form control is both invalid and touched. */
  protected invalid(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  private detectBrand(digits: string): string {
    if (/^4/.test(digits))  return 'Visa';
    if (/^5[1-5]/.test(digits)) return 'Mastercard';
    if (/^3[47]/.test(digits))  return 'Amex';
    return 'Card';
  }
}
