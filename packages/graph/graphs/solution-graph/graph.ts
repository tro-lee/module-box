import type { BaseCheckpointSaver } from '@langchain/langgraph'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { END, START, StateGraph } from '@langchain/langgraph'
import { ChatOllama } from '@langchain/ollama'
import { OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_VISION_MODEL, vectorStore } from '@module-toolbox/lib'
import { createRetrieverTool } from 'langchain/tools/retriever'
import { last } from 'lodash'
import { recognizeImageOCR } from '../../lib/ocr'
import { solutionPromptTemplate, summaryPromptTemplate, summarySystemMessage, taskPromptTemplate } from './prompt'
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

// 创建检索组件代码工具
async function createRetrieveComponentCodeTool(): Promise<ReturnType<typeof createRetrieverTool>> {
  const retriever = vectorStore.asRetriever({
    searchType: 'similarity',
    k: 5,
    tags: ['component', 'frontend'],
  })

  const tool = createRetrieverTool(
    retriever,
    {
      name: 'retrieve_component_code',
      description:
      '这是一个在向量数据库中进行近似搜索组件代码的工具。你可以搜索组件名称或重点代码片段，系统将返回相关的组件代码。输入应该是与组件相关的问题或关键词，输出将是相关的组件代码片段。',
    },
  )

  return tool
}

async function taskNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const llm = new ChatOllama({
    model: OLLAMA_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    temperature: 0,
  }).bindTools([await createRetrieveComponentCodeTool()])

  const prompt = taskPromptTemplate
  const chain = prompt.pipe(llm)

  const respone = await chain.invoke({
    image: state.recognizedText,
    context: state.summaryText,
  })

  return {
    messages: [respone],
  }
}

async function solutionNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const llm = new ChatOllama({
    model: OLLAMA_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    temperature: 0,
  }).bindTools([await createRetrieveComponentCodeTool()])

  const prompt = solutionPromptTemplate
  const chain = prompt.pipe(llm)

  const respone = await chain.invoke({
    task: last(state.messages)?.text || '',
    recognizedText: state.recognizedText || '',
    summaryText: state.summaryText || '',
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
    .addNode('task', taskNode)
    .addNode('solution', solutionNode)
    .addEdge(START, 'ocr')
    .addEdge('ocr', 'task')
    .addEdge('task', 'solution')
    .addEdge('solution', END)

  return workflow.compile({ checkpointer })
}
