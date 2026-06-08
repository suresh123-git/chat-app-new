import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'auth/login', loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent) },
  { path: 'auth/signup', loadComponent: () => import('./auth/signup.component').then((m) => m.SignupComponent) },
  { path: 'chat', loadChildren: () => import('./chat/chat.module').then((m) => m.ChatModule) },
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  { path: '**', redirectTo: 'chat' },
];
