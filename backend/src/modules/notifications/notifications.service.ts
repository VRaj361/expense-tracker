import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../../schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>) {}

  async findAll(userId: string, unreadOnly = false) {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (unreadOnly) filter.isRead = false;
    return this.notificationModel.find(filter).sort({ createdAt: -1 }).limit(50);
  }

  async getUnreadCount(userId: string) {
    return this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId), isRead: false });
  }

  async markRead(userId: string, id: string) {
    return this.notificationModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { isRead: true },
      { new: true },
    );
  }

  async markAllRead(userId: string) {
    return this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true },
    );
  }

  async create(userId: string, data: { title: string; message: string; type: string; metadata?: any }) {
    return this.notificationModel.create({ ...data, userId: new Types.ObjectId(userId) });
  }

  async delete(userId: string, id: string) {
    return this.notificationModel.deleteOne({ _id: id, userId: new Types.ObjectId(userId) });
  }
}
