import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsJSON,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { RefineParams } from '../types/types';

export enum Model {
  // GPT_3_5_TURBO = 'gpt-3.5-turbo',
  // GPT_4 = 'gpt-4',
  LLAMA3_1_70B = 'llama-3.1-70b-versatile',
  LLAMA3_2_90B = 'llama-3.2-90b-vision-preview',
}

@ValidatorConstraint({ name: 'boolean-or-refineParams', async: false })
class IsBooleanOrRefineParams implements ValidatorConstraintInterface {
  validate(text: any) {
    if (typeof text === 'boolean') {
      return true;
    }
    if (typeof text === 'object') {
      return (
        typeof text.chunkSize === 'number' &&
        typeof text.overlap === 'number' &&
        text.chunkSize > 0 &&
        text.overlap > 0 &&
        text.chunkSize > text.overlap
      );
    }
  }

  defaultMessage() {
    return 'refine can be undefined, a boolean or an object with chunkSize > 0 and overlap >=0';
  }
}

class JsonExtractRequestDto {
  @ApiProperty({
    description: 'Text to extract structured data from',
  })
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    enum: Model,
    description: 'Model available for data extraction',
  })
  model: Model;
}

class SchemaRequestDto {
  @ApiProperty({
    description: 'Json schema to use as model for data extraction',
  })
  @IsJSON()
  jsonSchema: string;

  @ApiPropertyOptional({
    description: 'Whether to use refine multi-step extraction',
    default: false,
  })
  refine?: boolean;
}

class ExampleRequestDto {
  @ApiProperty({
    description: 'example input text',
  })
  @IsNotEmpty()
  exampleInput: string;

  @ApiProperty({
    description: 'example of desired json output',
  })
  @IsJSON()
  exampleOutput: string;
}

export class JsonExtractSchemaRequestsDto extends IntersectionType(
  JsonExtractRequestDto,
  SchemaRequestDto,
) {}

export class JsonExtractExampleRequestDto extends IntersectionType(
  JsonExtractRequestDto,
  ExampleRequestDto,
) {}
