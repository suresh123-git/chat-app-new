import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { Message } from '../models/message.model';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: false,
  selector: 'app-chat-window',
  template: `
    <div class="window-panel" *ngIf="chat?.title || chat">
      <header class="window-header">
        <button type="button" class="mobile-back" (click)="goBack()" aria-label="Back to chats">Back</button>
        <div class="window-title">
          <h2>{{ chat?.title || chat?.members[0]?.name || 'Conversation' }}</h2>
          <span>{{ chat?.type === 'group' ? 'Group chat' : 'Personal chat' }}</span>
        </div>
        <div class="window-header-actions">
          <div class="status-chip">{{ chat?.members?.length }} members</div>
          <button *ngIf="chat?.type === 'group'" type="button" class="settings-btn" (click)="toggleGroupInfo()">
            Settings
          </button>
        </div>
      </header>
      <section class="message-stream" #messageStream>
        <div class="status-banner" *ngIf="typing?.typing && typing.chatId === chat?._id">
          Someone is typing...
        </div>
        <div class="loading-row" *ngIf="loading">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
        <div class="messages" *ngIf="groupedMessages.length > 0; else emptyState">
          <div *ngFor="let group of groupedMessages" class="message-group">
            <div class="date-separator">{{ group.label }}</div>
            <div *ngFor="let message of group.messages">
              <app-message-bubble [message]="message" [isOwn]="message.sender._id === currentUser?._id" (edit)="onEditMessage($event)" (delete)="onDeleteMessage($event)"></app-message-bubble>
            </div>
          </div>
        </div>
        <ng-template #emptyState>
          <div class="empty-state">
            <p>Pick a chat to start a polished conversation.</p>
          </div>
        </ng-template>
      </section>
      <footer class="window-footer">
        <app-input-box (sendMessage)="sendMessage($event)" (typingChange)="setTyping($event)"></app-input-box>
      </footer>
    </div>
    <div class="window-placeholder" *ngIf="!chat">
      <p *ngIf="activeTab === 'group'">Select a group to view message history.</p>
      <p *ngIf="activeTab === 'personal'">Select a chat to view message history.</p>
    </div>
  `,
  styles: [
    `
      .window-panel {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: rgba(255, 255, 255, 0.02);
        border-left: 1px solid rgba(255, 255, 255, 0.05);
      }
      .window-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 28px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }
      .window-header h2 {
        margin: 0;
      }
      .window-header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .settings-btn {
        background: rgba(111, 94, 251, 0.15);
        border: 1px solid rgba(111, 94, 251, 0.4);
        color: #e6edf7;
        border-radius: 14px;
        padding: 10px 16px;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .settings-btn:hover {
        background: rgba(111, 94, 251, 0.25);
      }
      .window-header span {
        color: #94a0b2;
        font-size: 0.95rem;
      }
      .status-chip {
        background: rgba(111, 94, 251, 0.18);
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 0.85rem;
        color: #d9e3ff;
      }
      .message-stream {
        flex: 1;
        overflow-y: auto;
        padding: 22px 28px;
      }
      .messages {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .message-group {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .date-separator {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #8a95b8;
        font-size: 0.8rem;
        margin: 14px 0;
        position: relative;
      }
      .date-separator::before,
      .date-separator::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.06);
        margin: 0 14px;
      }
      .empty-state {
        display: grid;
        place-items: center;
        height: 100%;
        color: #8b97b3;
      }
      .window-footer {
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        padding: 16px 28px;
      }
      .window-placeholder {
        display: grid;
        place-items: center;
        height: 100%;
        color: #8b97b3;
        padding: 32px;
      }
      .loading-row {
        display: flex;
        justify-content: center;
        gap: 6px;
        padding: 12px;
      }
      .loading-row .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #6f5efb;
        animation: dotPulse 1.2s ease-in-out infinite;
      }
      .loading-row .dot:nth-child(2) { animation-delay: 0.2s; }
      .loading-row .dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes dotPulse {
        0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1); }
      }
      .status-banner {
        background: rgba(95, 255, 231, 0.08);
        color: #b8fff7;
        border-radius: 18px;
        padding: 10px 14px;
        margin-bottom: 18px;
      }
      .mobile-back {
        display: none;
      }

      @media (max-width: 760px) {
        .window-panel,
        .window-placeholder {
          height: 100dvh;
          min-height: 100dvh;
        }

        .window-header {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 10px;
          padding: calc(12px + env(safe-area-inset-top)) 14px 12px;
          align-items: center;
        }

        .mobile-back {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          color: #e6edf7;
          border-radius: 12px;
          min-height: 40px;
          padding: 0 12px;
          cursor: pointer;
        }

        .window-header h2 {
          font-size: 1rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .window-title {
          min-width: 0;
        }

        .window-header span {
          font-size: 0.8rem;
        }

        .window-header-actions {
          gap: 6px;
        }

        .status-chip {
          display: none;
        }

        .settings-btn {
          padding: 10px 12px;
          border-radius: 12px;
          min-height: 40px;
        }

        .message-stream {
          padding: 14px 12px;
        }

        .window-footer {
          padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
          background: rgba(9, 11, 19, 0.96);
        }

        .empty-state {
          text-align: center;
          padding: 24px;
        }
      }
    `,
  ],
})
export class ChatWindowComponent implements OnInit, AfterViewChecked {
  chat: any = null;
  messages: Message[] = [];
  groupedMessages: { label: string; messages: Message[] }[] = [];
  typing: any = null;
  currentUser: any = null;
  activeTab: 'personal' | 'group' = 'personal';
  loading = false;
  private shouldScrollToBottom = false;

