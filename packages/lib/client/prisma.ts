import type { Document } from '../generated/prisma'
import { PrismaVectorStore } from '@langchain/community/vectorstores/prisma'
import { OllamaEmbeddings } from '@langchain/ollama'
import { OLLAMA_BASE_URL, OLLAMA_EMBEDDINGS_MODEL } from '../constant/ollama'
import { Prisma, PrismaClient } from '../generated/prisma'

export const prisma = new PrismaClient()

export const vectorStore = PrismaVectorStore.withModel<Document>(prisma).create(
  new OllamaEmbeddings({
    model: OLLAMA_EMBEDDINGS_MODEL,
    baseUrl: OLLAMA_BASE_URL,
  }),
  {
    prisma: Prisma,
    tableName: 'Document',
    vectorColumnName: 'vector',
    columns: {
      id: PrismaVectorStore.IdColumn,
      content: PrismaVectorStore.ContentColumn,
    },
  },
)

export async function addDocument(
  content: string,
  id: string,
) {
  const model = await prisma.document.upsert({
    where: { id },
    create: { id, content },
    update: { content },
  })

  return vectorStore.addModels(
    [model],
  )
}
