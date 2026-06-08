import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatsModule } from './chats/chats.module';
import { MessagesModule } from './messages/messages.module';
import { ChatGateway } from './gateway/chat.gateway';
import configuration from './config/configuration';
import { configValidationSchema } from './config/config.schema';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validationSchema: configValidationSchema }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat-app', {
      autoCreate: true,
    }),
    ThrottlerModule.forRoot({ throttlers: [{ limit: 20, ttl: 60 }] }),
    AuthModule,
    UsersModule,
    ChatsModule,
    MessagesModule,
  ],
  controllers: [HealthController],
  providers: [ChatGateway],
})
export class AppModule {}