  @ViewChild('messageStream') messageStream!: ElementRef;

  constructor(
    public chatService: ChatService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.chat = null;
  }

  ngOnInit() {
    this.chatService.selectedChat$.subscribe((chat) => {
      this.chat = chat;
      this.cdr.detectChanges();
    });
    this.chatService.messages$.subscribe((messages) => {
      this.messages = messages;
      this.groupedMessages = this.groupByDate(messages);
      this.shouldScrollToBottom = true;
      this.cdr.detectChanges();
    });
    this.chatService.typing$.subscribe((typing) => {
      this.typing = typing;
      this.cdr.detectChanges();
    });
    this.chatService.activeTab$.subscribe((tab) => {
      this.activeTab = tab;
      this.cdr.detectChanges();
    });
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });
  }

  sendMessage(text: string) {
    this.loading = true;
    this.chatService.sendMessage(text);
    this.chatService.messages$.subscribe(() => { this.loading = false; this.cdr.detectChanges(); });
  }

  toggleGroupInfo() {
    this.chatService.toggleInfoPanel();
  }

  goBack() {
    this.chatService.clearSelectedChat();
  }

  setTyping(isTyping: boolean) {
    if (this.chat) {
      this.chatService.setTyping(this.chat._id, isTyping);
    }
  }

  onEditMessage(event: { messageId: string; content: string }) {
    this.chatService.editMessage(event.messageId, event.content).subscribe({
      next: () => {
        if (this.chat) {
          this.chatService.loadMessages(this.chat._id);
        }
      },
    });
  }

  onDeleteMessage(messageId: string) {
    this.chatService.deleteMessage(messageId).subscribe({
      next: () => {
        if (this.chat) {
          this.chatService.loadMessages(this.chat._id);
        }
      },
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom && this.messageStream) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom() {
    const el = this.messageStream.nativeElement as HTMLElement;
    el.scrollTop = el.scrollHeight;
  }

  private groupByDate(messages: Message[]): { label: string; messages: Message[] }[] {
    const groups: Record<string, Message[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    messages.forEach((msg) => {
      const date = new Date(msg.createdAt || Date.now());
      date.setHours(0, 0, 0, 0);
      let label: string;
      if (date.getTime() === today.getTime()) {
        label = 'Today';
      } else if (date.getTime() === yesterday.getTime()) {
        label = 'Yesterday';
      } else {
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      if (!groups[label]) groups[label] = [];
      groups[label].push(msg);
    });

    return Object.keys(groups).map((label) => ({ label, messages: groups[label] }));
  }
}
