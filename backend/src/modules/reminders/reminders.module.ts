import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { Reminder, ReminderSchema } from '../../schemas/reminder.schema';
import { Notification, NotificationSchema } from '../../schemas/notification.schema';
import { User, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Reminder.name, schema: ReminderSchema },
    { name: Notification.name, schema: NotificationSchema },
    { name: User.name, schema: UserSchema },
  ])],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
