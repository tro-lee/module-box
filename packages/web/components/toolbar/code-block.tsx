import type { LocalComponent } from '@module-toolbox/anaylzer'
import { querySourceCode } from '@/lib/actions/query-source-code'
import { useEffect, useState } from 'react'
import { CodeBlock } from '../ui/code-block'
import { Spinner } from '../ui/spinner'

/**
 * @export
 * @description 组件代码块
 * @version 1.0.0
 */
export function ComponentCodeBlock({ component }: { component: LocalComponent }) {
  const [code, setCode] = useState<string>('')

  useEffect(() => {
    querySourceCode(
      component.componentFilePath,
      component.locStart,
      component.locEnd,
    ).then((code) => {
      setCode(code)
    })
  }, [component])

  if (!code) {
    return (
      <div className="flex items-center justify-end w-full">
        <Spinner className="size-4 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-h-[90vh] w-96 overflow-auto rounded-lg border bg-sidebar">
      <CodeBlock
        language="tsx"
        code={code}
      />
    </div>
  )
}
