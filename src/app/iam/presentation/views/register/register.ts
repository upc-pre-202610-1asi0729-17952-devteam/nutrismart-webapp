import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map, catchError, debounceTime, distinctUntilChanged, first, switchMap, of } from 'rxjs';
import { IamApi } from '../../../../iam/infrastructure/iam-api';
import { IamStore } from '../../../../iam/application/iam.store';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

/**
 * Custom validator that checks a password meets complexity requirements:
 * - At least 8 characters
 * - Contains at least one digit
 * - Contains at least one uppercase letter
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
 * Async validator factory that checks whether an email address is already
 * registered by querying the API. Debounces by 400 ms to avoid flooding
 * the server on every keystroke.
 *
 * @param iamApi - The {@link IamApi} instance used to fetch users.
 * @returns An async validator function that emits `{ emailTaken: true }` when
 *          the email is already in use, or `null` otherwise.
 */
export function emailTakenValidator(iamApi: IamApi): AsyncValidatorFn {
  return (control: AbstractControl) => {
    const email: string = (control.value ?? '').trim().toLowerCase();
    if (!email) return of(null);

    return of(email).pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((e) =>
        iamApi.getUsers().pipe(
          map((users) =>
            users.some((u) => u.email.toLowerCase() === e) ? { emailTaken: true } : null,
          ),
          catchError(() => of(null)),
        ),
      ),
      first(),
    );
  };
}

/**
 * Register view component for creating a new NutriSmart account.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, LanguageSwitcher],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private iamStore = inject(IamStore);
  private iamApi = inject(IamApi);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  showPassword = signal(false);
  registerError = signal<string | null>(null);
  loading = signal(false);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email], [emailTakenValidator(this.iamApi)]],
    password: ['', [Validators.required, passwordStrengthValidator()]],
    confirmPassword: ['', [Validators.required, confirmPasswordValidator('password')]],
    terms: [false, Validators.requiredTrue],
  });

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  get reqLength(): boolean {
    return !this.form.get('password')?.errors?.['minLength'];
  }
  get reqNumber(): boolean {
    return !this.form.get('password')?.errors?.['hasNumber'];
  }
  get reqUppercase(): boolean {
    return !this.form.get('password')?.errors?.['hasUppercase'];
  }

  /** `true` while the async email-taken check is running. */
  get checkingEmail(): boolean {
    return this.form.get('email')?.pending ?? false;
  }

  onSubmit(): void {
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password } = this.form.value;
    this.loading.set(true);
    this.registerError.set(null);

    this.iamStore
      .register({
        firstName: firstName!,
        lastName: lastName!,
        email: email!,
        password: password!,
      })
      .subscribe({
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
