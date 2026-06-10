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
    <div class="master-container">
      <!-- Desktop Left Rail -->
      <nav class="desktop-rail" role="tablist">
        <button class="rail-item" [class.active]="activeTab === 'personal'" (click)="setTab('personal')" aria-label="Chats" title="Chats">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"></path>
          </svg>
        </button>
        <button class="rail-item" [class.active]="activeTab === 'group'" (click)="setTab('group')" aria-label="Groups" title="Groups">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M7 21v-2a4 4 0 0 1 3-3.87"></path>
            <path d="M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" transform="translate(0 2)"></path>
          </svg>
        </button>
      </nav>

      <div class="sidebar-layout">
        <header class="app-header">
          <div class="header-profile" *ngIf="auth.user$ | async as currentUser">
            <div class="avatar" [title]="currentUser.name">{{ currentUser.name.charAt(0) || 'U' }}</div>
            <div class="header-text">
              <h1 class="app-title">Chats</h1>
            </div>
          </div>
          <div class="header-actions">
            <app-new-chat-panel></app-new-chat-panel>
            <button class="icon-btn" (click)="logout()" title="Logout" aria-label="Logout">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </header>

        <div class="search-container">
          <div class="search-input-wrapper">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input placeholder="Search or start new chat" (input)="onSearch($any($event.target).value)" />
          </div>
        </div>

        <div class="chat-list-container" role="list">
          <div class="loading-indicator" *ngIf="loading">
            <span class="spinner"></span>
          </div>

          <ng-container *ngIf="!loading">
            <ng-container *ngIf="activeTab === 'personal'">
              <div class="empty-state" *ngIf="visiblePersonalUsers.length === 0">No contacts found.</div>
              <button
                type="button"
                class="chat-item"
                *ngFor="let user of visiblePersonalUsers"
                (click)="openPersonalChat(user)"
                [class.active]="hasActiveChat(user._id)"
              >
                <div class="chat-avatar">{{ user.name ? user.name.charAt(0) : 'U' }}</div>
                <div class="chat-info">
                  <div class="chat-title-row">
                    <span class="chat-title">{{ user.name }}</span>
                  </div>
                  <div class="chat-subtitle-row">
                    <span class="chat-preview">{{ user.email }}</span>
                  </div>
                </div>
              </button>
            </ng-container>

            <ng-container *ngIf="activeTab === 'group'">
              <div class="empty-state" *ngIf="chats.length === 0">No groups found.</div>
              <button
                class="chat-item"
                *ngFor="let chat of chats"
                [class.active]="chat._id === selectedId"
                (click)="select(chat)"
              >
                <div class="chat-avatar">{{ chat.title?.charAt(0) || 'G' }}</div>
                <div class="chat-info">
                  <div class="chat-title-row">
                    <span class="chat-title">{{ chat.title || 'Group Chat' }}</span>
                    <span class="chat-time">{{ chat.updatedAt ? (chat.updatedAt | date:'shortTime') : '' }}</span>
                  </div>
                  <div class="chat-subtitle-row">
                    <span class="chat-preview">{{ chat.lastMessage || 'Start the conversation' }}</span>
                    <span class="chat-badge" *ngIf="chat.unreadCount && chat.unreadCount > 0">{{ chat.unreadCount }}</span>
                  </div>
                </div>
              </button>
            </ng-container>
          </ng-container>
        </div>

        <!-- Mobile Bottom Nav -->
        <nav class="bottom-nav" role="tablist">
          <button class="nav-tab" [class.active]="activeTab === 'personal'" (click)="setTab('personal')" aria-label="Chats">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"></path>
            </svg>
            <span>Chats</span>
          </button>
          <button class="nav-tab" [class.active]="activeTab === 'group'" (click)="setTab('group')" aria-label="Groups">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M7 21v-2a4 4 0 0 1 3-3.87"></path>
              <path d="M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" transform="translate(0 2)"></path>
            </svg>
            <span>Groups</span>
          </button>
        </nav>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        background: #090b12;
      }

      .master-container {
        display: flex;
        height: 100dvh;
        width: 100%;
        background: #090b12;
      }

      /* Desktop Rail */
      .desktop-rail {
        display: flex;
        flex-direction: column;
        width: 64px;
        background: #0c0f17;
        border-right: 1px solid rgba(255, 255, 255, 0.04);
        align-items: center;
        padding-top: 16px;
        gap: 24px;
        flex-shrink: 0;
      }

      .rail-item {
        background: transparent;
        border: none;
        color: #8b97b3;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        transition: all 0.2s;
      }

      .rail-item:hover {
        color: #c3cce0;
        background: rgba(255, 255, 255, 0.04);
      }

      .rail-item.active {
        color: #fff;
        background: rgba(111, 94, 251, 0.24);
      }

      .rail-item.active svg {
        color: #6f5efb;
      }

      /* Sidebar Main Layout */
      .sidebar-layout {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #090b12;
        color: #eaf0ff;
        box-sizing: border-box;
        min-width: 0;
      }

      .app-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: #0c0f17;
        flex-shrink: 0;
        height: 60px;
        box-sizing: border-box;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      }

      .header-profile {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(111, 94, 251, 0.24);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.1rem;
      }

      .app-title {
        font-size: 1.2rem;
        font-weight: 600;
        margin: 0;
        color: #eaf0ff;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .icon-btn {
        background: transparent;
        border: none;
        padding: 0;
        color: #8b97b3;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      }

      .icon-btn:hover {
        color: #c3cce0;
      }

      .search-container {
        padding: 8px 12px;
        background: #090b12;
        flex-shrink: 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      }

      .search-input-wrapper {
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        padding: 0 12px;
        height: 38px;
        gap: 12px;
        border: 1px solid transparent;
        transition: border-color 0.2s, background 0.2s;
      }

      .search-input-wrapper:focus-within {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(111, 94, 251, 0.4);
      }

      .search-icon {
        color: #8b97b3;
      }

      .search-input-wrapper input {
        flex: 1;
        background: transparent;
        border: none;
        color: #eaf0ff;
        font-size: 0.95rem;
        outline: none;
      }

      .search-input-wrapper input::placeholder {
        color: #8b97b3;
      }

      .chat-list-container {
        flex: 1;
        overflow-y: auto;
        background: #090b12;
        display: flex;
        flex-direction: column;
      }

      .chat-list-container::-webkit-scrollbar {
        width: 6px;
      }

      .chat-list-container::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
      }

      .chat-item {
        display: flex;
        align-items: center;
        width: 100%;
        background: transparent;
        border: none;
        padding: 0 12px 0 12px;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s;
      }

      .chat-item:hover,
      .chat-item.active {
        background: rgba(111, 94, 251, 0.1);
      }

      .chat-avatar {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: rgba(111, 94, 251, 0.24);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        font-weight: 700;
        flex-shrink: 0;
        margin-right: 12px;
      }

      .chat-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 12px 12px 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        min-width: 0;
        height: 72px;
        box-sizing: border-box;
      }

      .chat-item:last-child .chat-info {
        border-bottom: none;
      }
      
      .chat-item.active .chat-info {
        border-bottom-color: transparent;
      }

      .chat-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .chat-title {
        font-size: 1.05rem;
        color: #eaf0ff;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chat-time {
        font-size: 0.75rem;
        color: #8b97b3;
        flex-shrink: 0;
        margin-left: 8px;
      }

      .chat-subtitle-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .chat-preview {
        font-size: 0.88rem;
        color: #8b97b3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }

      .chat-badge {
        background: #6f5efb;
        color: #fff;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 10px;
        padding: 2px 6px;
        min-width: 20px;
        text-align: center;
        flex-shrink: 0;
        margin-left: 8px;
      }

      /* Bottom Nav (Hidden on Desktop) */
      .bottom-nav {
        display: none;
      }

      @media (max-width: 760px) {
        .desktop-rail {
          display: none;
        }

        .bottom-nav {
          display: flex;
          background: #0c0f17;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          flex-shrink: 0;
          height: 60px;
          padding-bottom: env(safe-area-inset-bottom);
          box-sizing: content-box;
        }

        .nav-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #8b97b3;
          cursor: pointer;
          gap: 4px;
          transition: color 0.2s;
        }

        .nav-tab span {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .nav-tab.active {
          color: #6f5efb;
        }

        .nav-tab:hover:not(.active) {
          color: #c3cce0;
        }
      }

      .loading-indicator {
        display: flex;
        justify-content: center;
        padding: 24px;
      }

      .spinner {
        width: 24px;
        height: 24px;
        border: 3px solid rgba(111, 94, 251, 0.1);
        border-top-color: #6f5efb;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .empty-state {
        text-align: center;
        color: #8b97b3;
        padding: 32px 16px;
        font-size: 0.95rem;
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

  hasActiveChat(userId: string): boolean {
    const chat = this.chat.findPersonalChatByUserId(userId);
    return chat ? chat._id === this.selectedId : false;
  }
}
