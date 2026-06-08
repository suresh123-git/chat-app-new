import { Controller, Get, Param, Post, Put, Delete, UseGuards, Query, UploadedFile, UseInterceptors, Req, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { EditMessageDto, DeleteMessageDto } from '../dto/message.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('chat/:chatId')
  async list(@Param('chatId') chatId: string, @Query('page') page = '1') {
    return this.messagesService.getMessages(chatId, Number(page));
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', 'uploads'),
        filename: (_req, file, callback) => {
          const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          callback(null, name);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: 'No file provided' };
    }
    return { url: `/uploads/${file.filename}`, filename: file.originalname, mimeType: file.mimetype };
  }

  @Put(':id')
  async edit(
    @Param('id') messageId: string,
    @Body() dto: EditMessageDto,
    @Req() req: any,
  ) {
    return this.messagesService.editMessage(messageId, req.user.userId, dto.content);
  }

  @Delete(':id')
  async delete(
    @Param('id') messageId: string,
    @Req() req: any,
  ) {
    return this.messagesService.deleteMessage(messageId, req.user.userId);
  }
}
