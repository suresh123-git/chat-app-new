import { Component, OnInit, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { GroupMembersComponent } from './group-members.component';
import { ToastService } from '../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-info-panel',
  template: `
    <div class="info-card" *ngIf="chat">
      <div class="info-header">
        <div class="header-content">
          <h3>{{ chat.type === 'group' ? 'Group' : 'Conversation' }}</h3>
          <p class="chat-title">{{ chat.title || chat.members[0]?.name }}</p>
          <p class="chat-type" *ngIf="chat.type === 'group'">Group Chat</p>
        </div>
        <button type="button" (click)="deleteChat()" class="delete-btn" [title]="'Delete ' + (chat.type === 'group' ? 'group' : 'chat')">
          🗑️
        </button>
      </div>

      <div class="group-settings" *ngIf="chat.type === 'group'">
        <label>Group name</label>
        <div class="group-name-row">
          <input type="text" [(ngModel)]="groupName" placeholder="Group name" [readonly]="!isAdmin" />
          <button type="button" class="save-name-btn" (click)="saveGroupName()" [disabled]="!canSaveGroupName()">
            Save
          </button>
        </div>
        <small class="admin-note" *ngIf="!isAdmin">Only group admins can rename the group.</small>
      </div>

      <div class="info-content">
        <div *ngIf="chat.type === 'group'">
          <app-group-members [chat]="chat"></app-group-members>
          <div class="group-actions" *ngIf="isAdmin">
            <button type="button" (click)="openAddMembers()" class="add-members-btn">+ Add Members</button>
          </div>
        </div>

        <div *ngIf="chat.type === 'personal'" class="personal-members">
          <div class="info-group">
            <h4>Participant</h4>
            <div class="member-item" *ngFor="let member of otherMembers">
              <span>{{ member.name }}</span>
              <small [class.online]="member.status === 'online'">{{ member.status || 'offline' }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="info-placeholder" *ngIf="!chat">
      <p>Select a chat to see members and details</p>
    </div>
  `,
  styles: [
    `
      .info-card {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 24px;
        height: 100%;
        overflow-y: auto;
      }

      .info-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .header-content {
        flex: 1;
      }

      .info-header h3 {
        margin: 0;
        font-size: 0.9rem;
        color: #8b97b3;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .chat-title {
        margin: 8px 0 4px;
        font-size: 1.3rem;
        font-weight: 600;
        color: #e6edf7;
      }

      .chat-type {
        margin: 0;
        font-size: 0.85rem;
        color: #6e40c9;
      }

      .delete-btn {
        background: transparent;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 6px;
        opacity: 0.6;
        transition: opacity 0.2s;
      }

      .delete-btn:hover {
        opacity: 1;
      }

      .info-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 20px;
        overflow-y: auto;
      }

      .personal-members {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .info-group h4 {
        margin: 0 0 12px;
        font-size: 0.95rem;
        color: #8b97b3;
      }

      .member-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 14px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.03);
        gap: 12px;
      }

      .member-item small {
        color: #94a0b2;
        font-size: 0.85rem;
      }

      .member-item small.online {
        color: #3fb950;
      }

      .group-actions {
        display: grid;
        gap: 12px;
        margin-top: 12px;
      }

      .add-members-btn {
        padding: 12px 16px;
        border: 1px solid rgba(111, 94, 251, 0.4);
        border-radius: 12px;
        background: transparent;
        color: #c8d6f0;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .add-members-btn:hover {
        background: rgba(111, 94, 251, 0.15);
        border-color: rgba(111, 94, 251, 0.6);
      }

      .group-settings {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .group-name-row {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .group-name-row input {
        flex: 1;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.05);
        color: #e6edf7;
      }

      .save-name-btn {
        padding: 12px 16px;
        border-radius: 14px;
        border: none;
        background: rgba(111, 94, 251, 0.85);
        color: #fff;
        cursor: pointer;
        font-weight: 600;
      }

      .save-name-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .admin-note {
        color: #94a0b2;
        font-size: 0.85rem;
      }

      .info-placeholder {
        display: grid;
        place-items: center;
        height: 100%;
        color: #8b97b3;
        padding: 22px;
        text-align: center;
      }

      @media (max-width: 760px) {
        .info-card {
          height: 100dvh;
          padding: calc(18px + env(safe-area-inset-top)) 16px calc(18px + env(safe-area-inset-bottom));
          gap: 18px;
        }

        .chat-title {
          font-size: 1.1rem;
        }

        .group-name-row {
          flex-direction: column;
          align-items: stretch;
        }

        .save-name-btn,
        .add-members-btn {
          min-height: 44px;
        }
      }
    `,
  ],
})
export class InfoPanelComponent implements OnInit {
  @ViewChild(GroupMembersComponent) groupMembers!: GroupMembersComponent;
  chat: any = null;
  groupName = '';
  isAdmin = false;

