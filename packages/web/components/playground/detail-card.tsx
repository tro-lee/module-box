'use client'

import { fetchCodeContentData } from '@/actions/code-content-data'
import { fetchExplainCodeStreamData } from '@/actions/explain-code-data'
import { useGraphStore } from '@/store/graph-store'
import { TabsTrigger } from '@radix-ui/react-tabs'
import Prism from 'prismjs'
import { Suspense, use, useEffect, useState } from 'react'
import { remark } from 'remark'
import html from 'remark-html'

import { Card } from '../ui/card'
import { Tabs, TabsContent, TabsList } from '../ui/tabs'
import 'prismjs/themes/prism.css'
import 'prismjs/components/prism-jsx.js'
import 'prismjs/components/prism-tsx.js'
import 'prismjs/plugins/line-numbers/prism-line-numbers.js'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'

function HighlightCode({ codeContentPromise }: { codeContentPromise: Promise<string> }) {
  const codeContent = use(codeContentPromise)

  useEffect(() => {
    Prism.highlightAll()
  }, [])

  return (
    <pre className="language-tsx line-numbers h-[80vh] overflow-auto rounded-lg" style={{ margin: 0 }}>
      <code>
        {codeContent}
      </code>
    </pre>
  )
}

function CodeExplainer({ componentFilePath, locStart, locEnd }: { componentFilePath: string, locStart: number, locEnd: number }) {
  const [explanation, setExplanation] = useState<string>('')
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // 将Markdown文本转换为HTML
  async function processMarkdown(markdown: string) {
    try {
      const result = await remark()
        .use(html)
        .process(markdown)

      return result.toString()
    }
    catch (error) {
      console.error('Markdown处理错误:', error)
      return markdown // 如果解析失败，返回原始文本
    }
  }

  useEffect(() => {
    async function fetchExplanation() {
      try {
        setIsLoading(true)
        setExplanation('')
        setHtmlContent('')
        setError(null)

        const stream = await fetchExplainCodeStreamData(componentFilePath, locStart, locEnd)
        const reader = stream.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done)
            break

          const text = decoder.decode(value, { stream: true })
          setExplanation(prev => prev + text)
        }
      }
      catch (err) {
        setError(err instanceof Error ? err.message : '获取代码解释时出错')
        console.error('获取代码解释出错:', err)
      }
      finally {
        setIsLoading(false)
      }
    }

    if (componentFilePath && locStart !== undefined && locEnd !== undefined) {
      fetchExplanation()
    }
  }, [componentFilePath, locStart, locEnd])

  // 当解释内容更新时，将其转换为HTML
  useEffect(() => {
    if (explanation) {
      processMarkdown(explanation).then((html) => {
        setHtmlContent(html)
      })
    }
  }, [explanation])

  if (error) {
    return (
      <div className="h-[80vh] p-4 overflow-auto rounded-lg bg-red-50 text-red-600">
        <p>获取代码解释出错:</p>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="h-[80vh] p-4 overflow-auto rounded-lg bg-white">
      {isLoading && explanation === ''
        ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-2 w-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 w-32 bg-gray-200 rounded"></div>
                <p className="mt-4 text-gray-500">正在解析代码...</p>
              </div>
            </div>
          )
        : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {htmlContent
                ? <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                : <div className="whitespace-pre-wrap">{explanation || '正在获取代码解释...'}</div>}
            </div>
          )}
    </div>
  )
}

export function DetailCardComponent() {
  const selectedComponents = useGraphStore(state => state.selectedComponents)
  const [selectedComponentKey, setSelectedComponentKey] = useState('')
  const [codeContentPromise, setCodeContentPromise] = useState<Promise<string>>(Promise.resolve(''))
  const [viewMode, setViewMode] = useState<'code' | 'explain'>('code')

  useEffect(() => {
    setSelectedComponentKey(selectedComponents[0]?.componentKey ?? '')
  }, [selectedComponents[0]?.componentKey])

  useEffect(() => {
    const selectedComponent = selectedComponents.find(node => node.componentKey === selectedComponentKey)
    if (selectedComponent?.type === 'LocalComponent') {
      const { componentFilePath, locStart, locEnd } = selectedComponent
      setCodeContentPromise(fetchCodeContentData(componentFilePath, locStart, locEnd))
    }
    else {
      setCodeContentPromise(Promise.resolve(''))
    }
  }, [selectedComponentKey, selectedComponents])

  if (selectedComponents.length === 0) {
    return null
  }

  const selectedComponent = selectedComponents.find(node => node.componentKey === selectedComponentKey)

  return (
    <Tabs
      className="w-full h-full flex flex-col gap-2"
      key={selectedComponents[0].componentKey}
      value={selectedComponentKey}
    >
      <Card className="p-2">
        <TabsList key="tabsList" className="w-full overflow-auto">
          {selectedComponents.map(node => (
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

      {selectedComponents.map(node => (
        <TabsContent key={node.componentKey} value={node.componentKey}>
          <Card className="p-2 mb-2">
            <TabsList className="w-full flex">
              <TabsTrigger
                value="code"
                className={viewMode === 'code' ? 'bg-gray-200' : ''}
                onClick={() => setViewMode('code')}
              >
                代码
              </TabsTrigger>
              <TabsTrigger
                value="explain"
                className={viewMode === 'explain' ? 'bg-gray-200' : ''}
                onClick={() => setViewMode('explain')}
              >
                解释
              </TabsTrigger>
            </TabsList>
          </Card>

          {viewMode === 'code'
            ? (
                <Suspense fallback={<div className="h-[80vh] w-full animate-pulse rounded-lg bg-[#f5f2f0]" />}>
                  <HighlightCode codeContentPromise={codeContentPromise} />
                </Suspense>
              )
            : (
                selectedComponent?.type === 'LocalComponent' && (
                  <CodeExplainer
                    componentFilePath={selectedComponent.componentFilePath}
                    locStart={selectedComponent.locStart}
                    locEnd={selectedComponent.locEnd}
                  />
                )
              )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
