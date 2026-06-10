import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { Chat } from '../models/chat.model';
import { User } from '../models/user.model';
import { debounceTime, filter, Subject } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-chat-list',
  template: `
    <div class="list-panel">
      <div class="profile-section" *ngIf="auth.user$ | async as currentUser">
        <div class="profile-summary">
          <div class="avatar-large">{{ currentUser.name.charAt(0) || 'U' }}</div>
          <div class="profile-info">
            <strong>{{ currentUser.name }}</strong>
            <span>{{ currentUser.status || 'offline' }}</span>
          </div>
          <button type="button" class="logout-btn" (click)="logout()" title="Logout">⊗</button>
        </div>
      </div>

      <app-new-chat-panel></app-new-chat-panel>

      <div class="tabs">
        <button type="button" [class.active]="activeTab === 'personal'" (click)="setTab('personal')">Personal</button>
        <button type="button" [class.active]="activeTab === 'group'" (click)="setTab('group')">Groups</button>
      </div>

      <div class="search-box">
        <input placeholder="Search by name or group" (input)="onSearch($any($event.target).value)" />
      </div>

      <div class="loading-row" *ngIf="loading">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
      <div class="conversation-list">
        <ng-container *ngIf="activeTab === 'personal'">
          <div class="no-chats" *ngIf="visiblePersonalUsers.length === 0">
            No personal users found.
          </div>
          <button
            type="button"
            *ngFor="let user of visiblePersonalUsers"
            (click)="openPersonalChat(user)"
          >
            <div class="avatar">{{ user.name ? user.name.charAt(0) : 'U' }}</div>
            <div class="meta">
              <div class="title-row">
                <strong>{{ user.name }}</strong>
              </div>
              <span>{{ user.email }}</span>
            </div>
          </button>
        </ng-container>

        <ng-container *ngIf="activeTab === 'group'">
          <div class="no-chats" *ngIf="chats.length === 0">
            No groups found.
          </div>
          <button
            *ngFor="let chat of chats"
            [class.active]="chat._id === selectedId"
            (click)="select(chat)"
          >
            <div class="avatar">{{ chat.title?.charAt(0) || 'G' }}</div>
            <div class="meta">
              <div class="title-row">
                <strong>{{ chat.title || 'Group Chat' }}</strong>
                <span class="group-badge" title="Group Chat">👥</span>
              </div>
              <span>{{ chat.lastMessage || 'Start the conversation' }}</span>
            </div>
            <div class="right-column">
              <span class="time">{{ chat.updatedAt ? (chat.updatedAt | date:'shortTime') : '' }}</span>
              <span class="badge" *ngIf="chat.unreadCount && chat.unreadCount > 0">{{ chat.unreadCount }}</span>
            </div>
          </button>
        </ng-container>
      </div>
    </div>
  `,
  styles: [
    `
      .list-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 22px;
        background: rgba(15, 19, 32, 0.98);
        overflow: hidden;
      }

      .profile-section {
        margin-bottom: 22px;
      }

      .profile-summary {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 16px;
      }

      .avatar-large {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: rgba(111, 94, 251, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        flex-shrink: 0;
      }

      .profile-info {
        flex: 1;
        min-width: 0;
      }

      .profile-info strong {
        display: block;
        font-size: 0.95rem;
        margin-bottom: 2px;
      }

      .profile-info span {
        font-size: 0.85rem;
        color: #8b97b3;
      }

      .logout-btn {
        background: transparent;
        border: none;
        color: #8b97b3;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 4px 8px;
        flex-shrink: 0;
        transition: color 0.2s;
      }

      .logout-btn:hover {
        color: #e6edf7;
      }

      .tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
      }

      .tabs button {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.04);
        color: #e6edf7;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tabs button.active {
        background: rgba(111, 94, 251, 0.85);
        border-color: rgba(111, 94, 251, 0.9);
      }

      .search-box {
        margin-bottom: 20px;
      }

      .search-box input {
        width: 100%;
        border: none;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.05);
        color: #e6edf7;
        padding: 14px 18px;
      }

      .search-box input:focus {
        outline: 1px solid rgba(111, 94, 251, 0.6);
      }

      .conversation-list {
        display: grid;
        gap: 8px;
        flex: 1;
        overflow-y: auto;
        min-width: 0;
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
      .no-chats {
        padding: 18px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.03);
        color: #9aa2b3;
        text-align: center;
      }

      .conversation-list button {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 8px;
        align-items: center;
        padding: 10px 14px;
        min-height: 60px;
        max-height: 60px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid transparent;
        border-radius: 18px;
        color: #e2ebff;
        cursor: pointer;
        transition: transform 0.2s ease, border 0.2s ease, background 0.2s ease;
        text-align: left;
        min-width: 0;
      }

      .conversation-list button > .meta {
        min-width: 0;
      }

      .conversation-list button:hover,
      .conversation-list button.active {
        background: rgba(111, 94, 251, 0.15);
        border-color: rgba(111, 94, 251, 0.35);
        transform: translateY(-1px);
      }

      .avatar {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: rgba(111, 94, 251, 0.3);
        font-weight: 700;
        flex-shrink: 0;
      }

      .meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .title-row {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }

      .meta strong {
        display: block;
        font-size: 0.95rem;
        line-height: 1.1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .group-badge {
        font-size: 0.8rem;
        flex-shrink: 0;
      }

      .meta span {
        color: #9aa2b3;
        font-size: 0.85rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      @media (max-width: 760px) {
        .list-panel {
          height: 100dvh;
          padding: calc(14px + env(safe-area-inset-top)) 14px calc(14px + env(safe-area-inset-bottom));
        }

        .profile-section {
          margin-bottom: 14px;
        }

        .profile-summary {
          padding: 12px;
          border-radius: 14px;
        }

        .avatar-large {
          width: 42px;
          height: 42px;
        }

        .tabs {
          gap: 8px;
          margin-bottom: 12px;
        }

        .tabs button {
          min-height: 42px;
          padding: 9px 12px;
          border-radius: 12px;
        }

        .search-box {
          margin-bottom: 12px;
        }

        .search-box input {
          min-height: 44px;
          padding: 12px 14px;
          border-radius: 14px;
        }

        .conversation-list {
          gap: 7px;
          padding-bottom: 2px;
        }

        .conversation-list button {
          grid-template-columns: auto minmax(0, 1fr) auto;
          min-height: 64px;
          max-height: none;
          padding: 10px 12px;
          border-radius: 15px;
        }

        .avatar {
          width: 42px;
          height: 42px;
          border-radius: 13px;
        }

        .meta strong {
          font-size: 0.92rem;
        }

        .meta span {
          font-size: 0.78rem;
        }
      }
    `,
  ],
})
export class ChatListComponent implements OnInit {
  loading = false;
  chats: Chat[] = [];
  contacts: User[] = [];
  selectedId = '';
  activeTab: 'personal' | 'group' = 'personal';
  searchTerm = '';
  private search$ = new Subject<string>();

