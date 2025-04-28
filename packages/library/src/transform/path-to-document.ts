import generate from '@babel/generator'
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama'
import { compact, flatten } from 'lodash'
import { scanEntryFilePathsByDir, scanFileContextByAutoFile } from '../scan'

const embeddings = new OllamaEmbeddings({
  model: 'nomic-embed-text', // Default value
  baseUrl: 'http://localhost:11434', // Default value
})

const llm = new ChatOllama({
  model: 'qwen2.5',
  baseUrl: 'http://localhost:11434',
})

// 重要的入口文件
// 将项目路径下的所有文件转换为代码库文档
export async function transformProjectPathToDocument(projectPath: string, options: {
  exclude?: string[]
  include?: string[]
}) {
  // 获取所有文件上下文
  const entryFiles = await scanEntryFilePathsByDir(projectPath, {
    exclude: options.exclude,
    include: options.include,
  })
  const fileContextsPromises = entryFiles.map(filePath =>
    scanFileContextByAutoFile(filePath),
  )
  const fileContextResults = compact(flatten(await Promise.all(fileContextsPromises)))

  const declarations = fileContextResults.map(fileContext =>
    [...fileContext.functionsWithBaseInfo.map(declaration => declaration), ...fileContext.variablesWithBaseInfo.map(declaration => declaration)],
  ).flat()

  return declarations.map((declaration) => {
    const { code } = generate(declaration.nodePath.node, {
      retainLines: false,
      comments: true,
      compact: true,
    })

    return ([{
      pageContent: code,
      id: declaration.filePath + declaration.id.name,
      metadata: {
        filePath: declaration.filePath,
      },
    }])
  })
}
//   await Promise.all(promises)

//   const memoryVectorStore = new MemoryVectorStore(embeddings)

//   // 搜索
//   const retriever = memoryVectorStore.asRetriever({
//     searchType: 'similarity',
//     k: 10,
//     tags: ['component', 'frontend'],
//   })

//   const prompt = ChatPromptTemplate.fromMessages(
//     [['system', `We have provided context information below. {context}`], ['user', 'Given this information, please answer the question: {question}']],
//   )

//   const detailCardUsage = await retriever.invoke('please give me a detailed info of DetailCard component, including usage, props, and examples')

//   const chain = RunnableSequence.from([
//     {
//       context: retriever.pipe(formatDocumentsAsString),
//       question: new RunnablePassthrough(),
//     },
//     prompt,
//     llm,
//     new StringOutputParser(),
//   ])

//   const answer = await chain.invoke(
//     'please give me a detailed info of DetailCard component',
//   )

//   console.log(answer)
// }
