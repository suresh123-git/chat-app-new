import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { Chat, ChatDocument } from '../schemas/chat.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async createMessage(payload: Partial<Message>) {
    const chatId = typeof payload.chat === 'string' ? new Types.ObjectId(payload.chat) : payload.chat;
    const senderId = typeof payload.sender === 'string' ? new Types.ObjectId(payload.sender) : payload.sender;

    if (!chatId || !senderId) {
      throw new BadRequestException('Chat or sender missing');
    }

    const message = new this.messageModel({
      ...payload,
      chat: chatId,
      sender: senderId,
      status: 'sent',
    });
    const saved = await message.save();
    await this.chatModel.findByIdAndUpdate(chatId, {
      lastMessage: payload.content,
      updatedAt: new Date(),
    });
    const hydrated = await this.messageModel
      .findById(saved._id)
      .populate('sender', 'name email avatar')
      .lean();

    if (!hydrated) {
      throw new NotFoundException('Message not found after creation');
    }

    return hydrated;
  }

  async getMessages(chatId: string, page = 1, pageSize = 30) {
    const query = { chat: new Types.ObjectId(chatId) };
    return this.messageModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('sender', 'name email avatar')
      .lean();
  }

  async markDelivered(messageId: string) {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new BadRequestException('Invalid message ID');
    }

    const updated = await this.messageModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(messageId), status: 'sent' },
        { status: 'delivered' },
        { new: true },
      )
      .populate('sender', 'name email avatar')
      .lean();

    if (!updated) {
      throw new NotFoundException('Message not found or already delivered');
    }
    return updated;
  }

  async markRead(chatId: string, userId: string) {
    if (!Types.ObjectId.isValid(chatId)) {
      throw new BadRequestException('Invalid chat ID');
    }

    const chat = await this.chatModel.findById(new Types.ObjectId(chatId));
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const result = await this.messageModel.updateMany(
      { chat: new Types.ObjectId(chatId), readBy: { $ne: new Types.ObjectId(userId) } },
      { $push: { readBy: new Types.ObjectId(userId) }, status: 'read' },
    );

    return { modifiedCount: result.modifiedCount };
  }

  async editMessage(messageId: string, userId: string, content: string) {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new BadRequestException('Invalid message ID');
    }

    const message = await this.messageModel.findById(new Types.ObjectId(messageId));
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const msgAny = message as any;
    const senderId = msgAny.sender?.toString?.() ?? msgAny.sender;
    if (senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    const updated = await this.messageModel
      .findByIdAndUpdate(
        new Types.ObjectId(messageId),
        { content, isEdited: true, editedAt: new Date() },
        { new: true },
      )
      .populate('sender', 'name email avatar')
      .lean();

    if (!updated) {
      throw new NotFoundException('Message not found after update');
    }
    return updated;
  }

  async deleteMessage(messageId: string, userId: string) {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new BadRequestException('Invalid message ID');
    }

    const message = await this.messageModel.findById(new Types.ObjectId(messageId));
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const msgAny = message as any;
    const senderId = msgAny.sender?.toString?.() ?? msgAny.sender;
    if (senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageModel.findByIdAndDelete(new Types.ObjectId(messageId));
    return { deleted: true, messageId };
  }
}
