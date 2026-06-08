import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatShellComponent } from './chat-shell.component';
import { SidebarComponent } from '../components/sidebar.component';
import { ChatListComponent } from '../components/chat-list.component';
import { ChatWindowComponent } from '../components/chat-window.component';
import { InfoPanelComponent } from '../components/info-panel.component';
import { MessageBubbleComponent } from '../components/message-bubble.component';
import { InputBoxComponent } from '../components/input-box.component';
import { NewChatPanelComponent } from '../components/new-chat-panel.component';
import { AvailableUsersComponent } from '../components/available-users.component';
import { GroupChatModalComponent } from '../components/group-chat-modal.component';
import { GroupMembersComponent, ClickOutsideDirective } from '../components/group-members.component';
import { AuthGuard } from '../guards/auth.guard';

@NgModule({
  declarations: [
    ChatShellComponent,
    SidebarComponent,
    ChatListComponent,
    ChatWindowComponent,
    InfoPanelComponent,
    MessageBubbleComponent,
    InputBoxComponent,
    NewChatPanelComponent,
    AvailableUsersComponent,
    GroupChatModalComponent,
    GroupMembersComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClickOutsideDirective,
    RouterModule.forChild([
      { path: '', component: ChatShellComponent, canActivate: [AuthGuard] },
    ]),
  ],
})
export class ChatModule {}
