'use client'
'use module'

import { usePlaygroundStore } from '@/stores/module/playground-store'
import { useRouter } from 'next/navigation'
import { Fragment, use, useCallback, useEffect } from 'react'
import { File, Folder, Tree } from '../ui/file-tree'
import { Skeleton } from '../ui/skeleton'

interface Element {
  id: string
  isSelectable: boolean
  name: string
  children?: Element[]
}

// 递归渲染元素组件
function RenderElement({ element }: { element: Element }) {
  if (element.children) {
    return (
      <Folder value={element.id} element={element.name}>
        {element.children.map(child => (
          <RenderElement key={child.id} element={child} />
        ))}
      </Folder>
    )
  }

  return (
    <File value={element.id}>
      <p>{element.name}</p>
    </File>
  )
}

// 递归获取所有文件夹的ID
function getAllFolderIds(elements: Element[]): string[] {
  const ids: string[] = []
  elements.forEach((element) => {
    ids.push(element.id)
    if (element.children) {
      ids.push(...getAllFolderIds(element.children))
    }
  })
  return ids
}

// 模块资源管理器：用于展示和管理项目中的模块、组件及其依赖关系
export function ModuleExplorer({
  dataPromise,
}: {
  dataPromise: Promise<{
    rootPath: string
    elements: Element[]
  }>
}) {
  const { rootPath, elements } = use(dataPromise)
  const router = useRouter()
  const currentRootPath = usePlaygroundStore(state => state.rootPath)
  const setRootPath = usePlaygroundStore(state => state.setRootPath)
  const selectedRelativePath = usePlaygroundStore(state => state.selectedRelativePath)

  useEffect(() => {
    if (currentRootPath === rootPath) {
      return
    }
    setRootPath(rootPath)
  }, [rootPath, setRootPath])

  const handleSelect = useCallback((id: string) => {
    router.push(`/playground/${encodeURIComponent(id)}`)
  }, [router])

  return (
    <Tree
      className="text-muted-foreground"
      initialSelectedId={selectedRelativePath || undefined}
      initialExpandedItems={getAllFolderIds(elements)}
      elements={elements}
      handleSelect={handleSelect}
    >
      {elements.map(element => (
        <RenderElement key={element.id} element={element} />
      ))}
    </Tree>
  )
}

export function ModuleExplorerSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Fragment key={index}>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            {' '}
            {/* 文件夹图标骨架 */}
            <Skeleton className="h-4 w-24" />
            {' '}
            {/* 文件夹名称骨架 */}
          </div>
          <div className="pl-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              {' '}
              {/* 文件图标骨架 */}
              <Skeleton className="h-4 w-24" />
              {' '}
              {/* 文件名骨架 */}
            </div>
          </div>
          <div className="pl-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              {' '}
              {/* 文件图标骨架 */}
              <Skeleton className="h-4 w-24" />
              {' '}
              {/* 文件名骨架 */}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  )
}
