import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { RecurringModule } from './modules/recurring/recurring.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { LoansModule } from './modules/loans/loans.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ExportsModule } from './modules/exports/exports.module';
import { AutomationModule } from './modules/automation/automation.module';
import { BankImportModule } from './modules/bank-import/bank-import.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const configuredUri = config.get('MONGODB_URI');
        const isProd = process.env.NODE_ENV === 'production';

        if (configuredUri && configuredUri !== 'memory') {
          return { uri: configuredUri };
        }

        // Render (and similar) will time out on port binding if we try to download/start
        // mongodb-memory-server here — it can take minutes or fail in a read-only/slim image.
        if (isProd) {
          throw new Error(
            'Set MONGODB_URI to your MongoDB Atlas connection string in production (Render dashboard → Environment). Do not use "memory".',
          );
        }

        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        console.log(`Using in-memory MongoDB at ${uri}`);
        return { uri };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    ExpensesModule,
    CategoriesModule,
    BudgetsModule,
    RecurringModule,
    RemindersModule,
    LoansModule,
    InvestmentsModule,
    NotificationsModule,
    ExportsModule,
    AutomationModule,
    BankImportModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
