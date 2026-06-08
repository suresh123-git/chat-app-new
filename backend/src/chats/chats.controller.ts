import { Body, Controller, Get, NotFoundException, Post, Query, Req, UseGuards, Param, Put, Delete } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateChatDto, UpdateChatDto, AddMembersDto, RemoveMemberDto, PromoteAdminDto, DemoteAdminDto } from '../dto/chat.dto';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Get()
  async list(@Req() req, @Query('search') search?: string, @Query('type') type?: string) {
    return this.chatsService.findUserChats(req.user.userId, search, type);
  }

  @Post()
  async create(@Req() req, @Body() dto: CreateChatDto) {
    const chat = await this.chatsService.createChat({
      ...dto,
      members: [req.user.userId, ...dto.members],
      admins: dto.type === 'group' ? [req.user.userId] : [req.user.userId],
      title: dto.type === 'group' ? dto.title || 'New group' : undefined,
    });
    return chat;
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const chat = await this.chatsService.findById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return chat;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateChatDto) {
    const chat = await this.chatsService.findById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return this.chatsService.updateChat(id, dto);
  }

  @Post(':id/members')
  async addMembers(@Param('id') id: string, @Body() dto: AddMembersDto) {
    return this.chatsService.addMembers(id, dto.members);
  }

  @Delete(':id/members/:memberId')
  async removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @Req() req) {
    return this.chatsService.removeMember(id, memberId, req.user.userId);
  }

  @Post(':id/leave')
  async leaveChat(@Param('id') id: string, @Req() req) {
    return this.chatsService.leaveChat(id, req.user.userId);
  }

  @Post(':id/members/:memberId/promote')
  async promoteToAdmin(@Param('id') id: string, @Param('memberId') memberId: string, @Req() req) {
    return this.chatsService.promoteToAdmin(id, memberId, req.user.userId);
  }

  @Post(':id/members/:memberId/demote')
  async demoteFromAdmin(@Param('id') id: string, @Param('memberId') memberId: string, @Req() req) {
    return this.chatsService.demoteFromAdmin(id, memberId, req.user.userId);
  }

  @Delete(':id')
  async deleteChat(@Param('id') id: string, @Req() req) {
    return this.chatsService.deleteChat(id, req.user.userId);
  }
}
