import { ApplicationRef, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  chats$ = new BehaviorSubject<Chat[]>([]);
  selectedChat$ = new BehaviorSubject<Chat | null>(null);
  messages$ = new BehaviorSubject<Message[]>([]);
  typing$ = new BehaviorSubject<{ chatId: string; userId: string; typing: boolean } | null>(null);
  contacts$ = new BehaviorSubject<User[]>([]);
  activeTab$ = new BehaviorSubject<'personal' | 'group'>('personal');
  infoPanelOpen$ = new BehaviorSubject<boolean>(false);
  private currentChatType?: string;

  constructor(
    private api: ApiService,
    private socket: SocketService,
    private auth: AuthService,
    private appRef: ApplicationRef,
  ) {
    this.socket.on('receive_message', (message: Message) => {
      const normalizedMessage = this.normalizeMessage(message);
      const current = this.selectedChat$.value;
      const messageChatId = this.extractId(normalizedMessage.chat);

      if (current && messageChatId === current._id) {
        this.loadMessages(current._id);
      } else if (!current && messageChatId) {
        this.openChatById(messageChatId);
      }

      this.loadChats();
      this.requestRender();
    });

    this.socket.on('chat_update', (payload: { chatId?: string }) => {
      const selectedChatId = this.selectedChat$.value?._id;
      if (selectedChatId && payload?.chatId === selectedChatId) {
        this.loadMessages(selectedChatId);
      }

      this.loadChats();
      this.requestRender();
    });

    this.socket.on('typing', (payload: any) => {
      this.typing$.next(payload);
      this.requestRender();
    });

    this.socket.on('read_receipt', () => {
      this.loadMessages(this.selectedChat$.value?._id);
      this.requestRender();
    });
  }

  loadChats(search?: string, type?: string | null, autoSelect = true) {
    if (type !== undefined) {
      this.currentChatType = type === null ? undefined : type;
    } else {
      type = this.currentChatType;
    }

    const params: any = {};
    if (search) params.search = search;
    if (type) params.type = type;
    console.log('loadChats called with search:', search, 'type:', type, 'params:', params);
    this.api.get<Chat[]>('/chats', params).subscribe((chats) => {
      const normalizedChats = chats.map((chat) => this.normalizeChat(chat));
      this.chats$.next(normalizedChats);
      console.log('loaded chats', normalizedChats);

      const selectedChat = this.selectedChat$.value;
      if (!selectedChat) {
        if (autoSelect && !search && normalizedChats.length > 0) {
          this.selectChat(normalizedChats[0]);
        }
        return;
      }

      const refreshedSelection = normalizedChats.find((chat) => chat._id === selectedChat._id);
      if (!refreshedSelection) {
        if (!search) {
          if (normalizedChats.length > 0) {
            this.selectChat(normalizedChats[0]);
          }
        }
        return;
      }

      this.selectedChat$.next(refreshedSelection);
      this.requestRender();
    });
  }

  loadContacts(search?: string) {
    this.api.get<User[]>('/users/search', { q: search || '' }).subscribe((contacts) => {
      this.contacts$.next(contacts);
      this.requestRender();
    });
  }

  selectChat(chat: Chat) {
    const normalizedChat = this.normalizeChat(chat);
    this.selectedChat$.next(normalizedChat);
    if (normalizedChat.type !== 'group') {
      this.closeInfoPanel();
    }
    this.loadMessages(normalizedChat._id);
    this.socket.emit('join_chat', { chatId: normalizedChat._id });
    this.socket.emit('read_receipt', { chatId: normalizedChat._id });
    this.requestRender();
  }

  clearSelectedChat() {
    this.closeInfoPanel();
    this.selectedChat$.next(null);
    this.messages$.next([]);
    this.typing$.next(null);
    this.requestRender();
  }

  setActiveTab(tab: 'personal' | 'group') {
    this.activeTab$.next(tab);
  }

  openInfoPanel() {
    this.infoPanelOpen$.next(true);
  }

  closeInfoPanel() {
    this.infoPanelOpen$.next(false);
  }

  toggleInfoPanel() {
    this.infoPanelOpen$.next(!this.infoPanelOpen$.value);
  }

  loadMessages(chatId: string | undefined, page = 1) {
    if (!chatId) {
      this.messages$.next([]);
      return;
    }
    this.api.get<Message[]>(`/messages/chat/${chatId}`, { page: String(page) }).subscribe((messages) => {
      this.messages$.next(messages.map((message) => this.normalizeMessage(message)).reverse());
      this.requestRender();
    });
  }

  sendMessage(content: string, type: 'text' | 'image' | 'file' = 'text') {
    const chat = this.selectedChat$.value;
    if (!chat || !content.trim()) return;
    const optimisticMessage = this.addOptimisticMessage(content, type);

    this.socket.emit<{ success: boolean; message?: Message }>(
      'send_message',
      { chatId: chat._id, content, type },
      (response) => {
        if (!response?.success || !response.message) {
          if (optimisticMessage) {
            this.removeOptimisticMessage(optimisticMessage._id);
          }
          return;
        }

        if (this.selectedChat$.value?._id === chat._id) {
          if (optimisticMessage) {
            this.replaceOptimisticMessage(optimisticMessage._id, response.message);
          } else {
            this.loadMessages(chat._id);
          }
        }
      },
    );
  }

  setTyping(chatId: string, typing: boolean) {
    this.socket.emit('typing', { chatId, typing });
  }

  searchUsers(term: string) {
    return this.api.get<User[]>('/users/search', { q: term });
  }

  createPersonalChat(partnerId: string) {
    return this.api.post<Chat>('/chats', { type: 'personal', members: [partnerId] });
  }

  createGroupChat(title: string, memberIds: string[]) {
    return this.api.post<Chat>('/chats', { type: 'group', title, members: memberIds });
  }

  updateChat(chatId: string, data: Partial<Chat>) {
    return this.api.put<Chat>(`/chats/${chatId}`, data);
  }

  addGroupMembers(chatId: string, memberIds: string[]) {
    return this.api.post<Chat>(`/chats/${chatId}/members`, { members: memberIds });
  }

  removeChatMember(chatId: string, memberId: string) {
    return this.api.delete<Chat>(`/chats/${chatId}/members/${memberId}`);
  }

  leaveChat(chatId: string) {
    return this.api.post<Chat>(`/chats/${chatId}/leave`, {});
  }

  promoteToAdmin(chatId: string, memberId: string) {
    return this.api.post<Chat>(`/chats/${chatId}/members/${memberId}/promote`, {});
  }

  demoteFromAdmin(chatId: string, memberId: string) {
    return this.api.post<Chat>(`/chats/${chatId}/members/${memberId}/demote`, {});
  }

  deleteChat(chatId: string) {
    return this.api.delete<{ success: boolean; message: string }>(`/chats/${chatId}`);
  }

  editMessage(messageId: string, content: string) {
    return this.api.put<Message>(`/messages/${messageId}`, { content });
  }

  deleteMessage(messageId: string) {
    return this.api.delete<{ deleted: boolean; messageId: string }>(`/messages/${messageId}`);
  }

  upsertChat(chat: Chat) {
    const normalizedChat = this.normalizeChat(chat);
    const nextChats = this.chats$.value.filter((item) => item._id !== normalizedChat._id);
    this.chats$.next([normalizedChat, ...nextChats]);
    this.requestRender();
  }

  openChatById(chatId: string) {
    const existingChat = this.chats$.value.find((chat) => chat._id === chatId);
    if (existingChat) {
      this.selectChat(existingChat);
      return;
    }

    this.api.get<Chat>(`/chats/${chatId}`).subscribe((chat) => {
      this.upsertChat(chat);
      this.selectChat(chat);
    });
  }

  addOptimisticMessage(content: string, type: 'text' | 'image' | 'file' = 'text') {
    const chat = this.selectedChat$.value;
    const currentUser = this.auth.user$.value;
    if (!chat || !currentUser) {
      return null;
    }

    const optimisticMessage = this.normalizeMessage({
      _id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      chat: chat._id,
      sender: currentUser as any,
      content,
      type,
      status: 'sent',
      reactions: [],
      readBy: [],
      createdAt: new Date().toISOString(),
    } as Message);

    this.messages$.next([...this.messages$.value, optimisticMessage]);
    this.requestRender();
    return optimisticMessage;
  }

  replaceOptimisticMessage(tempId: string, message: Message) {
    const normalizedMessage = this.normalizeMessage(message);
    const nextMessages = this.messages$.value.map((item) => (item._id === tempId ? normalizedMessage : item));
    this.messages$.next(nextMessages);
    this.requestRender();
  }

  removeOptimisticMessage(tempId: string) {
    this.messages$.next(this.messages$.value.filter((item) => item._id !== tempId));
    this.requestRender();
  }

  findPersonalChatByUserId(userId: string): Chat | undefined {
    return this.chats$.value.find((chat) => {
      if (chat.type !== 'personal') {
        return false;
      }

      return chat.members.some((member) => member._id === userId);
    });
  }

  private normalizeChat(chat: Chat): Chat {
    const currentUserId = this.auth.user$.value?._id;
    if (!currentUserId || chat.type !== 'personal' || !Array.isArray(chat.members)) {
      return chat;
    }

    const sortedMembers = [...chat.members].sort((a, b) => {
      if (a._id === currentUserId) return 1;
      if (b._id === currentUserId) return -1;
      return 0;
    });

    return { ...chat, members: sortedMembers };
  }

  private normalizeMessage(message: Message): Message {
    return {
      ...message,
      _id: this.extractId(message._id as any) || String(message._id),
      chat: this.extractId(message.chat as any) || String(message.chat),
      sender: {
        ...message.sender,
        _id: this.extractId(message.sender?._id as any) || String(message.sender?._id || ''),
      },
      readBy: (message.readBy || []).map((userId: any) => this.extractId(userId) || String(userId)),
    };
  }

  private requestRender() {
    queueMicrotask(() => this.appRef.tick());
  }

  private extractId(value: any): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && typeof value.$oid === 'string') return value.$oid;
    if (typeof value === 'object' && typeof value._id === 'string') return value._id;
    if (typeof value === 'object' && value._id) return this.extractId(value._id);
    if (typeof value?.toHexString === 'function') return value.toHexString();

    if (typeof value?.toString === 'function') {
      const stringValue = value.toString();
      if (stringValue && stringValue !== '[object Object]') {
        return stringValue;
      }
    }

    return undefined;
  }
}
