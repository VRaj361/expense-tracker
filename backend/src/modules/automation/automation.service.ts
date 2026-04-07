import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AutomationRule, AutomationRuleDocument } from '../../schemas/automation-rule.schema';
import { VendorMapping, VendorMappingDocument } from '../../schemas/vendor-mapping.schema';

@Injectable()
export class AutomationService {
  constructor(
    @InjectModel(AutomationRule.name) private ruleModel: Model<AutomationRuleDocument>,
    @InjectModel(VendorMapping.name) private mappingModel: Model<VendorMappingDocument>,
  ) {}

  async getRules(userId: string) {
    return this.ruleModel.find({ userId: new Types.ObjectId(userId) });
  }

  async createRule(userId: string, data: Partial<AutomationRule>) {
    return this.ruleModel.create({ ...data, userId: new Types.ObjectId(userId) });
  }

  async updateRule(userId: string, id: string, data: Partial<AutomationRule>) {
    return this.ruleModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      data,
      { new: true },
    );
  }

  async deleteRule(userId: string, id: string) {
    return this.ruleModel.deleteOne({ _id: id, userId: new Types.ObjectId(userId) });
  }

  async getMappings(userId: string) {
    return this.mappingModel.find({ userId: new Types.ObjectId(userId) });
  }

  async deleteMappings(userId: string, id: string) {
    return this.mappingModel.deleteOne({ _id: id, userId: new Types.ObjectId(userId) });
  }
}
