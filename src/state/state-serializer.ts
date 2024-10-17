import { Schema } from 'zod'

export type StateSerializer<TState> = {
  serialize: (value: NonNullable<TState>) => string,
  parse: (key: string, value: string | undefined | null) => TState,
}

export const maybeStringValue: StateSerializer<string | undefined> = {
  serialize: (value) => value,
  parse: (_, value) => value ?? undefined,
}

export const stringValue = (defaultValue = ''): StateSerializer<string> => ({
  serialize: maybeStringValue.serialize,
  parse: (key, value) => maybeStringValue.parse(key, value) ?? defaultValue,
})

export const maybeIntValue: StateSerializer<number | undefined> = {
  serialize: (value) => Number.isSafeInteger(value) ? String(value) : '',
  parse: (_, value) => {
    if (value == null) return undefined

    const n = Number(value)
    return Number.isSafeInteger(n) ? n : undefined
  },
}

export const intValue = (defaultValue = 0): StateSerializer<number> => ({
  serialize: (value) => String(Number.isSafeInteger(value) ? value : defaultValue),
  parse: (key, value) => maybeIntValue.parse(key, value) ?? defaultValue,
})

export const jsonValue: StateSerializer<NonNullable<unknown> | undefined> = {
  serialize: (value) => JSON.stringify(value),
  parse: (key, value) => {
    if (value == null) return undefined
    try {
      return JSON.parse(value) as NonNullable<unknown>
    } catch (e) {
      console.warn('couldn\'t parse stored json', `'${key}'`, value, e)
      return undefined
    }
  },
}

export function schema<TState extends NonNullable<unknown>>(schema: Schema<TState>): StateSerializer<TState | undefined>
export function schema<TState extends NonNullable<unknown>>(schema: Schema<TState>, defaultValue: TState): StateSerializer<TState>
export function schema<TState extends NonNullable<unknown>>(schema: Schema<TState>, defaultValue?: TState): StateSerializer<TState | undefined> {
  return {
    serialize: jsonValue.serialize,
    parse: (key, value) => {
      const r = schema.safeParse(jsonValue.parse(key, value))
      if (value != null && !r.success) console.error('couldn\'t parse stored value with with schema', `'${key}'`, value, r.error)
      return r.success ? r.data : defaultValue
    },
  }
}
