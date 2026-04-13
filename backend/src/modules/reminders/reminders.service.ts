import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Reminder, ReminderDocument } from '../../schemas/reminder.schema';
import { Notification, NotificationDocument } from '../../schemas/notification.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { sanitizeHtml } from '../../common/utils/sanitize';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);
  constructor(
    @InjectModel(Reminder.name) private reminderModel: Model<ReminderDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(userId: string) {
    return this.reminderModel.find({ userId: new Types.ObjectId(userId) }).sort({ dueDate: 1 });
  }

  async create(userId: string, data: Partial<Reminder>) {
    return this.reminderModel.create({ ...data, userId: new Types.ObjectId(userId) });
  }

  async update(userId: string, id: string, data: Partial<Reminder>) {
    return this.reminderModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      data,
      { new: true },
    );
  }

  async markPaid(userId: string, id: string) {
    return this.reminderModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { isPaid: true },
      { new: true },
    );
  }

  async delete(userId: string, id: string) {
    return this.reminderModel.deleteOne({ _id: id, userId: new Types.ObjectId(userId) });
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async processReminders() {
    this.logger.log('Processing reminders...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueReminders = await this.reminderModel.find({
      isActive: true,
      isPaid: false,
      dueDate: { $gte: today, $lte: tomorrow },
    });

    for (const reminder of dueReminders) {
      const user = await this.userModel.findById(reminder.userId);
      if (!user) continue;

      if (reminder.notifyVia.includes('inApp')) {
        await this.notificationModel.create({
          userId: reminder.userId,
          title: 'Bill Reminder',
          message: `Reminder: ${reminder.title} of ₹${reminder.amount} is due ${reminder.dueDate.toDateString() === new Date().toDateString() ? 'today' : 'tomorrow'}.`,
          type: 'bill_reminder',
        });
      }

      if (reminder.notifyVia.includes('email') && user.email) {
        await this.sendEmailReminder(user.email, reminder);
      }
    }
    this.logger.log(`Processed ${dueReminders.length} reminders`);
  }

  private async sendEmailReminder(email: string, reminder: ReminderDocument) {
    try {
      // const transporter = nodemailer.createTransport({
      //   host: process.env.SMTP_HOST || 'smtp.gmail.com',
      //   port: Number(process.env.SMTP_PORT) || 587,
      //   auth: {
      //     user: process.env.SMTP_USER,
      //     pass: process.env.SMTP_PASS,
      //   },
      // });

      // await transporter.sendMail({
      //   from: process.env.SMTP_FROM || 'ExpenseTracker <noreply@expensetracker.com>',
      //   to: email,
      //   subject: `Reminder: ${sanitizeHtml(reminder.title)}`,
      //   html: `<div style="font-family:sans-serif;padding:20px"><h2>Bill Reminder</h2><p><strong>${sanitizeHtml(reminder.title)}</strong> of <strong>Rs. ${reminder.amount}</strong> is due on <strong>${reminder.dueDate.toLocaleDateString()}</strong>.</p><p>${sanitizeHtml(reminder.description || '')}</p></div>`,
      // });

      const { data, error } = await this.resend.emails.send({
        from: 'FinTrack <noreply@fintrack.app>',
        to: [email],
        subject: `Reminder: ${sanitizeHtml(reminder.title)}`,
        html: `<div style="font-family:sans-serif;padding:20px"><h2>Bill Reminder</h2><p><strong>${sanitizeHtml(reminder.title)}</strong> of <strong>Rs. ${reminder.amount}</strong> is due on <strong>${reminder.dueDate.toLocaleDateString()}</strong>.</p><p>${sanitizeHtml(reminder.description || '')}</p></div>`,
      });
      if (error) {
        this.logger.error(`Reminder email failed: ${error}`);
      }
    } catch (error) {
      this.logger.error('Email send failed:', error.message);
    }
  }
}
