import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }])],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService],
})
export class ExportsModule {}
