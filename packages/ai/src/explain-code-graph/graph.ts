import type { BindToolsInput } from '@langchain/core/language_models/chat_models'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { END, START, StateGraph } from '@langchain/langgraph'
import { ChatOllama } from '@langchain/ollama'
import last from 'lodash/last'
import { OLLAMA_BASE_URL, OLLAMA_MODEL } from 'module-toolbox-constant'
import { StateAnnotation } from '../common'
import { explainCodeSystemMessage } from './prompt'

// 当前工具
const currentTool: BindToolsInput[] = []

// 代理
async function explainCodeNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const prompt = ChatPromptTemplate.fromMessages([
    explainCodeSystemMessage,
    ChatPromptTemplate.fromTemplate('{question}'),
  ])

  const agent = new ChatOllama({
    model: OLLAMA_MODEL,
    baseUrl: OLLAMA_BASE_URL,
  }).bindTools(currentTool)
  const chain = prompt.pipe(agent)

  const respone = await chain.invoke({
    question: last(state.messages)?.content,
  })

  return {
    messages: [respone],
  }
}

export async function getExplainCodeGraph() {
  const workflow = new StateGraph(StateAnnotation)
    .addNode('agent', explainCodeNode)

  workflow.addEdge(START, 'agent')
  workflow.addEdge('agent', END)

  return workflow.compile()
}
