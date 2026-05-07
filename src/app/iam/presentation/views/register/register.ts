import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Custom validator that checks a password meets complexity requirements:
 * - At least 8 characters
 * - Contains at least one digit
 * - Contains at least one uppercase letter
 *
 * @returns A validator function compatible with `FormControl.addValidators`.
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    const errors: ValidationErrors = {};

    if (value.length < 8) errors['minLength'] = true;
    if (!/\d/.test(value)) errors['hasNumber'] = true;
    if (!/[A-Z]/.test(value)) errors['hasUppercase'] = true;

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Factory that returns a validator ensuring `confirmPassword` matches
 * the `password` sibling control value.
 *
 * @param passwordKey - The name of the password control inside the form group.
 * @returns A cross-field validator function.
 */
export function confirmPasswordValidator(passwordKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control.parent;
    if (!group) return null;
    const password = group.get(passwordKey)?.value;
    return control.value !== password ? { mismatch: true } : null;
  };
}

/**
 * Register view component for creating a new NutriSmart account.
 *
 * Displays a two-column grid for name fields, password with real-time
 * complexity hints, a confirm-password field, a terms checkbox, and a
 * "Continue with Google" placeholder button. On success the store navigates
 * the user to `/onboarding`.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  /** IAM store used for user registration. */
  private iamStore = inject(IamStore);

  /** Angular router for post-registration navigation. */
  private router = inject(Router);

  /** Form builder for constructing the reactive registration form. */
  private fb = inject(FormBuilder);

  /**
   * Signal controlling whether the password is visible as plain text.
   */
  showPassword = signal(false);

  /**
   * Signal holding an error message from a failed registration attempt.
   */
  registerError = signal<string | null>(null);

  /**
   * Signal indicating whether the registration request is in flight.
   */
  loading = signal(false);

  /**
   * Reactive registration form.
   * - `firstName`: required
   * - `lastName`: required
   * - `email`: required, valid email
   * - `password`: required, must satisfy {@link passwordStrengthValidator}
   * - `confirmPassword`: required, must match `password`
   * - `terms`: required (must be `true`)
   */
  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, passwordStrengthValidator()]],
    confirmPassword: ['', [Validators.required, confirmPasswordValidator('password')]],
    terms: [false, Validators.requiredTrue],
  });

  /**
   * Toggles the password field between plain text and masked mode.
   */
  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  /**
   * Returns `true` when the password meets the minimum length requirement.
   */
  get reqLength(): boolean {
    return !this.form.get('password')?.errors?.['minLength'];
  }

  /**
   * Returns `true` when the password contains at least one digit.
   */
  get reqNumber(): boolean {
    return !this.form.get('password')?.errors?.['hasNumber'];
  }

  /**
   * Returns `true` when the password contains at least one uppercase letter.
   */
  get reqUppercase(): boolean {
    return !this.form.get('password')?.errors?.['hasUppercase'];
  }

  /**
   * Submits the registration form.
   *
   * Validates the form, calls {@link IamStore.register}, and the store
   * handles navigation to `/onboarding` on success.
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password } = this.form.value;
    this.loading.set(true);
    this.registerError.set(null);

    this.iamStore.register({ firstName: firstName!, lastName: lastName!, email: email!, password: password! }).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.registerError.set(err.message);
      },
    });
  }
}
