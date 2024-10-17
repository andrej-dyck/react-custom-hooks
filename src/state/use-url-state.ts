import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StateSerializer } from './state-serializer.ts'

type ChangeState<TState> = Dispatch<SetStateAction<TState>>

/**
 * Stores (and syncs) state in URL search params.
 *
 * Example:
 *   const App = () => {
 *     const [page, setPage] = useUrlState('page', intValue(1)) // will read/write url param ?page=1
 *
 *     const { data, isLoading } = useQuery('records', fetch(`/records?page=$page`).then(res => res.json()))
 *
 *     return <>
 *       {data?.map(d => ...)}
 *       <Pagination page={page} onChange={(p) => setPage(p)} />
 *     </>
 *   }
 *
 * @param key the param key
 * @param transform see implementations in state-serializer.ts
 * @param options { replaceHistory: boolean } whenever to replace (true) or add to (false; default) browser history
 */
export const useUrlState = <TState>(
  key: string,
  transform: StateSerializer<TState>,
  options?: {
    replaceHistory?: boolean
  }
): readonly [TState, ChangeState<TState>] => {
  const [state, setState] = useState<TState>(transform.parse('key', undefined))

  const [urlSearchParams, setUrlSearchParams] = useSearchParams()

  useEffect(() => {
    const paramValue = urlSearchParams.get(key)
    if (paramValue != null) setState(transform.parse(key, paramValue))
  }, [key, urlSearchParams, transform])

  const setUrlState = useCallback<ChangeState<TState>>((action) => {
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
