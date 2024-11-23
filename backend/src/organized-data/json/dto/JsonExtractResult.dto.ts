import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefineRecap } from '../types/types';
import {
  IsObject,
  IsOptional,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DebugReport } from 'src/organized-data/llm/dto/debug.dto';

export class JsonExtractResultDto {
  @ApiProperty({
    description: 'model used for data extraction',
  })
  model: string;

  @ApiProperty({
    description: 'if refine was used for multi-step extraction',
    default: false,
  })
  refine: boolean;

  @ApiProperty({
    description: 'organized data extracted from text as json',
  })
  output: string;
}
