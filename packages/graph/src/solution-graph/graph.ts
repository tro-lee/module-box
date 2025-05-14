import type { BaseCheckpointSaver } from '@langchain/langgraph'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { END, START, StateGraph } from '@langchain/langgraph'
import { ChatOllama } from '@langchain/ollama'
import { OLLAMA_BASE_URL, OLLAMA_VISION_MODEL } from '@module-toolbox/lib'
import { last } from 'lodash'
import { recognizeImageSystemMessage, summonPromptTemplate, summonSystemMessage } from './prompt'
import { StateAnnotation } from './state'

async function recognizeImageNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const llm = new ChatOllama({
    model: OLLAMA_VISION_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    temperature: 0,
  })

  const respone = await llm.invoke(
    [
      recognizeImageSystemMessage,
      state.messages[0],
    ],
  )

  return {
    messages: [respone],
  }
}

async function summonNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const llm = new ChatOllama({
    model: OLLAMA_VISION_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    temperature: 0,
  })

  const prompt = ChatPromptTemplate.fromMessages([
    summonSystemMessage,
    summonPromptTemplate,
  ])

  const chain = prompt.pipe(llm)

  const respone = await chain.invoke({
    input: last(state.messages)?.text,
  })

  return {
    messages: [respone],
  }
}

export async function getInitSolutionGraph(options?: {
  checkpointer?: BaseCheckpointSaver | false
}) {
  const checkpointer = options?.checkpointer

  const workflow = new StateGraph(StateAnnotation)
    .addNode('recognize', recognizeImageNode)
    .addNode('summon', summonNode)
    .addEdge(START, 'recognize')
    .addEdge('recognize', 'summon')
    .addEdge('summon', END)

  return workflow.compile({ checkpointer })
}
