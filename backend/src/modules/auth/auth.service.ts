import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateGoogleUser(profile: any): Promise<UserDocument> {
    const { id, emails, displayName, photos } = profile;
    let user = await this.userModel.findOne({ googleId: id });
    if (!user) {
      user = await this.userModel.create({
        googleId: id,
        email: emails[0].value,
        name: displayName,
        avatar: photos?.[0]?.value || '',
      });
    }
    return user;
  }

  async generateTokens(user: UserDocument) {
    const payload = { sub: user._id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });
    await this.userModel.findByIdAndUpdate(user._id, { refreshToken });
    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userModel.findById(payload.sub);
      if (!user || user.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }
      return this.generateTokens(user);
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  async getUserById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }
}
