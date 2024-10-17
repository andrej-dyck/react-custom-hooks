import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StateSerializer } from './state-serializer.ts'

export const useUrlState = <TState>(
  key: string,
  transform: StateSerializer<TState>,
  options?: {
    initialValue?: TState,
    replaceHistory?: boolean
  }
): readonly [TState, Dispatch<SetStateAction<TState>>] => {
  const [state, setState] = useState<TState>(transform.parse('key', undefined))

  const [urlSearchParams, setUrlSearchParams] = useSearchParams()

  useEffect(() => {
    const paramValue = urlSearchParams.get(key)
    if (paramValue != null) setState(transform.parse(key, paramValue))
  }, [key, urlSearchParams, transform])

  const setUrlState = useCallback<Dispatch<SetStateAction<TState>>>((action) => {
    const newState = action instanceof Function ? action(state) : action

    setState(newState)
    setUrlSearchParams(
      params => {
        if (!newState || emptyObject(newState)) params.delete(key)
        else params.set(key, transform.serialize(newState))

        return params
      },
      { replace: options?.replaceHistory ?? false }
    )
  }, [state, transform])

  return [state, setUrlState]
}

const emptyObject = (obj: unknown) =>
  obj && typeof obj === 'object' && Object.keys(obj).length === 0
