import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true, enum: ['personal', 'group'], default: 'personal' })
  type!: 'personal' | 'group';

  @Prop({ required: true, type: [String], ref: 'User' })
  members!: string[];

  @Prop({ type: [String], ref: 'User', default: [] })
  admins!: string[];

  @Prop({ default: null })
  title?: string;

  @Prop({ default: null })
  avatar?: string;

  @Prop({ default: '' })
  lastMessage?: string;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
ChatSchema.index({ members: 1 });
ChatSchema.index({ type: 1 });
