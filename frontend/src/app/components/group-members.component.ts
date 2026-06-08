import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { Chat } from '../models/chat.model';
import { User } from '../models/user.model';
import { ToastService } from '../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-group-members',
  template: `
    <div class="group-members" *ngIf="chat && chat.type === 'group'">
      <div class="members-list">
        <div class="member-item" *ngFor="let member of chat.members">
          <div class="member-info">
            <div class="avatar">{{ getMemberInitial(member) }}</div>
            <div class="details">
              <span class="name">{{ getMemberName(member) }}</span>
              <span class="email">{{ getMemberEmail(member) }}</span>
              <span class="status" [class.online]="getMemberStatus(member) === 'online'">
                {{ getMemberStatus(member) || 'offline' }}
              </span>
            </div>
          </div>

          <div class="member-actions" *ngIf="isAdmin">
            <span class="admin-badge" *ngIf="isAdminMember(member._id)">Admin</span>
            <div class="action-menu">
              <button type="button" (click)="toggleMenu(member._id)" class="menu-btn">⋮</button>
              <div class="dropdown" *ngIf="activeMenu === member._id" (clickOutside)="closeMenu()">
                <button type="button" (click)="promoteToAdmin(member)" *ngIf="!isAdminMember(member._id)">
                  Make Admin
                </button>
                <button type="button" (click)="demoteFromAdmin(member)" *ngIf="isAdminMember(member._id) && canDemote()">
                  Remove Admin
                </button>
                <button type="button" (click)="removeMember(member)" *ngIf="!isCurrentUser(member._id)">
                  Remove Member
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            (click)="leaveGroup()"
            class="leave-btn"
            *ngIf="isCurrentUser(member._id)"
          >
            Leave
          </button>
        </div>
      </div>

      <div class="members-count">
        {{ chat.members.length || 0 }} member{{ (chat.members.length || 0) !== 1 ? 's' : '' }}
      </div>
    </div>
  `,
  styles: [
    `
      .group-members {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .members-list {
        display: grid;
        gap: 10px;
      }

      .member-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        gap: 12px;
      }

      .member-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;
      }

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(111, 94, 251, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        flex-shrink: 0;
      }

      .details {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .name {
        font-size: 0.95rem;
        font-weight: 500;
        color: #e6edf7;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .email {
        font-size: 0.85rem;
        color: #8b97b3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .status {
        font-size: 0.75rem;
        color: #f85149;
        text-transform: capitalize;
      }

      .status.online {
        color: #3fb950;
      }

      .member-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .admin-badge {
        display: inline-block;
        padding: 4px 8px;
        background: rgba(111, 94, 251, 0.3);
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #c8d6f0;
      }

      .action-menu {
        position: relative;
      }

      .menu-btn {
        background: transparent;
        border: none;
        color: #8b97b3;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 4px 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      }

      .menu-btn:hover {
        color: #e6edf7;
      }

      .dropdown {
        position: absolute;
        right: 0;
        top: 100%;
        background: #0d1117;
        border: 1px solid rgba(111, 94, 251, 0.3);
        border-radius: 8px;
        min-width: 160px;
        z-index: 100;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        margin-top: 4px;
      }

      .dropdown button {
        width: 100%;
        padding: 10px 16px;
        background: transparent;
        border: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        color: #e6edf7;
        cursor: pointer;
        text-align: left;
        font-size: 0.9rem;
        transition: background 0.2s;
      }

      .dropdown button:last-child {
        border-bottom: none;
      }

      .dropdown button:hover {
        background: rgba(111, 94, 251, 0.15);
      }

      .dropdown button:last-child:hover {
        background: rgba(248, 81, 73, 0.15);
        color: #f85149;
      }

      .leave-btn {
        padding: 6px 12px;
        background: transparent;
        border: 1px solid rgba(248, 81, 73, 0.3);
        border-radius: 6px;
        color: #f85149;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .leave-btn:hover {
        background: rgba(248, 81, 73, 0.1);
        border-color: rgba(248, 81, 73, 0.6);
      }

      .members-count {
        font-size: 0.85rem;
        color: #8b97b3;
        text-align: center;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }
    `,
  ],
})
export class GroupMembersComponent implements OnInit {
  @Input() chat: Chat | null = null;
  isAdmin = false;
  activeMenu: string | null = null;
  currentUserId = '';

