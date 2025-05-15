'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useParams } from 'next/navigation'
import { Fragment } from 'react'

export function PathBreadcrumb() {
  const params = useParams<{ encodepath: string }>()

  if (!params.encodepath) {
    return null
  }

  // 将文件路径分割成数组
  const pathParts = decodeURIComponent(params.encodepath).split('/')

  // 构建面包屑项
  const breadcrumbItems = pathParts.map((part, index) => {
    const path = pathParts.slice(0, index + 1).join('/')
    const isLast = index === pathParts.length - 1

    return (
      <Fragment key={path}>
        <BreadcrumbItem>
          {isLast
            ? (
                <BreadcrumbPage>{part}</BreadcrumbPage>
              )
            : (
                <BreadcrumbLink>{part}</BreadcrumbLink>
              )}
        </BreadcrumbItem>
        {!isLast && <BreadcrumbSeparator />}
      </Fragment>
    )
  })

  return (
    <Breadcrumb className="select-none">
      <BreadcrumbList>
        {breadcrumbItems}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
