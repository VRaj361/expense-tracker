import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UploadedFile, UseInterceptors, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user._id.toString(), dto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() query: QueryExpenseDto) {
    return this.expensesService.findAll(user._id.toString(), query);
  }

  @Get('stats/overview')
  getOverallBalance(@CurrentUser() user: any) {
    return this.expensesService.getOverallBalance(user._id.toString());
  }

  @Get('stats/monthly')
  getMonthlyStats(
    @CurrentUser() user: any,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    const now = new Date();
    return this.expensesService.getMonthlyStats(
      user._id.toString(),
      year || now.getFullYear(),
      month || now.getMonth() + 1,
    );
  }

  @Get('stats/categories')
  getCategoryBreakdown(
    @CurrentUser() user: any,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    const now = new Date();
    return this.expensesService.getCategoryBreakdown(
      user._id.toString(),
      year || now.getFullYear(),
      month || now.getMonth() + 1,
    );
  }

  @Get('stats/trends')
  getMonthlyTrends(@CurrentUser() user: any, @Query('months') months: number) {
    return this.expensesService.getMonthlyTrends(user._id.toString(), months || 6);
  }

  @Get('stats/weekly')
  getWeeklySpending(@CurrentUser() user: any) {
    return this.expensesService.getWeeklySpending(user._id.toString());
  }

  @Get('stats/prediction')
  getSpendingPrediction(@CurrentUser() user: any) {
    return this.expensesService.getSpendingPrediction(user._id.toString());
  }

  @Get('recent')
  getRecent(@CurrentUser() user: any, @Query('limit') limit: number) {
    return this.expensesService.getRecentTransactions(user._id.toString(), limit || 10);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.expensesService.findById(user._id.toString(), id);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: Partial<CreateExpenseDto>) {
    return this.expensesService.update(user._id.toString(), id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.expensesService.delete(user._id.toString(), id);
  }

  @Post('upload-receipt')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const safeExt = extname(file.originalname).toLowerCase().replace(/[^a-z.]/g, '');
        cb(null, uniqueSuffix + safeExt);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'), false);
      }
    },
  }))
  uploadReceipt(@UploadedFile() file: any) {
    if (!file) return { error: 'No file uploaded or invalid file type' };
    return { url: `/uploads/${file.filename}` };
  }

  @Post('train-vendor')
  trainVendor(
    @CurrentUser() user: any,
    @Body() body: { vendor: string; categoryId: string; categoryName: string },
  ) {
    return this.expensesService.trainVendorMapping(
      user._id.toString(),
      body.vendor,
      body.categoryId,
      body.categoryName,
    );
  }

  @Get('uploads/:filename')
  serveUpload(@Param('filename') filename: string, @Res() res: Response) {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = join(process.cwd(), 'uploads', safeName);
    if (!existsSync(filePath)) throw new NotFoundException('File not found');
    res.sendFile(filePath);
  }
}
