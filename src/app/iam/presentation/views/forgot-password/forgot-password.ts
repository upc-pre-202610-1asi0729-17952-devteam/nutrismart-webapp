import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

/**
 * Forgot password view for the NutriSmart auth flow.
 *
 * Displays an email input form before submission and a confirmation message
 * after the reset link has been (simulated to be) sent. The transition is
 * controlled by the {@link emailSent} signal.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  /** Form builder for creating the reactive forgot-password form. */
  private fb = inject(FormBuilder);

  /**
   * Signal that transitions the UI from the request form to the
   * success confirmation panel after simulated email dispatch.
   */
  emailSent = signal(false);

  /**
   * Signal indicating whether the simulated API request is in flight.
   */
  loading = signal(false);

  /**
   * Reactive form with a single email control.
   * - `email`: required, must be a valid email address.
   */
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  /**
   * Submits the forgot-password form.
   *
   * Simulates a 500 ms API call, then sets {@link emailSent} to `true` to
   * show the confirmation message.
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.emailSent.set(true);
    }, 500);
  }

  /**
   * Returns the email value entered in the form.
   *
   * @returns The email string or an empty string if the control is empty.
   */
  get enteredEmail(): string {
    return this.form.value.email ?? '';
  }
}
