import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExportsService } from './exports.service';

@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  private buildFilters(query: any) {
    return {
      startDate: query.startDate,
      endDate: query.endDate,
      type: query.type,
      categoryName: query.categoryName,
      paymentMethod: query.paymentMethod,
      search: query.search,
    };
  }

  @Get('csv')
  async exportCSV(
    @CurrentUser() user: any,
    @Query() query: any,
    @Res() res: Response,
  ) {
    const csv = await this.exportsService.exportCSV(user._id.toString(), this.buildFilters(query));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csv);
  }

  @Get('excel')
  async exportExcel(
    @CurrentUser() user: any,
    @Query() query: any,
    @Res() res: Response,
  ) {
    const buffer = await this.exportsService.exportExcel(user._id.toString(), this.buildFilters(query));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.xlsx');
    res.send(buffer);
  }

  @Get('pdf')
  async exportPDF(
    @CurrentUser() user: any,
    @Query() query: any,
    @Res() res: Response,
  ) {
    const buffer = await this.exportsService.exportPDF(user._id.toString(), this.buildFilters(query));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.pdf');
    res.send(buffer);
  }
}
