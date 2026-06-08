import { User } from './user.model';

export interface Chat {
  _id: string;
  type: 'personal' | 'group';
  title?: string;
  avatar?: string;
  members: User[];
  admins?: string[];
  lastMessage?: string;
  updatedAt?: string;
  unreadCount?: number;
}
