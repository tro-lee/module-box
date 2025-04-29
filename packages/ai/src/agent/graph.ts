import type { AIMessage } from '@langchain/core/messages'
import { StateGraph } from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { ChatOllama } from '@langchain/ollama'
import { TavilySearch } from '@langchain/tavily'
import last from 'lodash/last'
import { StateAnnotation } from './state'

const llm = new ChatOllama({
  model: 'qwen2.5',
  baseUrl: 'http://localhost:11434',
})

const tools = [new TavilySearch({ maxResults: 3 })]
const toolNode = new ToolNode(tools)

function agentConditionEdge(state: typeof StateAnnotation.State) {
  const lastMessage = last(state.messages) as AIMessage
  if (lastMessage?.tool_calls?.length) {
    return 'tools'
  }
  return '__end__'
}

const workflow = new StateGraph(StateAnnotation)
  .addNode('agent', llm)
  .addNode('tools', toolNode)
  .addEdge('__start__', 'agent')
  .addEdge('tools', 'agent')
  .addConditionalEdges('agent', agentConditionEdge)

export const graph = workflow.compile()
graph.name = 'agent'
