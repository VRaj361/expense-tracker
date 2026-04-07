import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string) {
    return this.userModel.findById(id).select('-refreshToken');
  }

  async update(id: string, data: Partial<User>) {
    return this.userModel.findByIdAndUpdate(id, data, { new: true }).select('-refreshToken');
  }
}
