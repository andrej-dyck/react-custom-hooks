import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { Schema } from 'zod'

export const useStoredValue = <T extends NonNullable<unknown>>(
  key: string,
  transform: Transformation<T>, // use `stringValue` for "no transformation"
  syncStore: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = window.localStorage // mainly for tests
) => {
  const subscribe = (listener: () => void) => {
    const keyListener = (event: StorageEvent) => {
      if (event.key === key && (event.storageArea === syncStore || event.storageArea == null)) {
        listener()
      }
    }
    window.addEventListener('storage', keyListener)
    return () => window.removeEventListener('storage', keyListener)
  }

  const syncedValue = useSyncExternalStore<string | null>(subscribe, () => syncStore.getItem(key))
  const value = useMemo(() => transform.onRead(key, syncedValue), [key, transform, syncedValue])

  const saveToStore = useCallback((newValue: string) => {
    syncStore.setItem(key, newValue)
    // The storage event is only triggered on other tabs and windows. We need it in the same window too.
    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
  }, [key, syncStore])

  const saveValue = useCallback((value: T) => {
    saveToStore(transform.onSave(value))
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

type Transformation<T extends NonNullable<unknown>> = {
  onSave: (value: T) => string,
  onRead: (key: string, value: string | null) => T | undefined,
}

export const stringValue: Transformation<string> = {
  onSave: (value) => value,
  onRead: (_, value) => value ?? undefined,
}

export const jsonValue: Transformation<NonNullable<unknown>> = {
  onSave: (value) => JSON.stringify(value),
  onRead: (key, value) => {
    if (value == null) return undefined
    try {
      return JSON.parse(value) as NonNullable<unknown>
    } catch (e) {
      console.warn('couldn\'t parse stored json', `'${key}'`, value, e)
      return undefined
    }
  },
}

export const schema = <T extends NonNullable<unknown>>(schema: Schema<T>): Transformation<T> => ({
  onSave: jsonValue.onSave,
  onRead: (key, value) => {
    const r = schema.safeParse(jsonValue.onRead(key, value))
    if (value != null && !r.success) console.error('couldn\'t parse stored value with with schema', `'${key}'`, value, r.error)
    return r.success ? r.data : undefined
  },
})
