import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationRule, AutomationRuleSchema } from '../../schemas/automation-rule.schema';
import { VendorMapping, VendorMappingSchema } from '../../schemas/vendor-mapping.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: AutomationRule.name, schema: AutomationRuleSchema },
    { name: VendorMapping.name, schema: VendorMappingSchema },
  ])],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
