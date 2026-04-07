import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecurringController } from './recurring.controller';
import { RecurringService } from './recurring.service';
import { RecurringExpense, RecurringExpenseSchema } from '../../schemas/recurring-expense.schema';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecurringExpense.name, schema: RecurringExpenseSchema },
      { name: Expense.name, schema: ExpenseSchema },
    ]),
  ],
  controllers: [RecurringController],
  providers: [RecurringService],
  exports: [RecurringService],
})
export class RecurringModule {}
