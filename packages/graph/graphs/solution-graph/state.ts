import type { BaseMessage, BaseMessageLike } from '@langchain/core/messages'
import { Annotation, messagesStateReducer } from '@langchain/langgraph'

export const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[], BaseMessageLike[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  imageBase64: Annotation<string>,
  ocrRecognizedText: Annotation<string>,
  recognizedText: Annotation<string>,
  summaryText: Annotation<string>,
})
