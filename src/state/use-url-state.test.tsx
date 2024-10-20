/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { maybeStringValue } from './state-serializer.ts'
import { useUrlState } from './use-url-state.ts'
import { MemoryRouter, useSearchParams } from 'react-router-dom'
import React from 'react'

describe('useUrlState', () => {

  it('retrieves a value for a key', () => {
    const [value] = renderHook(
      () => useUrlState('key', maybeStringValue),
      { wrapper: inMemoryRouter('?key=value') }
    ).result.current

    expect(value).toBe('value')
  })

  it('retrieves nothing when key is missing', () => {
    const [value] = renderHook(
      () => useUrlState('key', maybeStringValue),
      { wrapper: inMemoryRouter() }
    ).result.current

    expect(value).toBeUndefined()
  })

  it('can set state', () => {
    const renderedHook = renderHook(
      () => {
        const [value, setValue] = useUrlState('key', maybeStringValue)
        return { value, setValue }
      },
      { wrapper: inMemoryRouter() }
    )

    act(() => renderedHook.result.current.setValue('value'))

    expect(renderedHook.result.current.value).toBe('value')
  })

  it('saves state in url search params', () => {
    const renderedHook = renderHook(
      () => {
        const [, setValue] = useUrlState('key', maybeStringValue)
        const [urlSearchParams] = useSearchParams()

        return { setValue, urlSearchParams }
      },
      { wrapper: inMemoryRouter() }
    )

    act(() => renderedHook.result.current.setValue('value'))

    expect(renderedHook.result.current.urlSearchParams.get('key')).toBe('value')
  })

  it('removes key from url search params if value is falsy', () => {
    const renderedHook = renderHook(
      () => {
        const [, setValue] = useUrlState('key', maybeStringValue)
        const [urlSearchParams] = useSearchParams()

        return { setValue, urlSearchParams }
      },
      { wrapper: inMemoryRouter('?key=abc') }
    )

    act(() => renderedHook.result.current.setValue(''))

    expect(renderedHook.result.current.urlSearchParams.get('key')).toBeNull()
  })

  it('does not touch any other keys in url search params', () => {
    const renderedHook = renderHook(
      () => {
        const [, setValue] = useUrlState('key', maybeStringValue)
        const [urlSearchParams] = useSearchParams()

        return { setValue, urlSearchParams }
      },
      { wrapper: inMemoryRouter('?key=abc&otherKey=42') }
    )

    act(() => renderedHook.result.current.setValue(''))

    expect(renderedHook.result.current.urlSearchParams.get('otherKey')).toBe('42')
  })
})

const inMemoryRouter = (location: `?${string}` | '' = ''): React.FC<{ children: React.ReactNode }> =>
  ({ children }) => <MemoryRouter initialEntries={[location]}>{children}</MemoryRouter>
