import type { BaseCheckpointSaver } from '@langchain/langgraph'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { END, START, StateGraph } from '@langchain/langgraph'
import { ChatOllama } from '@langchain/ollama'
import { OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_VISION_MODEL } from '@module-toolbox/lib'
import { recognizeImageOCR } from '../../lib/ocr'
import { mixPromptTemplate, summaryPromptTemplate, summarySystemMessage } from './prompt'
import { StateAnnotation } from './state'

async function ocrRecognizeImageNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const text = await recognizeImageOCR(state.imageBase64)
  return {
    ocrRecognizedText: text,
    recognizedText: text,
  }
}

async function recognizeImageNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const llm = new ChatOllama({
    model: OLLAMA_VISION_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    temperature: 0,
  })

  const respone = await llm.invoke(
    [
      new SystemMessage(state.ocrRecognizedText),
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
    model: OLLAMA_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    temperature: 0,
  })

  const prompt = ChatPromptTemplate.fromMessages([
    summarySystemMessage,
    summaryPromptTemplate,
  ])

  const chain = prompt.pipe(llm)

  const respone = await chain.invoke({
    input: state.recognizedText,
  })

  return {
    messages: [respone],
    summaryText: respone.text,
  }
}

async function answerNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const llm = new ChatOllama({
    model: OLLAMA_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    temperature: 0,
  })

  const prompt = mixPromptTemplate

  const chain = prompt.pipe(llm)

  const respone = await chain.invoke({
    image: state.recognizedText,
    context: state.summaryText,
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
    // .addNode('recognize', recognizeImageNode)
    .addNode('summary', summaryNode)
    .addNode('ocr', ocrRecognizeImageNode)
    .addEdge(START, 'ocr')
    // .addEdge('ocr', 'recognize')
    // .addEdge('recognize', 'summary')
    .addEdge('ocr', 'summary')
    .addEdge('summary', END)

  return workflow.compile({ checkpointer })
}

export async function getAnaylzeSolutionItemGraph(options?: {
  checkpointer?: BaseCheckpointSaver | false
}) {
  const checkpointer = options?.checkpointer

  const workflow = new StateGraph(StateAnnotation)
    .addNode('ocr', ocrRecognizeImageNode)
    .addNode('answer', answerNode)
    .addEdge(START, 'ocr')
    .addEdge('ocr', 'answer')
    .addEdge('answer', END)

  return workflow.compile({ checkpointer })
}
