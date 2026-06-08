import { Component } from '@angular/core';
import { ChatService } from '../services/chat.service';

@Component({
  standalone: false,
  selector: 'app-chat-shell',
  template: `
    <div class="chat-app" [class.info-open]="chatService.infoPanelOpen$ | async">
      <aside class="panel panel-left"><app-chat-list></app-chat-list></aside>
      <section class="panel panel-window"><app-chat-window></app-chat-window></section>
      <aside class="panel panel-right" *ngIf="chatService.infoPanelOpen$ | async"><app-info-panel></app-info-panel></aside>
    </div>
  `,
  styles: [
    `
      .chat-app {
        display: grid;
        grid-template-columns: 360px 1fr;
        min-height: 100vh;
        background: #090b13;
      }
      .chat-app.info-open {
        grid-template-columns: 360px 1fr 360px;
      }
      .panel-right {
        width: 360px;
        min-width: 360px;
        max-width: 360px;
        border-left: 1px solid rgba(255, 255, 255, 0.06);
        overflow-x: hidden;
      }
      .panel-left {
        width: 360px;
        min-width: 360px;
        max-width: 360px;
        border-right: 1px solid rgba(255, 255, 255, 0.06);
        overflow-x: hidden;
      }
      .panel-window {
        min-height: 100vh;
        min-width: 0;
      }
    `,
  ],
})
export class ChatShellComponent {
  constructor(public chatService: ChatService) {}
}
