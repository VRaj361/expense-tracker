import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AutomationService } from './automation.service';

@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('rules')
  getRules(@CurrentUser() user: any) {
    return this.automationService.getRules(user._id.toString());
  }

  @Post('rules')
  createRule(@CurrentUser() user: any, @Body() body: any) {
    return this.automationService.createRule(user._id.toString(), body);
  }

  @Put('rules/:id')
  updateRule(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.automationService.updateRule(user._id.toString(), id, body);
  }

  @Delete('rules/:id')
  deleteRule(@CurrentUser() user: any, @Param('id') id: string) {
    return this.automationService.deleteRule(user._id.toString(), id);
  }

  @Get('mappings')
  getMappings(@CurrentUser() user: any) {
    return this.automationService.getMappings(user._id.toString());
  }

  @Delete('mappings/:id')
  deleteMapping(@CurrentUser() user: any, @Param('id') id: string) {
    return this.automationService.deleteMappings(user._id.toString(), id);
  }
}
