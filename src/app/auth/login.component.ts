import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  selector: 'app-login',
  template: `
    <main class="auth-page">
      <section class="auth-card">
        <h1>Welcome back</h1>
        <p>Login to continue your secure chat experience.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Email</label>
          <input type="email" formControlName="email" placeholder="you@example.com" />
          <div class="field-error" *ngIf="email.invalid && email.touched">Please enter a valid email.</div>

          <label>Password</label>
          <div class="password-field">
            <input [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="••••••••" />
            <button type="button" (click)="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button>
          </div>
          <div class="field-error" *ngIf="password.invalid && password.touched">Password must be at least 6 characters.</div>

          <div class="actions-row">
            <label><input type="checkbox" formControlName="remember" /> Remember me</label>
            <a routerLink="/auth/signup">Create account</a>
          </div>

          <button class="primary" [disabled]="form.invalid || loading">Login</button>
          <div class="spinner" *ngIf="loading">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
          <button type="button" class="secondary" (click)="resetPassword()">Forgot password?</button>
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
      .password-field {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
      }
      .password-field button {
        border: none;
        border-radius: 18px;
        background: rgba(111, 94, 251, 0.2);
        color: #fff;
        padding: 14px 18px;
        cursor: pointer;
      }
      .actions-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #8a95b8;
        margin-bottom: 24px;
      }
      .actions-row a {
        color: #8a95b8;
        text-decoration: none;
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
    `,
  ],
})
export class LoginComponent {
  loading = false;
  showPassword = false;
  form: any;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private toastService: ToastService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [true],
    });
  }

  get email() {
    return this.form.get('email')!;
  }

  get password() {
    return this.form.get('password')!;
  }

  submit() {
    if (this.form.invalid) return;
    const email = this.form.value.email ?? '';
    const password = this.form.value.password ?? '';
    this.loading = true;
    this.auth.login(email, password).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/chat']); },
      error: () => { this.loading = false; this.toastService.error('Login failed. Please check credentials.'); },
    });
  }

  resetPassword() {
    this.toastService.info('Reset password flow is not configured in this prototype.');
  }
}
