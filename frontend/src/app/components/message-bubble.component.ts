import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Message } from '../models/message.model';

@Component({
  standalone: false,
  selector: 'app-message-bubble',
  template: `
    <div class="bubble-wrapper" [class.own]="isOwn">
      <div class="bubble" [class.own]="isOwn" (mouseenter)="showActions = true" (mouseleave)="showActions = false">
        <div class="bubble-row">
          <span class="sender" *ngIf="!isOwn">{{ message.sender.name }}</span>
          <span class="timestamp">{{ message.createdAt | date:'shortTime' }}</span>
        </div>
        <div class="bubble-body">
          <ng-container [ngSwitch]="message.type">
            <div *ngSwitchCase="'text'">
              <span *ngIf="!isEditing">{{ message.content }}</span>
              <div *ngIf="isEditing" class="edit-box">
                <input [(ngModel)]="editText" (keydown.enter)="saveEdit()" (keydown.escape)="cancelEdit()" />
                <div class="edit-actions">
                  <button class="save-btn" (click)="saveEdit()">Save</button>
                  <button class="cancel-btn" (click)="cancelEdit()">Cancel</button>
                </div>
              </div>
            </div>
            <a *ngSwitchCase="'file'" [href]="message.content" target="_blank">Download attachment</a>
            <img *ngSwitchCase="'image'" [src]="message.content" alt="image" />
          </ng-container>
        </div>
        <div class="bubble-footer">
          <span class="edited" *ngIf="message.isEdited">edited</span>
          <div class="reaction-row">
            <span class="status" [class.read]="message.status === 'read'">
              {{ message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓' }}
            </span>
            <div class="reactions" *ngIf="message.reactions.length">
              <span *ngFor="let reaction of message.reactions">{{ reaction.emoji }} {{ reaction.users.length }}</span>
            </div>
          </div>
        </div>
        <div class="actions" *ngIf="showActions && isOwn && !isEditing">
          <button class="action-btn" (click)="startEdit()">Edit</button>
          <button class="action-btn delete" (click)="onDelete()">Delete</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .bubble-wrapper {
        display: flex;
        margin: 8px 0;
      }
      .bubble-wrapper.own {
        justify-content: flex-end;
      }
      .bubble {
        max-width: 76%;
        padding: 16px;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.05);
        color: #e7eefc;
        display: inline-flex;
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
        position: relative;
      }
      .bubble.own {
        background: rgba(111, 94, 251, 0.28);
        align-items: flex-end;
      }
      .bubble-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 0.8rem;
        color: #9aa2b3;
        width: 100%;
      }
      .bubble-body img {
        max-width: 320px;
        border-radius: 16px;
        display: block;
      }
      .bubble-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        gap: 10px;
      }
      .edited {
        font-size: 0.75rem;
        color: #b9c4df;
        font-style: italic;
      }
      .reaction-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        font-size: 0.85rem;
        color: #b9c4df;
        width: 100%;
      }
      .status.read {
        color: #7fdcff;
      }
      .reactions span {
        background: rgba(255, 255, 255, 0.06);
        border-radius: 999px;
        padding: 4px 10px;
      }
      .actions {
        display: flex;
        gap: 8px;
        margin-top: 6px;
      }
      .action-btn {
        background: rgba(255, 255, 255, 0.08);
        border: none;
        border-radius: 10px;
        padding: 6px 12px;
        color: #d9e3ff;
        font-size: 0.8rem;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .action-btn:hover {
        background: rgba(255, 255, 255, 0.14);
      }
      .action-btn.delete {
        color: #f87171;
      }
      .action-btn.delete:hover {
        background: rgba(248, 113, 113, 0.15);
      }
      .edit-box {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .edit-box input {
        width: 100%;
        border: 1px solid rgba(111, 94, 251, 0.4);
        background: rgba(255, 255, 255, 0.05);
        border-radius: 14px;
        padding: 10px 14px;
        color: #eef2ff;
      }
      .edit-actions {
        display: flex;
        gap: 8px;
      }
      .save-btn {
        background: rgba(111, 94, 251, 0.4);
        border: none;
        border-radius: 10px;
        padding: 6px 14px;
        color: #fff;
        cursor: pointer;
      }
      .cancel-btn {
        background: rgba(255, 255, 255, 0.08);
        border: none;
        border-radius: 10px;
        padding: 6px 14px;
        color: #b9c4df;
        cursor: pointer;
      }
    `,
  ],
})
export class MessageBubbleComponent {
  @Input() message!: Message;
  @Input() isOwn = false;
  @Output() edit = new EventEmitter<{ messageId: string; content: string }>();
  @Output() delete = new EventEmitter<string>();

  showActions = false;
  isEditing = false;
  editText = '';

  startEdit() {
    this.editText = this.message.content;
    this.isEditing = true;
  }

  saveEdit() {
    if (this.editText.trim() && this.editText !== this.message.content) {
      this.edit.emit({ messageId: this.message._id, content: this.editText.trim() });
    }
    this.isEditing = false;
  }

  cancelEdit() {
    this.isEditing = false;
    this.editText = '';
  }

  onDelete() {
    this.delete.emit(this.message._id);
  }
}
