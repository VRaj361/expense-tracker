import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedWalletsController } from './shared-wallets.controller';
import { SharedWalletsService } from './shared-wallets.service';
import { SharedWallet, SharedWalletSchema } from '../../schemas/shared-wallet.schema';
import { SharedWalletMember, SharedWalletMemberSchema } from '../../schemas/shared-wallet-member.schema';
import { SharedWalletEntry, SharedWalletEntrySchema } from '../../schemas/shared-wallet-entry.schema';
import {
  SharedWalletSettlement,
  SharedWalletSettlementSchema,
} from '../../schemas/shared-wallet-settlement.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SharedWallet.name, schema: SharedWalletSchema },
      { name: SharedWalletMember.name, schema: SharedWalletMemberSchema },
      { name: SharedWalletEntry.name, schema: SharedWalletEntrySchema },
      { name: SharedWalletSettlement.name, schema: SharedWalletSettlementSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [SharedWalletsController],
  providers: [SharedWalletsService],
})
export class SharedWalletsModule {}