  constructor(private chatService: ChatService, private authService: AuthService, private toastService: ToastService) {}

  ngOnInit() {
    this.currentUserId = this.authService.user$.value?._id || '';
    this.updateAdminStatus();
  }

  ngOnChanges() {
    this.updateAdminStatus();
  }

  private updateAdminStatus() {
    const currentUserId = this.authService.user$.value?._id;
    this.isAdmin = !!(currentUserId && (this.chat?.admins || []).includes(currentUserId as any));
  }

  getMemberName(member: any): string {
    if (!member) return 'Unknown';
    return typeof member === 'string' ? member : member.name || member.email || 'Unknown';
  }

  getMemberEmail(member: any): string {
    if (!member || typeof member === 'string') return '';
    return member.email || '';
  }

  getMemberStatus(member: any): string {
    if (!member || typeof member === 'string') return '';
    return member.status || '';
  }

  getMemberInitial(member: any): string {
    const name = this.getMemberName(member);
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  isAdminMember(memberId: string): boolean {
    return (this.chat?.admins || []).some((admin: any) => {
      const adminId = typeof admin === 'string' ? admin : admin?._id;
      return adminId === memberId;
    });
  }

  isCurrentUser(memberId: string): boolean {
    return this.currentUserId === memberId;
  }

  canDemote(): boolean {
    if (!this.chat) return false;
    return (this.chat.admins?.length || 0) > 1;
  }

  toggleMenu(memberId: string) {
    this.activeMenu = this.activeMenu === memberId ? null : memberId;
  }

  closeMenu() {
    this.activeMenu = null;
  }

  promoteToAdmin(member: User) {
    if (!this.chat) return;
    this.chatService.promoteToAdmin(this.chat._id, member._id).subscribe(
      () => {
        this.chatService.loadChats();
        this.chatService.selectChat(this.chat!);
        this.closeMenu();
      },
      (error) => {
        console.error('Failed to promote:', error);
        this.toastService.error('Failed to promote member: ' + (error?.error?.message || 'Unknown error'));
      },
    );
  }

  demoteFromAdmin(member: User) {
    if (!this.chat) return;
    this.chatService.demoteFromAdmin(this.chat._id, member._id).subscribe(
      () => {
        this.chatService.loadChats();
        this.chatService.selectChat(this.chat!);
        this.closeMenu();
      },
      (error) => {
        console.error('Failed to demote:', error);
        this.toastService.error('Failed to demote member: ' + (error?.error?.message || 'Unknown error'));
      },
    );
  }

  removeMember(member: User) {
    if (!this.chat) return;
    if (confirm(`Remove ${member.name} from group?`)) {
      this.chatService.removeChatMember(this.chat._id, member._id).subscribe(
        () => {
          this.chatService.loadChats();
          this.closeMenu();
          this.toastService.success(`${member.name} removed from group.`);
        },
        (error) => {
          console.error('Failed to remove:', error);
          this.toastService.error('Failed to remove member: ' + (error?.error?.message || 'Unknown error'));
        },
      );
    }
  }

  leaveGroup() {
    if (!this.chat) return;
    if (confirm('Leave this group chat?')) {
      this.chatService.leaveChat(this.chat._id).subscribe(
        () => {
          this.chatService.loadChats();
          this.chatService.selectedChat$.next(null);
          this.toastService.success('You have left the group.');
        },
        (error) => {
          console.error('Failed to leave:', error);
          this.toastService.error('Failed to leave group: ' + (error?.error?.message || 'Unknown error'));
        },
      );
    }
  }
}

// Directive for clicking outside
import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[clickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();

  @HostListener('document:click', ['$event.target'])
  onClick(target: EventTarget | null) {
    if (!target) return;
    const clickedInside = (target as HTMLElement)?.closest('[clickOutside]');
    if (!clickedInside) {
      this.clickOutside.emit();
    }
  }
}
