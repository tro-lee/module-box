import type { BaseMessage, BaseMessageLike } from '@langchain/core/messages'
import { Chroma } from '@langchain/community/vectorstores/chroma'
import { Annotation, messagesStateReducer } from '@langchain/langgraph'
import { OllamaEmbeddings } from '@langchain/ollama'

export const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[], BaseMessageLike[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
})

export const OLLAMA_MODEL = 'qwen2.5-coder'
export const OLLAMA_EMBEDDINGS_MODEL = 'nomic-embed-text'
export const OLLAMA_BASE_URL = 'http://localhost:11434'

const embeddings = new OllamaEmbeddings({
  model: OLLAMA_EMBEDDINGS_MODEL,
  baseUrl: OLLAMA_BASE_URL,
})

export const vectorStore = new Chroma(embeddings, {
  collectionName: 'test',
  url: 'http://localhost:10010',
  collectionMetadata: {
    'hnsw:space': 'cosine',
  },
})

export async function addDocuments(
  documents: Parameters<typeof vectorStore.addDocuments>[0],
  options?: Parameters<typeof vectorStore.addDocuments>[1],
): Promise<string[]> {
  return vectorStore.addDocuments(documents, options)
}
