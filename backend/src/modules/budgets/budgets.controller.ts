import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BudgetsService } from './budgets.service';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query('active') active: string) {
    return this.budgetsService.findAll(user._id.toString(), active === 'true');
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.budgetsService.create(user._id.toString(), body);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.budgetsService.update(user._id.toString(), id, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.budgetsService.delete(user._id.toString(), id);
  }
}
