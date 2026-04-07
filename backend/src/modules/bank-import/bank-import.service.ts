import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BankProfile, BankProfileDocument } from '../../schemas/bank-profile.schema';
import { Expense, ExpenseDocument } from '../../schemas/expense.schema';
import { VendorMapping, VendorMappingDocument } from '../../schemas/vendor-mapping.schema';
import { StatementParserService, ParsedTransaction } from './statement-parser.service';
import { escapeRegex } from '../../common/utils/sanitize';

@Injectable()
export class BankImportService {
  constructor(
    @InjectModel(BankProfile.name) private bankProfileModel: Model<BankProfileDocument>,
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    @InjectModel(VendorMapping.name) private vendorMappingModel: Model<VendorMappingDocument>,
    private parser: StatementParserService,
  ) {}

  async getProfiles(userId: string) {
    return this.bankProfileModel.find({
      $or: [{ userId: new Types.ObjectId(userId) }, { isGlobal: true }],
    }).sort({ bankName: 1 });
  }

  async createProfile(userId: string, data: Partial<BankProfile>) {
    return this.bankProfileModel.create({
      ...data,
      userId: new Types.ObjectId(userId),
    });
  }

  async updateProfile(userId: string, id: string, data: Partial<BankProfile>) {
    return this.bankProfileModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      data,
      { new: true },
    );
  }

  async deleteProfile(userId: string, id: string) {
    return this.bankProfileModel.deleteOne({
      _id: id,
      userId: new Types.ObjectId(userId),
      isGlobal: false,
    });
  }

  async parseStatement(
    userId: string,
    profileId: string,
    file: { buffer: Buffer; originalname: string },
  ): Promise<ParsedTransaction[]> {
    const profile = await this.bankProfileModel.findOne({
      _id: profileId,
      $or: [{ userId: new Types.ObjectId(userId) }, { isGlobal: true }],
    });

    if (!profile) throw new NotFoundException('Bank profile not found');

    return this.parser.parseFile(file.buffer, file.originalname, profile);
  }

  async importTransactions(
    userId: string,
    profileId: string,
    file: { buffer: Buffer; originalname: string },
    options?: { skipDuplicates?: boolean },
  ) {
    const transactions = await this.parseStatement(userId, profileId, file);

    if (transactions.length === 0) {
      throw new BadRequestException('No valid transactions found in the file');
    }

    const userOid = new Types.ObjectId(userId);
    let imported = 0;
    let skipped = 0;

    for (const tx of transactions) {
      if (options?.skipDuplicates) {
        const existing = await this.expenseModel.findOne({
          userId: userOid,
          amount: tx.amount,
          date: tx.date,
          description: tx.description,
          type: tx.type,
        });
        if (existing) {
          skipped++;
          continue;
        }
      }

      let categoryName: string | undefined;
      const mapping = await this.vendorMappingModel.findOne({
        userId: userOid,
        vendorPattern: { $regex: new RegExp(escapeRegex(tx.description.split(/[\s\/\-]+/)[0]), 'i') },
      });
      if (mapping) {
        categoryName = mapping.categoryName;
      }

      await this.expenseModel.create({
        userId: userOid,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        description: tx.description,
        categoryName,
        paymentMethod: 'bank_transfer',
        tags: ['bank-import'],
      });

      imported++;
    }

    return {
      total: transactions.length,
      imported,
      skipped,
    };
  }
}