  get otherMembers() {
    if (!this.chat?.members) return [];
    const currentUserId = this.auth.user$.value?._id;
    return this.chat.members.filter((member: any) => member._id !== currentUserId);
  }

  constructor(public chatService: ChatService, public auth: AuthService, private toastService: ToastService) {}

  ngOnInit() {
    this.chatService.selectedChat$.subscribe((chat) => {
      this.chat = chat;
      this.groupName = chat?.title || '';
      this.updateAdminStatus();
    });

    this.auth.user$.subscribe(() => {
      this.updateAdminStatus();
    });
  }

  private updateAdminStatus() {
    console.log('Updating admin status for chat:', this.chat);
    const currentUserId = this.auth.user$.value?._id;
    const admins = Array.isArray(this.chat?.admins) ? this.chat.admins : [];
    this.isAdmin = Boolean(
      currentUserId &&
      admins.some((admin: any) => {
        const adminId = typeof admin === 'string' ? admin : admin?._id;
        return adminId === currentUserId;
      }),
    );
  }

  async openAddMembers() {
    if (!this.chat) return;

    const input = prompt('Enter email addresses separated by commas:');
    if (!input) {
      this.toastService.info('Adding members cancelled.');
      return;
    }

    const emails = input
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter((email) => !!email);

    if (!emails.length) {
      return;
    }

    const existingIds = (this.chat?.members || []).map((m: any) => (typeof m === 'string' ? m : m._id));
    const memberIds: string[] = [];

    for (const email of emails) {
      try {
        const users = await firstValueFrom(this.chatService.searchUsers(email));
        const user = users.find((u) => u.email?.toLowerCase() === email);
        if (user && !existingIds.includes(user._id) && !memberIds.includes(user._id)) {
          memberIds.push(user._id);
        }
      } catch (error) {
        console.error('Search failed for', email, error);
      }
    }

    if (!memberIds.length) {
      this.toastService.warning('No matching users found for the entered emails.');
      return;
    }

    this.chatService.addGroupMembers(this.chat._id, memberIds).subscribe(
      (updated) => {
        this.chat = updated;
        this.chatService.upsertChat(updated);
        this.chatService.selectChat(updated);
        this.toastService.success('Members added successfully.');
      },
      (error) => {
        console.error('Failed to add members:', error);
        this.toastService.error('Failed to add members: ' + (error?.error?.message || 'Unknown error'));
      },
    );
  }

  canSaveGroupName(): boolean {
    return !!(
      this.chat?.type === 'group' &&
      this.groupName?.trim() &&
      this.groupName.trim() !== (this.chat.title || '')
    );
  }

  saveGroupName() {
    if (!this.chat || !this.canSaveGroupName()) return;

    const title = this.groupName.trim();
    this.chatService.updateChat(this.chat._id, { title }).subscribe(
      (updated) => {
        this.chat = updated;
        this.chatService.upsertChat(updated);
        this.chatService.selectChat(updated);
        this.toastService.success('Group name updated successfully.');
      },
      (error) => {
        console.error('Failed to update group name:', error);
        this.toastService.error('Failed to update group name: ' + (error?.error?.message || 'Unknown error'));
      },
    );
  }

  deleteChat() {
    if (this.chat.type === 'group' && !this.isAdmin) {
      this.toastService.warning('Only admins can delete group chats');
      return;
    }

    const confirmMsg = this.chat.type === 'group' ? 'Delete this group and all messages?' : 'Delete this chat?';
    if (confirm(confirmMsg)) {
      this.chatService.deleteChat(this.chat._id).subscribe(
        () => {
          this.chatService.loadChats();
          this.chatService.selectedChat$.next(null);
          this.toastService.success('Chat deleted successfully.');
        },
        (error) => {
          console.error('Failed to delete chat:', error);
          this.toastService.error('Failed to delete chat: ' + (error?.error?.message || 'Unknown error'));
        },
      );
    }
  }
}