  constructor(
    public chat: ChatService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.chat.chats$.subscribe((chats) => {
      this.chats = chats;
      this.selectedId = this.chat.selectedChat$.value?._id || '';
      this.cdr.markForCheck();
    });

    this.chat.contacts$.subscribe((contacts) => {
      this.contacts = contacts;
      this.cdr.markForCheck();
    });

    this.search$.pipe(debounceTime(250)).subscribe((term) => {
      this.searchTerm = term;
      console.log('searching for', term, 'in tab', this.activeTab);
      if (this.activeTab === 'group') {
        this.chat.loadChats(term, 'group');
      }
    });

    this.auth.user$.pipe(filter((user) => !!user)).subscribe(() => {
      this.loading = true;
      this.chat.loadChats();
      this.chat.loadContacts();
      this.chat.chats$.subscribe(() => { this.loading = false; this.cdr.markForCheck(); });
    });

    this.chat.selectedChat$.subscribe((chat) => {
      this.selectedId = chat?._id || '';
      this.cdr.markForCheck();
    });
  }

  get visiblePersonalUsers(): User[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.contacts;
    }
    return this.contacts.filter((user) => {
      return (
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    });
  }

  setTab(tab: 'personal' | 'group') {
    this.activeTab = tab;
    this.searchTerm = '';
    this.chat.setActiveTab(tab);
    this.chat.clearSelectedChat();
    if (tab === 'group') {
      this.chat.loadChats('', 'group', false);
    } else {
      this.chat.loadChats('', null, false);
      this.chat.loadContacts();
    }
  }

  onSearch(value: string) {
    this.search$.next(value);
  }

  openPersonalChat(user: User) {
    const existingChat = this.chat.findPersonalChatByUserId(user._id);
    if (existingChat) {
      this.chat.selectChat(existingChat);
      return;
    }

    this.chat.createPersonalChat(user._id).subscribe((chat) => {
      this.chat.loadChats();
      this.chat.selectChat(chat);
    });
  }

  select(chat: Chat) {
    this.chat.selectChat(chat);
  }

  logout() {
    this.auth.logout();
  }
}
