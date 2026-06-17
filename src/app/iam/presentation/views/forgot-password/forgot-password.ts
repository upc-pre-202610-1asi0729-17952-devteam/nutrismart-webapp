import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { IamApi } from '../../../infrastructure/iam-api';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, LanguageSwitcher],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private iamApi = inject(IamApi);

  emailSent = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.iamApi.forgotPassword(this.form.value.email!).subscribe({
      next: () => {
        this.loading.set(false);
        this.emailSent.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('auth.error_generic');
      },
    });
  }

  get enteredEmail(): string {
    return this.form.value.email ?? '';
  }
}
