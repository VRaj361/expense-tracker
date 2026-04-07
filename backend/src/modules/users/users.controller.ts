import { Controller, Get, Put, Body } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(user._id.toString());
  }

  @Put('profile')
  updateProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.usersService.update(user._id.toString(), body);
  }
}
