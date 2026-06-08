import { User } from './user.model';

export interface MessageReaction {
  emoji: string;
  users: string[];
}

export interface Message {
  _id: string;
  chat: string;
  sender: User;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  status: 'sent' | 'delivered' | 'read';
  reactions: MessageReaction[];
  readBy: string[];
  isEdited?: boolean;
  editedAt?: string;
  createdAt: string;
}
