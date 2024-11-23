import { ChatGroq } from '@langchain/groq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { PromptTemplate } from '@langchain/core/prompts';
import { ChainValues } from '@langchain/core/dist/utils/types';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { loadQARefineChain } from 'langchain/chains';
import {
  LLMNotAvailableError,
  PromptTemplateFormatError,
  RefinePromptInputVariablesError,
  RefineReservedChainValuesError,
} from './exceptions/exceptions';
import { Document } from '@langchain/core/documents';

@Injectable()
export class LLMService {
  constructor(private configService: ConfigService) {}

  //region LLMs
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
  //endregion

  //region Helper functions
  private throwErrorIfInputVariableMissing(
    templateName: string,
    variableName: string,
    inputVariables: string[],
  ) {
    if (!inputVariables.includes(variableName)) {
      throw new RefinePromptInputVariablesError(templateName, variableName);
    }
  }

  async splitDocument(document: string, chunkSize = 2000, chunkOverlap = 200) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });

    const output = await splitter.createDocuments([document]);
    return output;
  }
  //endregion

  //region Public functions
  async generateOutput(
    model: string,
    promptTemplate: PromptTemplate,
    chainValues: ChainValues,
  ) {
    if (!this.availablemodels.has(model)) {
      throw new LLMNotAvailableError(model);
    }

    try {
      await promptTemplate.format(chainValues);
    } catch (e) {
      throw new PromptTemplateFormatError();
    }

    const prompt = promptTemplate;
    const llm = this.availablemodels.get(model);
    const llmChain = prompt.pipe(llm);

    const output = await llmChain.invoke(chainValues);
    return output;
  }

  async generateRefineOutput(
    model: string,
    initialPromptTemplate: PromptTemplate,
    refinePromptTemplate: PromptTemplate,
    chainValues: ChainValues & { input_documents: Document[] },
  ) {
    if (!this.availablemodels.has(model)) {
      throw new LLMNotAvailableError(model);
    }

    if (chainValues['context'] || chainValues['existing_answer']) {
      throw new RefineReservedChainValuesError('context or existing_answer');
    }

    this.throwErrorIfInputVariableMissing(
      'initialPromptTemplate',
      'context',
      initialPromptTemplate.inputVariables,
    );

    this.throwErrorIfInputVariableMissing(
      'refinePromptTemplate',
      'context',
      refinePromptTemplate.inputVariables,
    );

    this.throwErrorIfInputVariableMissing(
      'refinePromptTemplate',
      'existing_answer',
      refinePromptTemplate.inputVariables,
    );

    const refineChain = loadQARefineChain(this.availablemodels.get(model), {
      questionPrompt: initialPromptTemplate,
      refinePrompt: refinePromptTemplate,
    });

    const output = await refineChain.call(chainValues);
    return output;
  }
  //endregion
}
