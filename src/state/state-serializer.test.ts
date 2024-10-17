import { describe, expect, test } from 'vitest'
import { intValue, jsonValue, maybeIntValue, schema, stringValue } from './state-serializer.ts'
import { z } from 'zod'

describe('state serializers', () => {

  test('string values deserialization', () => {
    expect(stringValue('hello').parse('', undefined)).toEqual('hello')
  })

  test('int values serialization', () => {
    expect(maybeIntValue.serialize(1)).toEqual('1')
    expect(maybeIntValue.serialize(1.2)).toEqual('')
    expect(intValue().serialize(1)).toEqual('1')
    expect(intValue(1).serialize(1.2)).toEqual('1')
  })

  test('int values deserialization', () => {
    expect(maybeIntValue.parse('', '1')).toEqual(1)
    expect(maybeIntValue.parse('', '1.2')).toBeUndefined()
    expect(intValue().parse('', '1')).toEqual(1)
    expect(intValue(1).parse('', '1.2')).toEqual(1)
  })

  test('json values serialization', () => {
    expect(jsonValue.serialize(1)).toEqual('1')
    expect(jsonValue.serialize(true)).toEqual('true')
    expect(jsonValue.serialize('abc')).toEqual('"abc"')
    expect(jsonValue.serialize([1, 2, 3])).toEqual('[1,2,3]')
    expect(jsonValue.serialize({ id: '1a' })).toEqual('{"id":"1a"}')
  })

  test('json values deserialization', () => {
    expect(jsonValue.parse('', '1')).toEqual(1)
    expect(jsonValue.parse('', 'true')).toEqual(true)
    expect(jsonValue.parse('', '"abc"')).toEqual('abc')
    expect(jsonValue.parse('', '[1,2,3]')).toEqual([1, 2, 3])
    expect(jsonValue.parse('', '{"id":"1a"}')).toEqual({ id: '1a' })
    expect(jsonValue.parse('', '1a')).toBeUndefined()
    expect(jsonValue.parse('', '{id:2b}')).toBeUndefined()
  })

  test('with schema deserialization', () => {
    expect(schema(z.number().int()).parse('', '1')).toBe(1)
    expect(schema(z.number().int()).parse('', '"1"')).toBeUndefined()
    expect(schema(z.number().int(), 1).parse('', '"1"')).toBe(1)

    expect(schema(z.boolean()).parse('', 'true')).toBe(true)
    expect(schema(z.boolean()).parse('', 'false')).toBe(false)
    expect(schema(z.boolean()).parse('', 'f')).toBeUndefined()
    expect(schema(z.boolean(), false).parse('', 'f')).toBe(false)

    expect(schema(z.object({ id: z.string() })).parse('', '{"id":"abc","other":"value"}')).toEqual({ id: 'abc' })
    expect(schema(z.object({ id: z.string() })).parse('', '{"other":"value"}')).toBeUndefined()
    expect(schema(z.object({ id: z.string() }), { id: '1a' }).parse('', '{"other":"value"}')).toEqual({ id: '1a' })
  })
})
