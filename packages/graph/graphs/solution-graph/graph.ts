import type { BaseCheckpointSaver } from '@langchain/langgraph'
import { HumanMessage } from '@langchain/core/messages'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { END, START, StateGraph } from '@langchain/langgraph'
import { ChatOllama } from '@langchain/ollama'
import { OLLAMA_BASE_URL, OLLAMA_VISION_MODEL } from '@module-toolbox/lib'
import { last } from 'lodash'
import { recognizeImageSystemMessage, summaryPromptTemplate, summarySystemMessage } from './prompt'
import { StateAnnotation } from './state'

function checkHasRecognizedText(state: typeof StateAnnotation.State): 'recognize' | 'summary' {
  if (state.recognizedText) {
    return 'summary'
  }
  return 'recognize'
}

async function recognizeImageNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const llm = new ChatOllama({
    model: OLLAMA_VISION_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    temperature: 0,
  })

  const respone = await llm.invoke(
    [
      recognizeImageSystemMessage,
      new HumanMessage({
        content: [
          {
            type: 'image_url',
            image_url: state.imageBase64,
          },
        ],
      }),
    ],
  )

  return {
    messages: [respone],
    recognizedText: respone.text,
  }
}

async function summaryNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const llm = new ChatOllama({
    model: OLLAMA_VISION_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    temperature: 0,
  })

  const prompt = ChatPromptTemplate.fromMessages([
    summarySystemMessage,
    summaryPromptTemplate,
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
    .addNode('summary', summaryNode)
    .addConditionalEdges(START, checkHasRecognizedText)
    .addEdge('recognize', 'summary')
    .addEdge('summary', END)

  return workflow.compile({ checkpointer })
}

export async function getAnaylzeSolutionItemGraph(options?: {
  checkpointer?: BaseCheckpointSaver | false
}) {
  const checkpointer = options?.checkpointer

  const workflow = new StateGraph(StateAnnotation)
    .addNode('recognize', recognizeImageNode)
    .addNode('summary', summaryNode)
    .addConditionalEdges(START, checkHasRecognizedText)
    .addEdge('recognize', 'summary')
    .addEdge('summary', END)

  return workflow.compile({ checkpointer })
}
