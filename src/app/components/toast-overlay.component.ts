import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toastService.toasts$ | async"
        class="toast"
        [class.toast-success]="toast.type === 'success'"
        [class.toast-error]="toast.type === 'error'"
        [class.toast-info]="toast.type === 'info'"
        [class.toast-warning]="toast.type === 'warning'"
      >
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" (click)="toastService.remove(toast.id)">×</button>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 360px;
      }
      .toast {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-radius: 16px;
        background: rgba(12, 14, 23, 0.96);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        color: #eef2ff;
        font-size: 0.95rem;
        animation: slideIn 0.25s ease-out;
      }
      .toast-success { border-left: 4px solid #4ade80; }
      .toast-error { border-left: 4px solid #f87171; }
      .toast-info { border-left: 4px solid #60a5fa; }
      .toast-warning { border-left: 4px solid #fbbf24; }
      .toast-close {
        background: none;
        border: none;
        color: #8a95b8;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0 0 0 12px;
      }
      .toast-close:hover { color: #fff; }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `,
  ],
})
export class ToastOverlayComponent {
  constructor(public toastService: ToastService) {}
}
