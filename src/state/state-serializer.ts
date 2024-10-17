import { Schema } from 'zod'

export type StateSerializer<TState> = {
  serialize: (value: NonNullable<TState>) => string,
  parse: (key: string, value: string | undefined | null) => TState,
}

export const stringValue: StateSerializer<string | undefined> = {
  serialize: (value) => value,
  parse: (_, value) => value ?? undefined,
}

export const jsonValue: StateSerializer<NonNullable<unknown> | undefined> = {
  serialize: (value) => JSON.stringify(value),
  parse: (key, value) => {
    if (value == null) return undefined
    try {
      return JSON.parse(value) as NonNullable<unknown>
    } catch (e) {
      console.error('couldn\'t parse stored json', `'${key}'`, value, e)
      return undefined
    }
  },
}

export const schema = <TState>(schema: Schema<TState>): StateSerializer<TState | undefined> => ({
  serialize: jsonValue.serialize,
  parse: (key, value) => {
    const r = schema.safeParse(jsonValue.parse(key, value))
    if (value != null && !r.success) console.error('couldn\'t parse stored value with with schema', `'${key}'`, value, r.error)
    return r.success ? r.data : undefined
  },
})
