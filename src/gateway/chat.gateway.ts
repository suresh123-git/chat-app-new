import { OnModuleInit, Logger, ValidationPipe, UsePipes } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from '../chats/chats.service';
import { MessagesService } from '../messages/messages.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { SendMessagePayloadDto, TypingPayloadDto, ReadReceiptPayloadDto, JoinChatPayloadDto } from '../dto/socket.dto';

@WebSocketGateway({
  namespace: 'ws',
  cors: { origin: '*', methods: ['GET', 'POST'] },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  private redisAdapterReady = false;

  constructor(
    private jwtService: JwtService,
    private chatsService: ChatsService,
    private messagesService: MessagesService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const redisUrl = this.configService.get('REDIS_URL');
    if (redisUrl) {
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      this.server.adapter(createAdapter(pubClient, subClient));
      this.redisAdapterReady = true;
      this.logger.log('Socket adapter configured with Redis');
    }
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    try {
      const payload = await this.jwtService.verifyAsync(token as string, {
        secret: process.env.JWT_SECRET || 'supersecret',
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        client.disconnect(true);
        return;
      }
      client.data.userId = payload.sub;
      client.join(`user_${payload.sub}`);
      const chats = await this.chatsService.findUserChats(payload.sub as string);
      chats.forEach((chat) => client.join(`chat_${chat._id}`));
      await this.usersService.updateStatus(payload.sub, 'online');
      this.server.emit('presence_update', { userId: payload.sub, status: 'online' });
      this.logger.log(`User connected ${user.email}`);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      await this.usersService.updateStatus(userId, 'offline');
      this.server.emit('presence_update', { userId, status: 'offline', lastSeen: new Date() });
      this.logger.log(`User disconnected ${userId}`);
    }
  }

  @SubscribeMessage('send_message')
  @UsePipes(new ValidationPipe())
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: SendMessagePayloadDto) {
    const userId = client.data.userId;
    if (!userId) return;
    const createdMessage = await this.messagesService.createMessage({
      chat: payload.chatId as any,
      sender: userId,
      content: payload.content,
      type: (payload.type as 'text' | 'image' | 'file') || 'text',
      status: 'sent',
    });
    const chat = await this.chatsService.findById(payload.chatId);
    const memberIds = (chat?.members || []).map((member: any) =>
      typeof member === 'string' ? member : member?._id?.toString?.() || member?.toString?.(),
    );
    const recipientIds = memberIds.filter((memberId) => memberId && memberId !== userId);

    let message = createdMessage;
    if (recipientIds.length > 0) {
      const recipientSockets = await Promise.all(
        recipientIds.map((memberId) => this.server.in(`user_${memberId}`).fetchSockets()),
      );
      const hasOnlineRecipient = recipientSockets.some((sockets) => sockets.length > 0);

      if (hasOnlineRecipient) {
        const deliveredMessage = await this.messagesService.markDelivered(String(createdMessage._id));
        if (deliveredMessage) {
          message = deliveredMessage;
        }
      }
    }

    memberIds.forEach((memberId) => {
      if (!memberId) return;
      this.server.to(`user_${memberId}`).emit('receive_message', message);
      this.server.to(`user_${memberId}`).emit('chat_update', {
        chatId: payload.chatId,
        lastMessage: payload.content,
        updatedAt: new Date(),
      });
    });

    return { success: true, message };
  }

  @SubscribeMessage('typing')
  @UsePipes(new ValidationPipe())
  async handleTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: TypingPayloadDto) {
    const userId = client.data.userId;
    if (!userId) return;
    client.to(`chat_${payload.chatId}`).emit('typing', { chatId: payload.chatId, userId, typing: payload.typing });
  }

  @SubscribeMessage('read_receipt')
  @UsePipes(new ValidationPipe())
  async handleReadReceipt(@ConnectedSocket() client: Socket, @MessageBody() payload: ReadReceiptPayloadDto) {
    const userId = client.data.userId;
    if (!userId) return;
    await this.messagesService.markRead(payload.chatId, userId);
    this.server.to(`chat_${payload.chatId}`).emit('read_receipt', { chatId: payload.chatId, userId });
  }

  @SubscribeMessage('join_chat')
  @UsePipes(new ValidationPipe())
  async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinChatPayloadDto) {
    const userId = client.data.userId;
    if (!userId || !payload?.chatId) return;
    client.join(`chat_${payload.chatId}`);
    this.logger.log(`User ${userId} joined room chat_${payload.chatId}`);
  }
}
