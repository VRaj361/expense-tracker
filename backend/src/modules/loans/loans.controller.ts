import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AdminKeyGuard } from '../../common/guards/admin-key.guard';
import { LoansService } from './loans.service';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.loansService.findAll(user._id.toString());
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.loansService.create(user._id.toString(), body);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.loansService.update(user._id.toString(), id, body);
  }

  @Patch(':id/pay')
  recordPayment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.loansService.recordEmiPayment(user._id.toString(), id);
  }

  @Patch(':id/extra-pay')
  extraPayment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { amount: number; note?: string },
  ) {
    return this.loansService.recordExtraPayment(user._id.toString(), id, body.amount, body.note);
  }

  @Get(':id/schedule')
  getSchedule(@CurrentUser() user: any, @Param('id') id: string) {
    return this.loansService.getEmiSchedule(user._id.toString(), id);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.loansService.delete(user._id.toString(), id);
  }

  @Public()
  @UseGuards(AdminKeyGuard)
  @Post('process-auto-emi')
  async processAutoEmi() {
    await this.loansService.processAutoDeductions();
    return { message: 'Auto EMI deductions processed' };
  }
}
