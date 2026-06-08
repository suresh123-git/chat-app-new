import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-sidebar',
  template: `
    <section class="sidebar-card">
      <div class="brand">
        <span class="brand-mark">C</span>
        <div>
          <h1>Cosmo Chat</h1>
          <p>Secure team conversations</p>
        </div>
      </div>
      <div class="profile-card" *ngIf="auth.user$ | async as user">
        <img [src]="user.avatar || defaultAvatar" alt="avatar" />
        <div>
          <strong>{{ user.name }}</strong>
          <span>{{ user.status }}</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <button (click)="goToSettings()">Settings</button>
        <button (click)="logout()">Logout</button>
      </nav>
    </section>
  `,
  styles: [
    `
      .sidebar-card {
        display: flex;
        flex-direction: column;
        gap: 32px;
        padding: 24px;
      }
      .brand {
        display: flex;
        gap: 16px;
        align-items: center;
      }
      .brand-mark {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #6f5efb, #1f8bff);
        color: #fff;
        font-weight: 800;
        font-size: 1.2rem;
      }
      .brand h1 {
        font-size: 1.1rem;
        margin: 0;
      }
      .brand p {
        margin: 0;
        color: #9aa2b3;
        font-size: 0.95rem;
      }
      .profile-card {
        display: flex;
        gap: 16px;
        align-items: center;
        padding: 18px;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.03);
      }
      .profile-card img {
        width: 56px;
        height: 56px;
        border-radius: 18px;
        object-fit: cover;
      }
      .profile-card strong {
        display: block;
        font-size: 1rem;
      }
      .profile-card span {
        color: #8b97b3;
        font-size: 0.9rem;
      }
      .sidebar-nav {
        display: grid;
        gap: 12px;
      }
      .sidebar-nav button {
        text-align: left;
        border: none;
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
        padding: 14px 18px;
        border-radius: 18px;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .sidebar-nav button:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    `,
  ],
})
export class SidebarComponent {
  defaultAvatar = 'https://ui-avatars.com/api/?name=Cosmo&background=3f4b72&color=fff';

  constructor(public auth: AuthService, private router: Router, private toastService: ToastService) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  goToSettings() {
    this.toastService.info('Settings panel not implemented in prototype');
  }
}
