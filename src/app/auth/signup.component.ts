import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  selector: 'app-signup',
  template: `
    <main class="auth-page">
      <section class="auth-card">
        <h1>Create your account</h1>
        <p>Register and join the modern chat experience.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Name</label>
          <input formControlName="name" placeholder="Jane Doe" />
          <div class="field-error" *ngIf="name.invalid && name.touched">Enter your name.</div>

          <label>Email</label>
          <input type="email" formControlName="email" placeholder="you@example.com" />
          <div class="field-error" *ngIf="email.invalid && email.touched">Valid email required.</div>

          <label>Password</label>
          <input [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="••••••••" />
          <div class="field-error" *ngIf="password.invalid && password.touched">Password must be at least 6 characters.</div>

          <label>Confirm Password</label>
          <input [type]="showPassword ? 'text' : 'password'" formControlName="confirmPassword" placeholder="••••••••" />
          <div class="field-error" *ngIf="form.hasError('mismatch') && confirmPassword.touched">Passwords must match.</div>

          <label>Profile image URL</label>
          <input formControlName="avatar" placeholder="Optional avatar URL" />

          <button class="primary" [disabled]="form.invalid || loading">Create account</button>
          <div class="spinner" *ngIf="loading">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
          <button type="button" class="secondary" (click)="backToLogin()">Back to login</button>
          <div class="field-error" *ngIf="signupError">{{ signupError }}</div>
        </form>
      </section>
    </main>
  `,
  styles: [
    `
      .auth-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(180deg, #12151f 0%, #0c0f17 100%);
        color: #eef2ff;
        padding: 24px;
      }
      .auth-card {
        width: min(520px, 100%);
        background: rgba(12, 14, 23, 0.96);
        border: 1px solid rgba(111, 94, 251, 0.18);
        border-radius: 28px;
        padding: 36px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
      }
      h1 {
        margin: 0 0 10px;
      }
      p {
        color: #8a95b8;
        margin-bottom: 28px;
      }
      label {
        display: block;
        margin-bottom: 14px;
        font-size: 0.95rem;
      }
      input {
        width: 100%;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.02);
        border-radius: 18px;
        padding: 14px 18px;
        color: #eef2ff;
        margin-bottom: 18px;
      }
      button.primary,
      button.secondary {
        width: 100%;
        border: none;
        border-radius: 18px;
        padding: 16px 18px;
        font-weight: 600;
        cursor: pointer;
      }
      button.primary {
        background: linear-gradient(135deg, #6f5efb, #1f8bff);
        color: #fff;
        margin-bottom: 12px;
      }
      button.secondary {
        background: rgba(255, 255, 255, 0.05);
        color: #8a95b8;
      }
      .field-error {
        color: #f37575;
        font-size: 0.85rem;
        margin-top: -14px;
        margin-bottom: 16px;
      }
      .spinner {
        display: flex;
        justify-content: center;
        gap: 6px;
        margin-bottom: 12px;
      }
      .spinner .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #6f5efb;
        animation: dotPulse 1.2s ease-in-out infinite;
      }
      .spinner .dot:nth-child(2) { animation-delay: 0.2s; }
      .spinner .dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes dotPulse {
        0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1); }
      }

      @media (max-width: 560px) {
        .auth-page {
          min-height: 100dvh;
          padding: 14px;
          align-items: start;
        }

        .auth-card {
          margin-top: max(18px, env(safe-area-inset-top));
          border-radius: 20px;
          padding: 24px 18px;
        }

        h1 {
          font-size: 1.55rem;
        }

        p {
          margin-bottom: 22px;
          font-size: 0.92rem;
        }

        input,
        button.primary,
        button.secondary {
          min-height: 44px;
          border-radius: 14px;
          padding: 12px 14px;
        }
      }
    `,
  ],
})
export class SignupComponent {
  showPassword = false;
  form: any;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      avatar: [''],
    }, { validators: this.passwordMatch });
  }

  get name() {
    return this.form.get('name')!;
  }

  get email() {
    return this.form.get('email')!;
  }

  get password() {
    return this.form.get('password')!;
  }

  get confirmPassword() {
    return this.form.get('confirmPassword')!;
  }

  passwordMatch(group: any) {
    return group.get('password')?.value === group.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  loading = false;
  signupError: string | null = null;

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const name = this.form.value.name ?? '';
    const email = this.form.value.email ?? '';
    const password = this.form.value.password ?? '';
    const avatar = this.form.value.avatar?.trim() || undefined;
    this.signupError = null;
    this.loading = true;
    this.auth.signup(name, email, password, avatar).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/chat']); },
      error: (err) => {
        this.loading = false;
        this.signupError = err?.error?.message || err?.message || 'Unable to create account, please try again.';
      },
    });
  }

  backToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
