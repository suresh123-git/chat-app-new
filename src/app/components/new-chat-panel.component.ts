import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { GroupChatModalComponent } from './group-chat-modal.component';

@Component({
  standalone: false,
  selector: 'app-new-chat-panel',
  template: `
    <button class="icon-btn" (click)="openGroupModal()" title="New Group" aria-label="New Group">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    </button>
    <app-group-chat-modal #groupModal></app-group-chat-modal>
  `,
  styles: [
    `
      .icon-btn {
        background: transparent;
        border: none;
        padding: 0;
        color: #aebac1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      }
      .icon-btn:hover {
        color: #d1d7db;
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
