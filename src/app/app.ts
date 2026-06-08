import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastOverlayComponent } from './components/toast-overlay.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}
