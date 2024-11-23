import { BaseCallbackHandler } from '@langchain/core/callbacks/base';

export class RefineCallbackHandler extends BaseCallbackHandler {
  name = 'RefineCallbackHandler';
  private _llmCallCount = 0;

  get llmCallCount() {
    return this.llmCallCount;
  }

  async handleLLMStart() {
    this._llmCallCount++;
  }
}
