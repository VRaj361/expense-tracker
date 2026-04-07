import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InvestmentsService } from './investments.service';

@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.investmentsService.findAll(user._id.toString());
  }

  @Get('summary')
  getSummary(@CurrentUser() user: any) {
    return this.investmentsService.getSummary(user._id.toString());
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.investmentsService.create(user._id.toString(), body);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.investmentsService.update(user._id.toString(), id, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.investmentsService.delete(user._id.toString(), id);
  }
}
