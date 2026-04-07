import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.remindersService.findAll(user._id.toString());
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.remindersService.create(user._id.toString(), body);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.remindersService.update(user._id.toString(), id, body);
  }

  @Patch(':id/paid')
  markPaid(@CurrentUser() user: any, @Param('id') id: string) {
    return this.remindersService.markPaid(user._id.toString(), id);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.remindersService.delete(user._id.toString(), id);
  }

  @Public()
  @UseGuards(AdminKeyGuard)
  @Post('process-now')
  async processNow() {
    await this.remindersService.processReminders();
    return { message: 'Reminders processed' };
  }
}
