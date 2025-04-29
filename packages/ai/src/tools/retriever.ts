import { OllamaEmbeddings } from '@langchain/ollama'
import { createRetrieverTool } from 'langchain/tools/retriever'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { transformProjectPathToDocument } from 'module-toolbox-anaylzer'

const vectorStoreMap = new Map<string, MemoryVectorStore>()

async function getVectorStore(filepath: string, options: {
  exclude?: string[]
  include?: string[]
}) {
  if (vectorStoreMap.has(filepath)) {
    return vectorStoreMap.get(filepath) as MemoryVectorStore
  }

  const docs = await transformProjectPathToDocument(filepath, options)
  const embeddings = new OllamaEmbeddings({
    model: 'nomic-embed-text',
    baseUrl: 'http://localhost:11434',
  })

  const memoryVectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings)
  vectorStoreMap.set(filepath, memoryVectorStore)
  return memoryVectorStore
}

async function getRetriever(filepath: string) {
  const vectorStore = await getVectorStore(filepath, {
    include: ['src', 'lib', 'app', 'components', 'store'],
  })

  return vectorStore.asRetriever({
    searchType: 'similarity',
    k: 10,
    tags: ['component', 'frontend'],
  })
}

export async function getRetrieverTool(filepath: string):
Promise<ReturnType<typeof createRetrieverTool>> {
  const retriever = await getRetriever(filepath)
  const tool = createRetrieverTool(
    retriever,
    {
      name: 'find_component_code',
      description:
      'Search and retrieve relevant component code within the project to help understand and analyze frontend component structures and functionalities.',
    },
  )
  return tool
}
