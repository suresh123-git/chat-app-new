import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'https://chat-app-backend-9clb.onrender.com/api';
  // private base = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private headers() {
    const token = localStorage.getItem('chat_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }

  get<T>(path: string, params?: any): Observable<T> {
    return this.http.get<T>(`${this.base}${path}`, { headers: this.headers(), params });
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body, { headers: this.headers() });
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.base}${path}`, body, { headers: this.headers() });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${path}`, { headers: this.headers() });
  }

  upload<T>(path: string, form: FormData): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, form, { headers: this.headers() });
  }
}
