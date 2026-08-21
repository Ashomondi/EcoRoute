import { useCallback } from 'react'
import collectionService from '../services/collectionService'
import { useLoad } from './useLoad'

export function useCollections() {
  const list = useCallback(() => collectionService.listCollections(), [])
  const state = useLoad(list, { initial: [] })
  return { ...state, collections: state.data }
}
