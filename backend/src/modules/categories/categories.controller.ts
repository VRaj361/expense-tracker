import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.categoriesService.findByUser(user._id.toString());
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: { name: string; icon?: string; color?: string; type?: string }) {
    return this.categoriesService.create(user._id.toString(), body);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: Partial<{ name: string; icon: string; color: string; type: string }>) {
    return this.categoriesService.update(user._id.toString(), id, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.categoriesService.delete(user._id.toString(), id);
  }
}
