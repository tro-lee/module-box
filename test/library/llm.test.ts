import {
  StringOutputParser,
} from '@langchain/core/output_parsers'
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts'
import { RunnableLambda } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import { test } from 'bun:test'
import { z } from 'zod'

test.skip(
  'llm test',
  async () => {
    // const model = new ChatDeepSeek({
    //   apiKey: config.OPENAI_API_KEY,
    //   modelName: config.MODEL_NAME,
    //   temperature: 0.7,
    //   streaming: true,
    //   configuration: {
    //     baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    //   },
    // });

    const model = new ChatOpenAI({
      openAIApiKey: process.env.ARK_API_KEY,
      modelName: process.env.DOUBAO_MODEL_NAME,
      temperature: 0.7,
      streaming: true,
      configuration: {
        baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
      },
    })

    const prompt = new PromptTemplate({
      template: '能将 {input} 翻译成中文吗？',
      inputVariables: ['input'],
    })

    const stream = await model.stream(text)

    let result = ''
    for await (const chunk of stream) {
      result += chunk.content
      console.log(chunk.content)
    }

    console.log(result)
  },
  { timeout: 0 },
) // 设置无限超时时间

const personSchema = z.object({
  name: z.optional(z.string()).describe('姓名'),
  age: z.optional(z.number()).describe('年龄'),
  email: z.optional(z.string().email()).describe('邮箱'),
  phone: z.optional(z.string().regex(/^1[3-9]\d{9}$/)).describe('电话'),
  address: z.optional(z.string()).describe('地址'),
  gender: z.optional(z.enum(['male', 'female'])).describe('性别'),
})

test.skip(
  'human test message',
  async () => {
    const llm = new ChatOpenAI({
      openAIApiKey: process.env.ARK_API_KEY,
      modelName: process.env.DOUBAO_MODEL_NAME,
      configuration: {
        baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
      },
    })

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        '你是一个专业的数据分析师，请根据用户提供的信息填写个人信息。',
      ],
      ['user', '{input}'],
    ])

    const chain = prompt.pipe(llm).pipe(new StringOutputParser())

    const prompt2 = ChatPromptTemplate.fromMessages([
      ['system', '请你把下列内容转换成json格式'],
      ['user', '{content}'],
    ])

    const composedChain = new RunnableLambda({
      func: async (input: { input: string }) => {
        const result = await chain.invoke({
          input: input.input,
        })
        return { content: result }
      },
    })
      .pipe(prompt2)
      .pipe(llm)
      .pipe(new StringOutputParser())

    const result = await composedChain.invoke({
      input: '张三，20岁，男，13800138000，北京市海淀区，zhangsan@example.com',
    })

    console.log(result)
  },
  { timeout: 0 },
)
