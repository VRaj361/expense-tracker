import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BankImportController } from './bank-import.controller';
import { BankImportService } from './bank-import.service';
import { StatementParserService } from './statement-parser.service';
import { BankProfile, BankProfileSchema } from '../../schemas/bank-profile.schema';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema';
import { VendorMapping, VendorMappingSchema } from '../../schemas/vendor-mapping.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BankProfile.name, schema: BankProfileSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: VendorMapping.name, schema: VendorMappingSchema },
    ]),
  ],
  controllers: [BankImportController],
  providers: [BankImportService, StatementParserService],
  exports: [BankImportService],
})
export class BankImportModule {}
