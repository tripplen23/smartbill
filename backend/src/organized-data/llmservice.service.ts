import { ChatGroq } from '@langchain/groq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmserviceService {
  constructor(private configService: ConfigService) {}

  private model = new ChatGroq({
    model: 'llama-3.1-70b-versatile',
    apiKey: process.env.GROQ_API_KEY as string,
    temperature: 0.8,
    maxConcurrency: 10,
    maxRetries: 3,
  });
}
