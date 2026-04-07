import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';
import { RecurringService } from './recurring.service';

@Controller('recurring')
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.recurringService.findAll(user._id.toString());
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.recurringService.create(user._id.toString(), body);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.recurringService.update(user._id.toString(), id, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.recurringService.delete(user._id.toString(), id);
  }

  @Public()
  @UseGuards(AdminKeyGuard)
  @Post('process-now')
  async processNow() {
    await this.recurringService.processRecurring();
    return { message: 'Recurring expenses processed' };
  }
}
