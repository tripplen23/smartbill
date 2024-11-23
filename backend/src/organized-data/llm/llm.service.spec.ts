import { Test, TestingModule } from '@nestjs/testing';
import { LLMService } from './llm.service';
import { PromptTemplate } from '@langchain/core/prompts';
import { ConfigModule } from '@nestjs/config';
import {
  LLMNotAvailableError,
  PromptTemplateFormatError,
  RefineReservedChainValuesError,
} from './exceptions/exceptions';

describe('LlmserviceService', () => {
  let service: LLMService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [LLMService],
    }).compile();

    service = module.get<LLMService>(LLMService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOutput()', () => {
    it('Should generate an output', async () => {
      const model = 'llama-3.1-70b-versatile';
      const promptTemplate = new PromptTemplate({
        template:
          'What is a good name for a company that makes {product} in Finnish?',
        inputVariables: ['product'],
      });

      const output = await service.generateOutput(model, promptTemplate, {
        product: 'Legal platform software',
      });

      expect(output).toBeDefined();
    });

    it('Should throw error if the given model is not available', async () => {
      const model = 'gpt369';
      const promptTemplate = new PromptTemplate({
        template:
          'What is a good name for a company that makes {product} in Finnish?',
        inputVariables: ['product'],
      });

      await expect(
        service.generateOutput(model, promptTemplate, {
          product: 'Legal platform software',
        }),
      ).rejects.toThrow(LLMNotAvailableError);
    });

    it('Should throw if the chain values do not match the input variables of the prompt template', async () => {
      const model = 'llama-3.1-70b-versatile';
      const promptTemplate = new PromptTemplate({
        template:
          'What is a good name for a company that makes {product} in Finnish?',
        inputVariables: ['product'],
      });

      const output = await service.generateOutput(model, promptTemplate, {
        wrongValue: 'Legal platform software',
      });

      expect(output).rejects.toThrow(PromptTemplateFormatError);
    });
  });

  describe('generateRefineOutput()', () => {
    it('Should generate the correct output from a chunked document', async () => {
      const model = 'llama-3.1-70b-versatile';
      const text = `
      This is the first sentence of the testing text.\n
      This is the second sentence of the testing text. It contains the tagged value to output: llm-organizer
      `;

      const documents = await service.splitDocument(text, 100, 0);
      const initialPromptTemplate = new PromptTemplate({
        template: `Given the following text, please write the value to output.
        --------------------------------
        {context}
        --------------------------------
        Output:`,
        inputVariables: ['context'],
      });

      const refinePromptTemplate = new PromptTemplate({
        template: `
        Given the following text, please only write the tagged value to output.
        --------------------------------
        You have provided an existing output:
        {existing_answer}
        
        We have the opportunity to refine the original output to give a better answer.
        If the context isn't useful, return the existing output.`,
        inputVariables: ['existing_answer', 'context'],
      });

      const output = await service.generateRefineOutput(
        model,
        initialPromptTemplate,
        refinePromptTemplate,
        {
          input_documents: documents,
        },
      );

      expect(output).toBeDefined();
      expect(output['output_text']).toContain('llm-organizer');
    }, 70000);

    it('Should throw error if the given model is not available', async () => {
      const model = 'gpt369';
      const promptTemplate = new PromptTemplate({
        template:
          'What is a good name for a company that makes {product} in Finnish?',
        inputVariables: ['product'],
      });

      await expect(
        service.generateRefineOutput(model, promptTemplate, promptTemplate, {
          input_documents: [],
        }),
      ).rejects.toThrow(LLMNotAvailableError);
    });

    it('Should throw if there are reserved input variables in chainValues', async () => {
      const model = 'llama-3.1-70b-versatile';
      const promptTemplate = new PromptTemplate({
        template:
          'What is a good name for a company that makes {product} in Finnish?',
        inputVariables: ['product'],
      });

      const output = await service.generateRefineOutput(
        model,
        promptTemplate,
        promptTemplate,
        {
          input_documents: [],
          context: 'Not allowed',
        },
      );

      expect(output).rejects.toThrow(
        `Reserved chain value context or existing_answer cannot be used as an input variable`,
      );
    });

    it('Should throw if the initial prompt template does not have context input variable', async () => {
      const model = 'llama-3.1-70b-versatile';
      const promptTemplate = new PromptTemplate({
        template:
          'What is a good name for a company that makes {product} in Finnish?',
        inputVariables: ['product'],
      });

      const output = await service.generateRefineOutput(
        model,
        promptTemplate,
        promptTemplate,
        {
          input_documents: [],
        },
      );

      expect(output).rejects.toThrow(
        `initialPromptTemplate is missing mandatory input variable: context.`,
      );
    });

    it('Should throw if the refine prompt template does not have context input variable', async () => {
      const model = 'llama-3.1-70b-versatile';
      const initialPromptTemplate = new PromptTemplate({
        template:
          'What is a good name for a company that makes {context} in Finnish?',
        inputVariables: ['context'],
      });

      const refinePromptTemplate = new PromptTemplate({
        template:
          'What is a good name for a company that makes {product} in Finnish?',
        inputVariables: ['product'],
      });

      const output = await service.generateRefineOutput(
        model,
        initialPromptTemplate,
        refinePromptTemplate,
        {
          input_documents: [],
        },
      );

      expect(output).rejects.toThrow(
        `refinePromptTemplate is missing mandatory input variable: context.`,
      );
    });

    it('Should throw if the refine prompt template does not have existing_answer input variable', async () => {
      const model = 'llama-3.1-70b-versatile';
      const initialPromptTemplate = new PromptTemplate({
        template:
          'What is a good name for a company that makes {context} in Finnish?',
        inputVariables: ['context'],
      });

      const refinePromptTemplate = new PromptTemplate({
        template:
          'What is a good name for a company that makes {context} in Finnish?',
        inputVariables: ['context'],
      });

      const output = await service.generateRefineOutput(
        model,
        initialPromptTemplate,
        refinePromptTemplate,
        {
          input_documents: [],
        },
      );

      expect(output).rejects.toThrow(
        `refinePromptTemplate is missing mandatory input variable: existing_answer.`,
      );
    });
  });
});
