import type { BaseMessage, BaseMessageLike } from '@langchain/core/messages'
import { Chroma } from '@langchain/community/vectorstores/chroma'
import { Annotation, messagesStateReducer } from '@langchain/langgraph'
import { OllamaEmbeddings } from '@langchain/ollama'
import { OLLAMA_BASE_URL, OLLAMA_EMBEDDINGS_MODEL } from 'module-toolbox-constant'

export const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[], BaseMessageLike[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
})

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
