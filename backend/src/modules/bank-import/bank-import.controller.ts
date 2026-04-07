import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BankImportService } from './bank-import.service';

@Controller('bank-import')
export class BankImportController {
  constructor(private readonly bankImportService: BankImportService) {}

  @Get('profiles')
  getProfiles(@CurrentUser() user: any) {
    return this.bankImportService.getProfiles(user._id.toString());
  }

  @Post('profiles')
  createProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.bankImportService.createProfile(user._id.toString(), body);
  }

  @Put('profiles/:id')
  updateProfile(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.bankImportService.updateProfile(user._id.toString(), id, body);
  }

  @Delete('profiles/:id')
  deleteProfile(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bankImportService.deleteProfile(user._id.toString(), id);
  }

  @Post('preview')
  @UseInterceptors(FileInterceptor('file', {
    storage: undefined,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req: any, file: any, cb: any) => {
      const allowed = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
      if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls|txt)$/i)) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV and Excel files are allowed'), false);
      }
    },
  }))
  async previewStatement(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('profileId') profileId: string,
  ) {
    const transactions = await this.bankImportService.parseStatement(
      user._id.toString(),
      profileId,
      { buffer: file.buffer, originalname: file.originalname },
    );
    return { transactions, count: transactions.length };
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', {
    storage: undefined,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req: any, file: any, cb: any) => {
      const allowed = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
      if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls|txt)$/i)) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV and Excel files are allowed'), false);
      }
    },
  }))
  async importStatement(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('profileId') profileId: string,
    @Body('skipDuplicates') skipDuplicates: string,
  ) {
    return this.bankImportService.importTransactions(
      user._id.toString(),
      profileId,
      { buffer: file.buffer, originalname: file.originalname },
      { skipDuplicates: skipDuplicates === 'true' },
    );
  }
}
