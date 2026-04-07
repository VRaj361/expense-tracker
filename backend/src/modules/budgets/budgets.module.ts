import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { Budget, BudgetSchema } from '../../schemas/budget.schema';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Budget.name, schema: BudgetSchema },
    { name: Expense.name, schema: ExpenseSchema },
  ])],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
