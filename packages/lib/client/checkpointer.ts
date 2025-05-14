import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not set')
}

export const checkpointer = PostgresSaver.fromConnString(process.env.POSTGRES_URL, {
  schema: 'checkpointer',
})

await checkpointer.setup()
