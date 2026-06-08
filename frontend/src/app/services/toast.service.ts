import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toasts.asObservable();

  show(message: string, type: Toast['type'] = 'info', duration = 4000) {
    const toast: Toast = {
      id: Math.random().toString(36).substring(2),
      message,
      type,
      duration,
    };
    this.toasts.next([...this.toasts.value, toast]);
    setTimeout(() => this.remove(toast.id), duration);
  }

  remove(id: string) {
    this.toasts.next(this.toasts.value.filter((t) => t.id !== id));
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }
  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }
  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }
  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }
}
