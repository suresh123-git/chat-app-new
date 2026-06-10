import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ChatService } from '../services/chat.service';
import { User } from '../models/user.model';
import { ToastService } from '../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-group-chat-modal',
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Create Group Chat</h2>
          <button class="close-btn" (click)="close()">×</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="createGroup()">
          <div class="form-group">
            <label>Group Name</label>
            <input formControlName="title" placeholder="Enter group name" />
            <span class="error" *ngIf="form.get('title')?.hasError('required') && form.get('title')?.touched">
              Group name is required
            </span>
          </div>

          <div class="form-group">
            <label>Add Members</label>
            <div class="member-search">
              <input
                type="text"
                formControlName="memberQuery"
                placeholder="Search members by name or email"
                autocomplete="off"
              />
            </div>

            <div class="shimmer-dropdown" *ngIf="isSearchingMembers">
              <div class="shimmer-item"></div>
              <div class="shimmer-item"></div>
              <div class="shimmer-item"></div>
            </div>

            <div class="search-dropdown" *ngIf="!isSearchingMembers && memberSearchResults.length > 0">
              <div class="search-debug">Results: {{ memberSearchResults.length }}</div>
              <button
                type="button"
                *ngFor="let user of memberSearchResults"
                (click)="addMemberToSelection(user)"
                [disabled]="isUserSelected(user._id)"
              >
                <span>{{ user.name || user.email }}</span>
                <small>{{ user.email }}</small>
              </button>
            </div>

            <div class="search-hint" *ngIf="query && !isSearchingMembers && memberSearchResults.length === 0">
              No members found. Try a different search term.
            </div>

            <div class="selected-members">
              <div class="member-tag" *ngFor="let member of selectedMembers">
                {{ member.name }}
                <button type="button" (click)="removeMemberFromSelection(member._id)">×</button>
              </div>
            </div>

            <span class="error" *ngIf="selectedMembers.length === 0 && form.touched">
              Please select at least one member
            </span>
          </div>

          <div class="form-actions">
            <button type="button" (click)="close()" class="cancel-btn">Cancel</button>
            <button type="submit" class="create-btn" [disabled]="!isFormValid()">Create Group</button>
          </div>
        </form>

        <div class="loading" *ngIf="isLoading">
          Creating group...
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background: #0d1117;
        border-radius: 24px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow: visible;
        display: flex;
        flex-direction: column;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.2rem;
      }

      .close-btn {
        background: none;
        border: none;
        color: #8b97b3;
        font-size: 1.8rem;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .close-btn:hover {
        color: #e6edf7;
      }

      form {
        padding: 24px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .form-group label {
        font-size: 0.9rem;
        font-weight: 600;
        color: #e6edf7;
      }

      .form-group input {
        padding: 12px 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.05);
        color: #e6edf7;
        font-size: 0.95rem;
      }

      .form-group input:focus {
        outline: none;
        border-color: rgba(111, 94, 251, 0.6);
        background: rgba(255, 255, 255, 0.08);
      }

      .form-group input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .member-search {
        position: static;
      }

      .search-dropdown {
        position: static;
        background: #0d1117;
        border: 1px solid rgba(111, 94, 251, 0.3);
        border-radius: 12px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 9999;
        margin-top: 8px;
      }
      .shimmer-dropdown {
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        margin-top: 8px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .shimmer-item {
        height: 48px;
        border-radius: 8px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.03) 25%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.03) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite linear;
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      .search-debug {
        padding: 8px 12px;
        color: #9f9fff;
        font-size: 0.85rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .search-dropdown button {
        width: 100%;
        padding: 12px 16px;
        background: transparent;
        border: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        color: #e6edf7;
        cursor: pointer;
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .search-dropdown button:last-child {
        border-bottom: none;
      }

      .search-dropdown button:hover:not(:disabled),
      .search-dropdown button:focus:not(:disabled) {
        background: rgba(111, 94, 251, 0.15);
      }

      .search-dropdown small {
        font-size: 0.85rem;
        color: #8b97b3;
      }

      .search-hint {
        padding: 12px 16px;
        color: #8b97b3;
        font-size: 0.9rem;
        text-align: center;
        margin-top: 8px;
      }

      .selected-members {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 32px;
      }

      .member-tag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(111, 94, 251, 0.2);
        border: 1px solid rgba(111, 94, 251, 0.4);
        border-radius: 16px;
        padding: 6px 12px;
        font-size: 0.9rem;
        color: #c8d6f0;
      }

      .member-tag button {
        background: none;
        border: none;
        color: #8b97b3;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .member-tag button:hover {
        color: #e6edf7;
      }

      .error {
        font-size: 0.85rem;
        color: #f85149;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .cancel-btn,
      .create-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.95rem;
        transition: all 0.2s ease;
      }

      .cancel-btn {
        background: rgba(255, 255, 255, 0.05);
        color: #e6edf7;
      }

      .cancel-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .create-btn {
        background: rgba(111, 94, 251, 0.8);
        color: #fff;
      }

      .create-btn:hover:not(:disabled) {
        background: rgba(111, 94, 251, 1);
        transform: translateY(-1px);
      }

      .create-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .loading {
        text-align: center;
        color: #8b97b3;
        padding: 8px;
      }
    `,
  ],
})
export class GroupChatModalComponent implements OnInit {
  isOpen = false;
  isLoading = false;
  isSearchingMembers = false;
  form!: FormGroup;
  query = '';
  selectedMembers: User[] = [];
  memberSearchResults: User[] = [];

  constructor(
    private fb: FormBuilder,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      memberQuery: [''],
    });
  }

  ngOnInit() {
    this.form
      .get('memberQuery')
      ?.valueChanges.pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((value: string) => {
        console.log('memberQuery valueChanges:', value);
        this.query = (value || '').trim();
        this.onSearchMembers(this.query);
      });
  }

  open() {
    this.isOpen = true;
    this.query = '';
    this.form.reset({ title: '', memberQuery: '' });
    this.memberSearchResults = [];
    this.selectedMembers = [];
    this.cdr.detectChanges();
  }

  close() {
    this.isOpen = false;
    this.form.reset({ title: '', memberQuery: '' });
    this.selectedMembers = [];
    this.memberSearchResults = [];
    this.cdr.detectChanges();
  }

  onSearchMembers(query: string) {
    this.query = (query || '').trim();
    const term = this.query;
    console.log('group member search term:', term);

    if (!term) {
      this.isSearchingMembers = false;
      this.memberSearchResults = [];
      return;
    }

    this.isSearchingMembers = true;
    this.memberSearchResults = [];
    this.chatService.searchUsers(term).subscribe({
      next: (users) => {
        console.log('group search results:', users);
        this.memberSearchResults = users;
        console.log(this.memberSearchResults, 'mmmmmmmmmmm', this.selectedMembers);
      },
      error: (error: any) => {
        console.error('Search failed:', error);
        this.isSearchingMembers = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isSearchingMembers = false;
        this.cdr.detectChanges();
      },
    });
  }

  addMemberToSelection(user: User) {
    if (!this.isUserSelected(user._id)) {
      this.selectedMembers.push(user);
      this.memberSearchResults = this.memberSearchResults.filter((u) => u._id !== user._id);
      this.query = '';
      this.form.get('memberQuery')?.setValue('');
    }
  }

  removeMemberFromSelection(userId: string) {
    this.selectedMembers = this.selectedMembers.filter((member) => member._id !== userId);
  }

  isUserSelected(userId: string): boolean {
    return this.selectedMembers.some((member) => member._id === userId);
  }

  isFormValid(): boolean {
    return !!(this.form.get('title')?.valid && this.selectedMembers.length > 0);
  }

  createGroup() {
    if (!this.isFormValid()) {
      return;
    }

    this.isLoading = true;
    const title = this.form.get('title')?.value;
    const memberIds = this.selectedMembers.map((member) => member._id);

    this.chatService.createGroupChat(title, memberIds).subscribe(
      (chat) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.chatService.loadChats();
        this.chatService.selectChat(chat);
        this.close();
      },
      (error: any) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        console.error('Failed to create group:', error);
        this.toastService.error('Failed to create group: ' + (error?.error?.message || 'Unknown error'));
      },
    );
  }
}
