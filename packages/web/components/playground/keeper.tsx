'use client'

import { usePlaygroundStore } from '@/stores/module/playground-store'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'

export function Keeper() {
  const params = useParams<{ id: string }>()
  const selectedRelativePath = usePlaygroundStore(state => state.selectedRelativePath)
  const setSelectedRelativePath = usePlaygroundStore(state => state.setselectedRelativePath)

  useEffect(() => {
    if (selectedRelativePath !== params.id) {
      setSelectedRelativePath(decodeURIComponent(params.id))
    }
  }, [params.id])

  return <></>
}
