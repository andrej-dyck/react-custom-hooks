import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { StateSerializer } from './state-serializer.ts'

type SyncStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const useSyncedStore = <TState>(
  key: string,
  transform: StateSerializer<TState>,
  syncStore: SyncStore = window.localStorage // | window.sessionStorage
) => {
  const subscribe = (listener: () => void) => {
    const keyListener = (event: StorageEvent) => {
      if (event.key === key && sameStore(event, syncStore) && sameTabOrSameLocationPath(event)) {
        listener()
      }
    }
    window.addEventListener('storage', keyListener)
    return () => window.removeEventListener('storage', keyListener)
  }

  const syncedValue = useSyncExternalStore<string | null>(subscribe, () => syncStore.getItem(key))
  const value = useMemo(() => transform.parse(key, syncedValue), [key, transform, syncedValue])

  const saveToStore = useCallback((newValue: string) => {
    syncStore.setItem(key, newValue)
    // The storage event is only triggered on other tabs and windows. We need it in the same window too.
    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
  }, [key, syncStore])

  const saveValue = useCallback((value: NonNullable<TState>) => {
    saveToStore(transform.serialize(value))
    return value
  }, [saveToStore, transform])

  const removeFromStore = useCallback(() => {
    syncStore.removeItem(key)
    // The storage event is only triggered on other tabs and windows. We need it in the same window too.
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: null }))
  }, [key, syncStore])

  return {
    value,
    saveValue,
    clearValue: removeFromStore,
  } as const
}

const sameStore = (event: { storageArea: Storage | null }, syncStore: SyncStore) =>
  event.storageArea == null || event.storageArea == syncStore

const sameTabOrSameLocationPath = (event: { url: string }, location: Location = window.location) => {
  if (!event.url) return true

  const { pathname } = new URL(event.url)
  return pathname === location.pathname
}

