import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category, CategorySchema } from '../../schemas/category.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { AppMigration, AppMigrationSchema } from '../../schemas/app-migration.schema';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema';
import { Budget, BudgetSchema } from '../../schemas/budget.schema';
import { RecurringExpense, RecurringExpenseSchema } from '../../schemas/recurring-expense.schema';
import { VendorMapping, VendorMappingSchema } from '../../schemas/vendor-mapping.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: User.name, schema: UserSchema },
      { name: AppMigration.name, schema: AppMigrationSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: Budget.name, schema: BudgetSchema },
      { name: RecurringExpense.name, schema: RecurringExpenseSchema },
      { name: VendorMapping.name, schema: VendorMappingSchema },
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
