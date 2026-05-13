import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Login view component for NutriSmart authentication.
 *
 * Renders a centered card with email and password fields, a password
 * visibility toggle, and links to the forgot-password and register screens.
 * On successful login the user is navigated to `/dashboard`.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, LanguageSwitcher],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  /** IAM store used for authentication operations. */
  private iamStore = inject(IamStore);

  /** Angular router used for post-login navigation. */
  private router = inject(Router);

  /** Form builder for creating the reactive login form. */
  private fb = inject(FormBuilder);

  /**
   * Signal controlling whether the password field shows plain text.
   * `true` = visible, `false` = masked (default).
   */
  showPassword = signal(false);

  /**
   * Signal holding the error message from a failed login attempt.
   * `null` when no error has occurred.
   */
  loginError = signal<string | null>(null);

  /**
   * Signal indicating whether a login request is in flight.
   */
  loading = signal(false);

  /**
   * Reactive login form with email and password controls.
   * - `email`: required, must be a valid email address.
   * - `password`: required, minimum 8 characters.
   */
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  /**
   * Toggles the password field between plain text and masked mode.
   */
  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  /**
   * Submits the login form.
   *
   * Validates the form, calls {@link IamStore.login}, and on success
   * navigates to `/dashboard`. On failure, displays the error message.
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;
    this.loading.set(true);
    this.loginError.set(null);

    this.iamStore.login(email!, password!).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.loginError.set(err.message);
      },
    });
  }
}
