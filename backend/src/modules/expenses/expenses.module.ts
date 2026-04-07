import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema';
import { VendorMapping, VendorMappingSchema } from '../../schemas/vendor-mapping.schema';
import { AutomationRule, AutomationRuleSchema } from '../../schemas/automation-rule.schema';
import { Budget, BudgetSchema } from '../../schemas/budget.schema';
import { Notification, NotificationSchema } from '../../schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: VendorMapping.name, schema: VendorMappingSchema },
      { name: AutomationRule.name, schema: AutomationRuleSchema },
      { name: Budget.name, schema: BudgetSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
