import type { BindToolsInput } from '@langchain/core/language_models/chat_models'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { END, START, StateGraph } from '@langchain/langgraph'
import { ChatOllama } from '@langchain/ollama'
import { OLLAMA_BASE_URL, OLLAMA_MODEL } from '@module-toolbox/lib'
import last from 'lodash/last'
import { explainCodeDemoMessage, explainCodeSystemMessage } from './prompt'
import { StateAnnotation } from './state'

// 当前工具
const currentTool: BindToolsInput[] = []

// 代理
async function explainCodeNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const prompt = ChatPromptTemplate.fromMessages([
    explainCodeSystemMessage,
    explainCodeDemoMessage,
    ChatPromptTemplate.fromTemplate('{question}'),
  ])

  const agent = new ChatOllama({
    model: OLLAMA_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    temperature: 0,
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
