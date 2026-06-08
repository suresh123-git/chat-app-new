import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { GroupChatModalComponent } from './group-chat-modal.component';

@Component({
  standalone: false,
  selector: 'app-new-chat-panel',
  template: `
    <section class="new-chat-panel">
      <div class="new-chat-header">
        <h3>Start a conversation</h3>
        <p>Search contacts and open a new chat.</p>
      </div>

      <div class="button-group">
        <button class="create-group-btn" (click)="openGroupModal()">+ Create Group</button>
      </div>
    </section>

    <app-group-chat-modal #groupModal></app-group-chat-modal>
  `,
  styles: [
    `
      .new-chat-panel {
        padding: 18px 22px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 24px;
        margin-bottom: 22px;
      }
      .new-chat-header h3 {
        margin: 0 0 4px;
        font-size: 1rem;
      }
      .new-chat-header p {
        margin: 0 0 18px;
        color: #8b97b3;
        font-size: 0.92rem;
      }
      .button-group {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
      }
      .create-group-btn {
        flex: 1;
        padding: 12px 16px;
        border: none;
        border-radius: 12px;
        background: rgba(111, 94, 251, 0.6);
        color: #e6edf7;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .create-group-btn:hover {
        background: rgba(111, 94, 251, 0.8);
        transform: translateY(-1px);
      }
      form input {
        width: 100%;
        border: none;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.05);
        color: #e6edf7;
        padding: 14px 18px;
        margin-bottom: 16px;
      }
      form input:focus {
        outline: 1px solid rgba(111, 94, 251, 0.6);
      }
      .search-results {
        display: grid;
        gap: 10px;
      }
      .search-results button {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 14px 18px;
        border: none;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.04);
        color: #eef2ff;
        cursor: pointer;
        text-align: left;
      }
      .search-results button:hover {
        background: rgba(111, 94, 251, 0.12);
      }
      .search-results strong {
        display: block;
      }
      .search-results span {
        color: #94a0b2;
        font-size: 0.9rem;
      }
      .status-message {
        color: #94a0b2;
        padding: 12px 0;
      }
    `,
  ],
})
export class NewChatPanelComponent implements OnInit {
  @ViewChild('groupModal', { static: false }) groupModal?: GroupChatModalComponent;

  constructor(
    private chat: ChatService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {}

  openGroupModal() {
    if (this.groupModal) {
      this.groupModal.open();
      this.cdr.detectChanges();
    }
  }
}
