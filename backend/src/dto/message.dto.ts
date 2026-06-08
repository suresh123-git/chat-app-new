import { IsIn, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @IsIn(['text', 'image', 'file'])
  @IsOptional()
  type?: 'text' | 'image' | 'file';

  @IsString()
  @IsOptional()
  replyTo?: string;
}

export class EditMessageDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}

export class DeleteMessageDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  messageId: string;
}
