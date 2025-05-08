import { createRetrieverTool } from 'langchain/tools/retriever'
import { vectorStore } from '../common'

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
