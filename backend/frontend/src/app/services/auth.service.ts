import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user$ = new BehaviorSubject<User | null>(null);
  isAuthenticated$ = new BehaviorSubject(false);

  constructor(private api: ApiService, private socket: SocketService, private router: Router) {
    const token = localStorage.getItem('chat_token');
    if (token) {
      this.isAuthenticated$.next(true);
      this.fetchProfile().subscribe({
        next: (result) => {
          this.user$.next(result.user);
          this.isAuthenticated$.next(true);
          this.socket.connect(token);
        },
        error: () => this.clearSession(),
      });
    }
  }

  login(email: string, password: string) {
    return this.api.post<{ accessToken: string; user: User }>('/auth/login', { email, password }).pipe(
      tap((result) => {
        localStorage.setItem('chat_token', result.accessToken);
        this.user$.next(result.user);
        this.isAuthenticated$.next(true);
        this.socket.connect(result.accessToken);
      }),
    );
  }

  signup(name: string, email: string, password: string, avatar?: string) {
    return this.api.post<{ accessToken: string; user: User }>('/auth/register', { name, email, password, avatar }).pipe(
      tap((result) => {
        localStorage.setItem('chat_token', result.accessToken);
        this.user$.next(result.user);
        this.isAuthenticated$.next(true);
        this.socket.connect(result.accessToken);
      }),
    );
  }

  logout() {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  hasStoredToken() {
    return Boolean(localStorage.getItem('chat_token'));
  }

  private clearSession() {
    localStorage.removeItem('chat_token');
    this.user$.next(null);
    this.isAuthenticated$.next(false);
    this.socket.disconnect();
  }

  fetchProfile() {
    return this.api.get<{ user: User }>('/auth/me').pipe(
      tap((result) => {
        this.user$.next(result.user);
      }),
    );
  }
}
