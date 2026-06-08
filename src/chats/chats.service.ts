import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from '../schemas/chat.schema';
import { Message, MessageDocument } from '../schemas/message.schema';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async findUserChats(userId: string, search?: string, type?: string) {
    const query: any = { members: userId };
    if (type) {
      query.type = type;
    }
    const chats = await this.chatModel
      .find(query)
      .populate('members', 'name email avatar status')
      .sort({ updatedAt: -1 })
      .lean();

    const term = search?.trim();
    if (!term) {
      return chats;
    }

    const pattern = new RegExp(term, 'i');
    const filtered = chats.filter((chat: any) => {
      if (chat.type === 'group') {
        return chat.title && pattern.test(chat.title);
      } else {
        return (chat.members || []).some((member: any) => {
          const memberId = member?._id?.toString?.() || member?.toString?.();
          if (memberId === userId) {
            return false;
          }
          return pattern.test(member?.name || '') || pattern.test(member?.email || '');
        });
      }
    });

    return filtered;
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.chatModel
      .findById(id)
      .populate('members', 'name email avatar status')
      .lean();
  }

  async createChat(data: Partial<Chat>) {
    if (data.type === 'personal' && Array.isArray(data.members) && data.members.length === 2) {
      const existing = await this.chatModel
        .findOne({ type: 'personal', members: { $all: data.members, $size: 2 } })
        .populate('members', 'name email avatar status')
        .lean();
      if (existing) {
        return existing;
      }
    }

    const created = new this.chatModel(data);
    await created.save();
    return this.chatModel
      .findById(created._id)
      .populate('members', 'name email avatar status')
      .lean();
  }

  async updateChat(chatId: string, data: Partial<Chat>) {
    const existing = await this.chatModel.findById(chatId);
    if (!existing) throw new NotFoundException('Chat not found');
    return this.chatModel.findByIdAndUpdate(chatId, data, { new: true }).lean();
  }

  async addMembers(chatId: string, memberIds: string[]) {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.type !== 'group') throw new BadRequestException('Cannot add members to personal chat');
    
    chat.members = Array.from(new Set([...chat.members, ...memberIds]));
    return chat.save();
  }

  async removeMember(chatId: string, memberId: string, requesterId: string) {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.type !== 'group') throw new BadRequestException('Cannot remove members from personal chat');
    
    // Check if requester is admin
    const isAdmin = chat.admins.some(admin => admin === requesterId);
    const isRemovingSelf = memberId === requesterId;
    
    if (!isAdmin && !isRemovingSelf) {
      throw new ForbiddenException('Only admins can remove members');
    }
    
    // Don't allow removing if only admin
    if (isAdmin && isRemovingSelf && chat.admins.length === 1) {
      throw new BadRequestException('Cannot remove the only admin from group');
    }
    
    chat.members = chat.members.filter(member => member !== memberId);
    chat.admins = chat.admins.filter(admin => admin !== memberId);
    
    return chat.save();
  }

  async leaveChat(chatId: string, userId: string) {
    return this.removeMember(chatId, userId, userId);
  }

  async promoteToAdmin(chatId: string, memberId: string, requesterId: string) {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.type !== 'group') throw new BadRequestException('Cannot promote members in personal chat');
    
    // Check if requester is admin
    const isAdmin = chat.admins.some(admin => admin === requesterId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can promote members');
    }
    
    // Check if member exists
    const memberExists = chat.members.some(member => member === memberId);
    if (!memberExists) {
      throw new BadRequestException('Member not found in chat');
    }
    
    // Add to admins if not already
    if (!chat.admins.some(admin => admin === memberId)) {
      chat.admins.push(memberId);
    }
    
    return chat.save();
  }

  async demoteFromAdmin(chatId: string, memberId: string, requesterId: string) {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.type !== 'group') throw new BadRequestException('Cannot demote members in personal chat');
    
    // Check if requester is admin
    const isAdmin = chat.admins.some(admin => admin === requesterId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can demote members');
    }
    
    // Don't allow removing the only admin
    if (chat.admins.length === 1 && chat.admins[0] === memberId) {
      throw new BadRequestException('Cannot demote the last admin');
    }
    
    chat.admins = chat.admins.filter(admin => admin !== memberId);
    
    return chat.save();
  }

  async deleteChat(chatId: string, requesterId: string) {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    
    if (chat.type === 'group') {
      // Only admins can delete group chats
      const isAdmin = chat.admins.some(admin => admin === requesterId);
      if (!isAdmin) {
        throw new ForbiddenException('Only admins can delete group chat');
      }
    }
    
    // Delete all messages in chat
    await this.messageModel.deleteMany({ chat: new Types.ObjectId(chatId) });
    
    // Delete chat
    await this.chatModel.findByIdAndDelete(chatId);
    
    return { success: true, message: 'Chat deleted successfully' };
  }

  async getLatestMessage(chatId: string) {
    return this.messageModel.findOne({ chat: new Types.ObjectId(chatId) }).sort({ createdAt: -1 }).lean();
  }
}
