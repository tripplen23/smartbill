import { Module } from '@nestjs/common';
import { LlmserviceService } from './llmservice.service';

@Module({
  providers: [LlmserviceService]
})
export class OrganizedDataModule {}
