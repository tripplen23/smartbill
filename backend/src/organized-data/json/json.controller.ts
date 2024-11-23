import {
  Body,
  Controller,
  HttpCode,
  InternalServerErrorException,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JsonService } from './json.service';
import { JsonExtractSchemaRequestsDto } from './dto/JsonExtractRequest.dto';
import { InvalidJsonOutputError } from './exceptions/exceptions';
import { JsonExtractResultDto } from './dto/JsonExtractResult.dto';

@ApiUnauthorizedResponse({
  description: "The API key in request's header is missing or invalid",
})
@ApiBadRequestResponse({
  description: 'The request body is invalid or missing',
})
@ApiUnprocessableEntityResponse({
  description: 'The output is not valid json.',
})
@ApiSecurity('apiKey')
@ApiTags('organized-data')
@Controller({ path: 'organized-data/json', version: '1' })
export class JsonController {
  constructor(private readonly jsonService: JsonService) {}

  @ApiOperation({
    summary: 'Return structured data from text as json using a json schema',
    description: `This endpoint returns organized data from input text as json. 
    It accepts a json schema as model for data extraction. The Refine technique can be used for longer texts.\n
    
    Available model: llama-3.1-70b-versatile`,
  })
  @ApiOkResponse({
    type: JsonExtractResultDto,
    description:
      'The text was successfully organized as json. The output is a valid json object.',
  })
  @ApiBody({
    type: JsonExtractSchemaRequestsDto,
    description:
      'Request body containing text to process as json and extraction parameters.',
  })
  @HttpCode(200)
  @Post('schema')
  async extractSchema(@Body() request: JsonExtractSchemaRequestsDto) {
    const { text, model, jsonSchema, refine } = request;

    const extractionMethod = refine
      ? 'extractWithSchemaAndRefine'
      : 'extractWithSchema';

    try {
      const json = await this.jsonService[extractionMethod](
        text,
        model,
        jsonSchema,
      );
      const response: JsonExtractResultDto = {
        model,
        refine: refine || false,
        output: JSON.stringify(json),
      };
      return response;
    } catch (e) {
      if (e instanceof InvalidJsonOutputError) {
        throw new UnprocessableEntityException(e.message);
      }
      throw new InternalServerErrorException();
    }
  }
}

