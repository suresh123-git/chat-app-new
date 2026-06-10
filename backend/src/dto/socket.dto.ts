import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessagePayloadDto {
  @IsString()
  @IsNotEmpty()
  chatId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsIn(['text', 'image', 'file'])
  @IsOptional()
  type?: 'text' | 'image' | 'file';

  @IsString()
  @IsOptional()
  replyTo?: string;
}

export class TypingPayloadDto {
  @IsString()
  @IsNotEmpty()
  chatId!: string;

  @IsBoolean()
  typing!: boolean;
}

export class ReadReceiptPayloadDto {
  @IsString()
  @IsNotEmpty()
  chatId!: string;
}

export class JoinChatPayloadDto {
  @IsString()
  @IsNotEmpty()
  chatId!: string;
}
