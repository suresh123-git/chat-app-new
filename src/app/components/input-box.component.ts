import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-input-box',
  template: `
    <div class="input-row">
      <button class="action" type="button" (click)="toggleEmoji()">😀</button>
      <input
        [(ngModel)]="message"
        (focus)="typing(true)"
        (blur)="typing(false)"
        (keydown.enter)="submit($event)"
        placeholder="Write a message..."
      />
      <label class="upload-label">
        📎
        <input type="file" hidden (change)="uploadFile($event)" />
      </label>
      <button class="send-button" type="button" (click)="submit($event)">Send</button>
    </div>
    <div class="emoji-panel" *ngIf="showEmoji">
      <button type="button" *ngFor="let emoji of emojis" (click)="appendEmoji(emoji)">{{ emoji }}</button>
    </div>
  `,
  styles: [
    `
      .input-row {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        gap: 12px;
        align-items: center;
      }
      input {
        width: 100%;
        border: none;
        border-radius: 18px;
        padding: 16px 18px;
        background: rgba(255, 255, 255, 0.04);
        color: #f5f8ff;
      }
      input:focus {
        outline: 1px solid rgba(111, 94, 251, 0.4);
      }
      .send-button,
      .action,
      .upload-label {
        border: none;
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
        border-radius: 16px;
        padding: 14px 18px;
        cursor: pointer;
      }
      .emoji-panel {
        display: grid;
        grid-template-columns: repeat(8, minmax(36px, 1fr));
        gap: 10px;
        margin-top: 12px;
        padding: 14px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.04);
      }
      .emoji-panel button {
        border: none;
        background: transparent;
        font-size: 1.2rem;
        cursor: pointer;
      }

      @media (max-width: 760px) {
        .input-row {
          grid-template-columns: 42px minmax(0, 1fr) 42px 58px;
          gap: 7px;
        }

        input {
          min-height: 44px;
          border-radius: 14px;
          padding: 12px 13px;
          font-size: 0.95rem;
        }

        .send-button,
        .action,
        .upload-label {
          min-height: 42px;
          padding: 10px 8px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .send-button {
          font-size: 0.86rem;
          font-weight: 700;
        }

        .emoji-panel {
          grid-template-columns: repeat(4, minmax(40px, 1fr));
          gap: 8px;
          padding: 10px;
          border-radius: 16px;
        }
      }
    `,
  ],
})
export class InputBoxComponent {
  @Output() sendMessage = new EventEmitter<string>();
  @Output() typingChange = new EventEmitter<boolean>();

  message = '';
  showEmoji = false;
  emojis = ['😀', '👍', '🔥', '❤️', '🎉', '😄', '🙌', '😎'];

  submit(event: Event) {
    event.preventDefault();
    const trimmed = this.message.trim();
    if (!trimmed) return;
    this.sendMessage.emit(trimmed);
    this.message = '';
    this.typing(false);
  }

  appendEmoji(emoji: string) {
    this.message += emoji;
    this.showEmoji = false;
  }

  toggleEmoji() {
    this.showEmoji = !this.showEmoji;
  }

  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.sendMessage.emit(reader.result as string);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  typing(value: boolean) {
    this.typingChange.emit(value);
  }
}
