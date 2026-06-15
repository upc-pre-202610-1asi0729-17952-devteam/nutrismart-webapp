import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { IamApi } from '../../../infrastructure/iam-api';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, LanguageSwitcher],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  private fb = inject(FormBuilder);
  private iamApi = inject(IamApi);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = signal<string | null>(null);
  loading = signal(false);
  success = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  showConfirm = signal(false);

  form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordsMatch },
  );

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (!t) {
      this.error.set('auth.reset_invalid_link');
    } else {
      this.token.set(t);
    }
  }

  private passwordsMatch(group: import('@angular/forms').AbstractControl) {
    const pw = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pw === confirm ? null : { mismatch: true };
  }

  togglePassword(): void { this.showPassword.update((v) => !v); }
  toggleConfirm(): void { this.showConfirm.update((v) => !v); }

  onSubmit(): void {
    if (this.form.invalid || !this.token()) return;

    this.loading.set(true);
    this.error.set(null);

    this.iamApi.resetPassword(this.token()!, this.form.value.password!).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/auth/login'], { queryParams: { passwordReset: 'true' } }), 2500);
      },
      error: (err) => {
        this.loading.set(false);
        const status = err?.status;
        if (status === 410) {
          this.error.set('auth.reset_link_expired');
        } else {
          this.error.set('auth.reset_invalid_link');
        }
      },
    });
  }
}
