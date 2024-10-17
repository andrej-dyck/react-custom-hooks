import { Dispatch, SetStateAction, useCallback, useMemo, useSyncExternalStore } from 'react'
import { StateSerializer } from './state-serializer.ts'

type SyncStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type ChangeValue<TState> = Dispatch<SetStateAction<TState>>

/**
 * Stores and syncs values in local or session storage in a typesafe way.
 *
 * Example:
 *   const App = () => {
 *     const { value: options, saveValue: saveOptions } = useSyncedStore(
 *       'app-options',
 *       schema(z.object({ darkMode: z.boolean().nullish(), locale: z.string().length(2).nullish() }))
 *     )
 *
 *     return <Theme dark={options?.darkMode} onChange={(darkMode) => saveOptions(o => ({...o, darkMode })}>
 *       ...
 *     </Theme>
 *   }
 *
 * @param key the storage key
 * @param transform see implementations in state-serializer.ts
 * @param syncStore window.localStorage | window.sessionStorage
 */
export const useSyncedStore = <TState>(
  key: string,
  transform: StateSerializer<TState>,
  syncStore: SyncStore = window.localStorage // | window.sessionStorage
): {
  readonly value: TState,
  readonly saveValue: ChangeValue<TState>,
  readonly clearValue: () => void,
} => {
  const storedString = useSyncExternalStore<string | null>(subscribe(key, syncStore), () => syncStore.getItem(key))
  const value = useMemo(() => transform.parse(key, storedString), [key, transform, storedString])

  const saveToStore = useCallback((newValue: string) => {
    syncStore.setItem(key, newValue)
    // The storage event is only triggered on other tabs and windows. We need it in the same window too.
    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
  }, [key, syncStore])

  const removeFromStore = useCallback(() => {
    syncStore.removeItem(key)
    // The storage event is only triggered on other tabs and windows. We need it in the same window too.
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: null }))
  }, [key, syncStore])

  const saveValue = useCallback<ChangeValue<TState>>((action) => {
    const newValue = action instanceof Function ? action(value) : action

    if (newValue) saveToStore(transform.serialize(newValue))
    else removeFromStore()
  }, [value, saveToStore, removeFromStore, transform])

  return {
    value,
    saveValue,
    clearValue: removeFromStore,
  } as const
}

const subscribe = (key: string, syncStore: SyncStore) => (listener: () => void) => {
  const keyListener = (event: StorageEvent) => {
    if (event.key === key && sameStore(event, syncStore) && sameTabOrSameLocationPath(event)) {
      listener()
    }
  }
  window.addEventListener('storage', keyListener)
  return () => window.removeEventListener('storage', keyListener)
}

const sameStore = (event: { storageArea: Storage | null }, syncStore: SyncStore) =>
  event.storageArea == null || event.storageArea == syncStore

const sameTabOrSameLocationPath = (event: { url: string }, location: Location = window.location) => {
  if (!event.url) return true

  const { pathname } = new URL(event.url)
  return pathname === location.pathname
}

