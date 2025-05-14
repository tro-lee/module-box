import { HumanMessage } from '@langchain/core/messages'
import { getInitSolutionGraph } from '@module-toolbox/ai/src/solution-graph/graph'
import { checkpointer } from '@module-toolbox/lib'
import { test } from 'bun:test'
import { app } from './../packages/ai/src/explain-code-graph/app'
import { data } from './test-data'

test.skip('test app', async () => {
  await app.invoke({
    messages: [
      new HumanMessage(
        `
export function DetailCard() {
  const selectedComponents = useFlowStore(state => state.selectedComponents)
  const [selectedComponentKey, setSelectedComponentKey] = useState('')
  const [codeContentPromise, setCodeContentPromise] = useState<Promise<string>>(Promise.resolve(''))

  useEffect(() => {
    setSelectedComponentKey(selectedComponents[0]?.componentKey ?? '')
  }, [selectedComponents[0]?.componentKey])

  useEffect(() => {
    const selectedComponent = selectedComponents.find(node => node.componentKey === selectedComponentKey)
    if (selectedComponent?.type === 'LocalComponent') {
      const { componentFilePath, locStart, locEnd } = selectedComponent
      setCodeContentPromise(querySourceCode(componentFilePath, locStart, locEnd))
    }
    else {
      setCodeContentPromise(Promise.resolve(''))
    }
  }, [selectedComponentKey, selectedComponents])

  if (selectedComponents.length === 0) {
    return null
  }

  return (
    <Tabs
      className="w-full h-full flex flex-col gap-2"
      key={selectedComponents[0].componentKey}
      value={selectedComponentKey}
    >
      <Card className="p-2">
        <TabsList key="tabsList" className="w-full overflow-auto">
          {selectedComponents.map((node, index) => (
            <TabsTrigger
              key={node.componentKey}
              value={node.componentKey}
              onClick={() =>
                setSelectedComponentKey(node.componentKey)}
            >
              {node.componentName}
            </TabsTrigger>
          ))}
        </TabsList>
      </Card>

      {selectedComponents.map((node, index) => (
        <TabsContent key={node.componentKey} value={node.componentKey}>
          <Suspense fallback={<div className="h-[80vh] w-full animate-pulse rounded-lg bg-[#f5f2f0]" />}>
            <HighlightCode codeContentPromise={codeContentPromise} />
          </Suspense>
        </TabsContent>
      ))}

      <Card className="flex-1">
      </Card>
    </Tabs>
  )
}
        `,
      ),
    ],
  })
}, { timeout: 0 })

const config = {
  configure: {
    thread_id: '1',
  },
}

test.skip('test init solution', async () => {
  const app = await getInitSolutionGraph()

  const stream = app.stream({
    messages: [
      new HumanMessage({
        content: [
          {
            type: 'image_url',
            image_url: data,
          },
        ],
      }),
    ],
  }, { streamMode: 'messages' })

  for await (const messages of await stream) {
    process.stdout.write(messages[0].content)
  }
}, { timeout: 0 })

test.skip('test solution with checkpointer', async () => {
  const app = await getInitSolutionGraph({ checkpointer })

  const stream = app.stream({
    messages: [
      new HumanMessage({
        content: [
          {
            type: 'text',
            text: '我刚才说了什么？最近的一句',
          },
        ],
      }),
    ],
  }, { streamMode: 'messages', configurable: { thread_id: '1' } })

  for await (const messages of await stream) {
    process.stdout.write(messages[0].content)
  }
}, { timeout: 0 })
