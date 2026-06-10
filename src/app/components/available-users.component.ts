import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { Chat } from '../models/chat.model';
import { User } from '../models/user.model';

type SidebarItem =
  | { kind: 'chat'; chat: Chat }
  | { kind: 'user'; user: User };

@Component({
  standalone: false,
  selector: 'app-available-users',
  template: `
    <section class="available-users-card">
      <div class="profile-summary" *ngIf="auth.user$ | async as currentUser">
        <img [src]="currentUser.avatar || defaultAvatar" alt="avatar" />
        <div class="profile-copy">
          <div>
            <strong>{{ currentUser.name }}</strong>
            <span>{{ currentUser.status || 'offline' }}</span>
          </div>
          <button type="button" class="logout-button" (click)="logout()" title="Logout" aria-label="Logout">
            <span>Logout</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="16 17 21 12 16 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="search-row">
        <input type="text" [(ngModel)]="query" placeholder="Search chats or people" (ngModelChange)="onSearch($any($event))" />
      </div>

      <div class="contacts-list">
        <button
          type="button"
          *ngFor="let item of visibleItems"
          [class.active]="item.kind === 'chat' && selectedChatId === item.chat._id"
          (click)="item.kind === 'chat' ? openChat(item.chat) : startChat(item.user)"
        >
          <div>
            <strong>{{ item.kind === 'chat' ? (item.chat.title || item.chat.members[0]?.name || 'Conversation') : item.user.name }}</strong>
            <span>{{ item.kind === 'chat' ? (item.chat.lastMessage || 'No messages yet') : item.user.email }}</span>
          </div>
          <small>
            {{ item.kind === 'chat' ? (item.chat.updatedAt ? (item.chat.updatedAt | date: 'shortTime') : '') : (item.user.status || 'offline') }}
          </small>
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .available-users-card {
        display: flex;
        flex-direction: column;
        gap: 18px;
        height: 100%;
        padding: 22px;
        background: rgba(15, 19, 32, 0.98);
        border-right: 1px solid rgba(255, 255, 255, 0.06);
      }
      .profile-summary {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.04);
      }
      .profile-copy {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
      }
      .profile-summary img {
        width: 54px;
        height: 54px;
        border-radius: 18px;
        object-fit: cover;
      }
      .profile-summary strong {
        display: block;
        font-size: 1rem;
      }
      .profile-summary span {
        color: #8b97b3;
        font-size: 0.9rem;
      }
      .logout-button {
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.08);
        color: #eef2ff;
        padding: 12px 16px;
        cursor: pointer;
        font-weight: 700;
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        overflow: visible;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }
      .logout-button::after {
        content: '';
        position: absolute;
        left: -6px;
        right: -6px;
        top: -6px;
        bottom: -6px;
        border-radius: 20px;
        pointer-events: none;
        box-shadow: 0 0 0 0 rgba(111, 94, 251, 0.06);
        animation: logoutPulse 2000ms infinite;
        opacity: 0.9;
      }
      .logout-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.22);
      }
      @keyframes logoutPulse {
        0% { box-shadow: 0 0 0 0 rgba(111,94,251,0.06); }
        70% { box-shadow: 0 0 0 10px rgba(111,94,251,0); }
        100% { box-shadow: 0 0 0 0 rgba(111,94,251,0); }
      }
      .search-row input {
        width: 100%;
        border: none;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.05);
        color: #eef2ff;
        padding: 14px 18px;
      }
      .contacts-list {
        display: grid;
        gap: 10px;
        overflow-y: auto;
        padding-right: 4px;
      }
      .contacts-list button {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 16px 18px;
        gap: 12px;
        width: 100%;
        border: none;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.03);
        color: #eef2ff;
        cursor: pointer;
        text-align: left;
      }
      .contacts-list button.active,
      .contacts-list button:hover {
        background: rgba(111, 94, 251, 0.16);
      }
      .contacts-list strong {
        display: block;
      }
      .contacts-list span {
        color: #94a0b2;
        font-size: 0.9rem;
      }
      .contacts-list small {
        color: #8b97b3;
        font-size: 0.82rem;
      }
    `,
  ],
})
export class AvailableUsersComponent implements OnInit {
  chats: Chat[] = [];
  contacts: User[] = [];
  userResults: User[] = [];
  visibleItems: SidebarItem[] = [];
  query = '';
  selectedChatId: string | null = null;
  defaultAvatar = 'https://ui-avatars.com/api/?name=Cosmo&background=3f4b72&color=fff';

  constructor(public auth: AuthService, private chat: ChatService) {}

  ngOnInit() {
    this.chat.chats$.subscribe((chats) => {
      this.chats = chats;
      this.syncVisibleItems();
    });
    this.chat.contacts$.subscribe((contacts) => {
      this.contacts = contacts;
      this.syncVisibleItems();
    });
    this.chat.selectedChat$.subscribe((chat) => (this.selectedChatId = chat?._id || null));
    this.chat.loadChats();
    this.chat.loadContacts();
  }

  onSearch(value: string) {
    const term = (value || '').trim();
    this.chat.loadChats(term || undefined);

    if (!term) {
      this.userResults = [];
      this.chat.loadContacts();
      this.syncVisibleItems();
      return;
    }

    this.chat.searchUsers(term).subscribe((users) => {
      const openChatUserIds = new Set(
        this.chats
          .filter((chat) => chat.type === 'personal')
          .map((chat) => chat.members[0]?._id)
          .filter((id): id is string => Boolean(id)),
      );

      this.userResults = users.filter((user) => !openChatUserIds.has(user._id));
      this.syncVisibleItems();
    });
  }

  openChat(chat: Chat) {
    this.chat.selectChat(chat);
  }

  logout() {
    this.auth.logout();
  }

  startChat(user: User) {
    const existingChat = this.chat.findPersonalChatByUserId(user._id);
    if (existingChat) {
      this.query = '';
      this.userResults = [];
      this.chat.selectChat(existingChat);
      this.syncVisibleItems();
      return;
    }

    this.chat.createPersonalChat(user._id).subscribe((chat) => {
      this.userResults = [];
      this.query = '';
      this.chat.upsertChat(chat);
      this.chat.selectChat(chat);
      this.chat.loadChats();
      this.syncVisibleItems();
    });
  }

  private syncVisibleItems() {
    const term = this.query.trim();
    const chatItems: SidebarItem[] = this.chats.map((chat) => ({ kind: 'chat', chat }));

    if (!term) {
      const existingPersonalChatUserIds = new Set(
        this.chats
          .filter((chat) => chat.type === 'personal')
          .flatMap((chat) => chat.members.map((member) => member._id))
          .filter((id): id is string => Boolean(id)),
      );

      const contactItems: SidebarItem[] = this.contacts
        .filter((user) => !existingPersonalChatUserIds.has(user._id))
        .map((user) => ({ kind: 'user', user }));

      this.visibleItems = [...chatItems, ...contactItems];
      return;
    }

    const userItems: SidebarItem[] = this.userResults.map((user) => ({ kind: 'user', user }));
    this.visibleItems = [...chatItems, ...userItems];
  }
}
