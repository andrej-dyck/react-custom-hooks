/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSyncedStore } from './use-synced-store.ts'
import { jsonValue, maybeStringValue, schema, stringValue } from './state-serializer.ts'
import { z } from 'zod'

describe('useSyncedStore', () => {

  it('retrieves stored value for a key', () => {
    const store = fakeStore(['key', 'abc'])
    const { value } = renderHook(
      () => useSyncedStore('key', stringValue(), store)
    ).result.current
    expect(value).toBe('abc')
  })

  it('parses stored json value with given schema', () => {
    const store = fakeStore(['key', '{ "number": 1 }'])
    const { value } = renderHook(
      () => useSyncedStore('key', schema(z.object({ number: z.number() })), store)
    ).result.current
    expect(value).toEqual({ number: 1 })
  })

  it('saves a value under a key', () => {
    const store = fakeStore()

    const { saveValue } = renderHook(
      () => useSyncedStore('key', schema(z.object({ number: z.number() })), store)
    ).result.current
    act(() => saveValue({ number: 17 }))

    expect(maybeJsonParse(store.getItem('key'))).toEqual({ number: 17 })
  })

  it('overrides a stored value under the same key', () => {
    const store = fakeStore(['key', '{ "number": 1 }'])

    const { saveValue } = renderHook(
      () => useSyncedStore('key', schema(z.object({ number: z.number() })), store)
    ).result.current
    act(() => saveValue({ number: 17 }))

    expect(maybeJsonParse(store.getItem('key'))).toEqual({ number: 17 })
  })

  it('updates the value on save', () => {
    const store = fakeStore()

    const render = renderHook(
      () => useSyncedStore('key', schema(z.object({ number: z.number() })), store)
    )
    act(() => render.result.current.saveValue({ number: 17 }))

    expect(render.result.current.value).toEqual({ number: 17 })
  })

  it('saves a value under a key which can be retrieved from a second hook', () => {
    const store = fakeStore()

    const { saveValue } = renderHook(
      () => useSyncedStore('key', schema(z.object({ number: z.number() })), store)
    ).result.current
    act(() => saveValue({ number: 17 }))

    const { value } = renderHook(
      () => useSyncedStore('key', schema(z.object({ number: z.number() })), store)
    ).result.current
    expect(value).toEqual({ number: 17 })
  })

  it('save value in one hook is visible to second hook', () => {
    const store = fakeStore()

    const renderedHook1 = renderHook(
      () => useSyncedStore('key', schema(z.object({ number: z.number() })), store)
    )
    const renderedHook2 = renderHook(
      () => useSyncedStore('key', schema(z.object({ number: z.number() })), store)
    )
    act(() => renderedHook1.result.current.saveValue({ number: 17 }))

    expect(renderedHook2.result.current.value).toEqual({ number: 17 })
  })

  it('can clear a value for a key', () => {
    const store = fakeStore(['key', '{ "number": 1 }'])

    const { clearValue } = renderHook(() => useSyncedStore('key', maybeStringValue, store)).result.current
    act(() => clearValue())

    expect(store.getItem('key')).toBeNull()
  })

  it('clear value in one hook is affecting the second hook', () => {
    const store = fakeStore(['key', 'value'])

    const renderedHook1 = renderHook(
      () => useSyncedStore('key', maybeStringValue, store)
    )
    const renderedHook2 = renderHook(
      () => useSyncedStore('key', maybeStringValue, store)
    )
    act(() => renderedHook1.result.current.clearValue())

    expect(renderedHook2.result.current.value).toBeUndefined()
  })

  it('is undefined when store is empty', () => {
    const store = fakeStore()
    const { value } = renderHook(() => useSyncedStore('key', maybeStringValue, store)).result.current
    expect(value).toBeUndefined()
  })

  it('is undefined when store has no such key', () => {
    const store = fakeStore(['other-key', ''])
    const { value } = renderHook(() => useSyncedStore('key', maybeStringValue, store)).result.current
    expect(value).toBeUndefined()
  })

  it('is undefined when stored value is not json parsable for schema', () => {
    const store = fakeStore(['key', '{'])
    const { value } = renderHook(() => useSyncedStore('key', jsonValue, store)).result.current
    expect(value).toBeUndefined()
  })

  it('is undefined when stored value is not according to schema', () => {
    const store = fakeStore(['key', '{ "number": 1 }'])
    const { value } = renderHook(() => useSyncedStore('key', schema(z.string()), store)).result.current
    expect(value).toBeUndefined()
  })
})

const maybeJsonParse = (v: string | null) => jsonValue.parse('', v)

const fakeStore = (...entries: readonly [string, string][]) => {
  const store = new Map<string, string>(entries)

  return {
    getItem: (key: string): string | null => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  }
}
