import { Controller, Get, Patch, Delete, Param, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query('unread') unread: string) {
    return this.notificationsService.findAll(user._id.toString(), unread === 'true');
  }

  @Get('count')
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user._id.toString());
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markRead(user._id.toString(), id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user._id.toString());
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.delete(user._id.toString(), id);
  }
}
