import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Investment, InvestmentDocument } from '../../schemas/investment.schema';

@Injectable()
export class InvestmentsService {
  constructor(@InjectModel(Investment.name) private investmentModel: Model<InvestmentDocument>) {}

  async findAll(userId: string) {
    return this.investmentModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  async getSummary(userId: string) {
    const investments = await this.findAll(userId);
    const totalInvested = investments.reduce((sum, i) => sum + i.investedAmount, 0);
    const currentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
    return {
      totalInvested,
      currentValue,
      profitLoss: currentValue - totalInvested,
      profitLossPercentage: totalInvested ? ((currentValue - totalInvested) / totalInvested * 100).toFixed(2) : 0,
      byType: investments.reduce((acc, inv) => {
        if (!acc[inv.type]) acc[inv.type] = { invested: 0, current: 0 };
        acc[inv.type].invested += inv.investedAmount;
        acc[inv.type].current += inv.currentValue;
        return acc;
      }, {} as Record<string, { invested: number; current: number }>),
    };
  }

  async create(userId: string, data: Partial<Investment>) {
    return this.investmentModel.create({ ...data, userId: new Types.ObjectId(userId) });
  }

  async update(userId: string, id: string, data: Partial<Investment>) {
    return this.investmentModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      data,
      { new: true },
    );
  }

  async delete(userId: string, id: string) {
    return this.investmentModel.deleteOne({ _id: id, userId: new Types.ObjectId(userId) });
  }
}
