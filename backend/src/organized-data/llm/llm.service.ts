import { ChatGroq } from '@langchain/groq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { PromptTemplate } from '@langchain/core/prompts';
import { ChainValues } from '@langchain/core/dist/utils/types';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { loadQARefineChain } from 'langchain/chains';

@Injectable()
export class LLMService {
  constructor(private configService: ConfigService) {}

  private llama3_1_70b = new ChatGroq({
    cache: true,
    model: 'llama-3.1-70b-versatile',
    apiKey: this.configService.get<string>('groqApiKey'),
    temperature: 0.8,
    maxConcurrency: 10,
    maxRetries: 3,
  });

  private llama3_2_90b = new ChatGroq({
    cache: true,
    model: 'llama-3.2-90b-vision-preview',
    apiKey: this.configService.get<string>('groqApiKey'),
    temperature: 0.8,
    maxConcurrency: 10,
    maxRetries: 3,
  });

  private availablemodels = new Map<string, BaseLanguageModel>([
    ['llama-3.1-70b-versatile', this.llama3_1_70b],
    ['llama-3.2-90b-vision-preview', this.llama3_2_90b],
  ]);

  async generateOutput(
    model: string,
    promptTemplate: PromptTemplate,
    chainValues: ChainValues,
  ) {
    if (!this.availablemodels.has(model)) {
      throw new Error(`Model ${model} is not available`);
    }
    let verbose = true;

    const prompt = promptTemplate;
    const llm = this.availablemodels.get(model);
    const llmChain = prompt.pipe(llm);

    const output = await llmChain.invoke(chainValues);
    return output;
  }

  private async splitDocument(document: string) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 200,
    });

    const output = await splitter.createDocuments([document]);
    return output;
  }

  async generateRefineOutput(
    model: string,
    initialPromptTemplate: PromptTemplate,
    refinePromptTemplate: PromptTemplate,
    chainValues: ChainValues,
  ) {
    if (!this.availablemodels.has(model)) {
      throw new Error(`Model ${model} is not available`);
    }
    const refineChain = loadQARefineChain(this.availablemodels.get(model), {
      questionPrompt: initialPromptTemplate,
      refinePrompt: refinePromptTemplate,
      verbose: true,
    });

    const output = await refineChain.call(chainValues);
    return output;
  }
}
