import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema()
export class Reaction {
  @Prop({ required: true })
  emoji!: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  users!: Types.ObjectId[];
}

export const ReactionSchema = SchemaFactory.createForClass(Reaction);

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Chat' })
  chat!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  sender!: Types.ObjectId;

  @Prop({ default: '' })
  content!: string;

  @Prop({ required: true, enum: ['text', 'image', 'file', 'system'], default: 'text' })
  type!: 'text' | 'image' | 'file' | 'system';

  @Prop({ default: 'sent', enum: ['sent', 'delivered', 'read'] })
  status!: 'sent' | 'delivered' | 'read';

  @Prop({ default: false })
  isEdited!: boolean;

  @Prop()
  editedAt?: Date;

  @Prop({ type: [ReactionSchema], default: [] })
  reactions!: Reaction[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  readBy!: Types.ObjectId[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ chat: 1, createdAt: -1 });
