import {
  parsePath,
  getPath,
  setPath,
  matchPath,
  stripMatchingElements,
  merge,
  applyTemplate
} from '../src/utils'
import { expect } from '@jest/globals'

it('utils.parsePath', () => {
  expect(parsePath('a.b[0]["a\\\\\\""].x')).toEqual(['a', 'b', 0, 'a\\"', 'x'])
  expect(parsePath('[0]')).toEqual([0])
  expect(parsePath('')).toEqual([])
  expect(parsePath('a')).toEqual(['a'])
  expect(parsePath('a[0]')).toEqual(['a', 0])
  expect(parsePath('["b"]')).toEqual(['b'])
  expect(parsePath('["b]')).toEqual(undefined)
  expect(parsePath('[b]')).toEqual(undefined)
  expect(parsePath('[b"]')).toEqual(undefined)
  expect(parsePath('[b')).toEqual(undefined)
  expect(parsePath('b]')).toEqual(undefined)
  expect(parsePath('[[b]]')).toEqual(undefined)
  expect(parsePath('.a')).toEqual(undefined)
  expect(parsePath('a.[0]')).toEqual(undefined)
  expect(parsePath('a.')).toEqual(undefined)
  expect(parsePath('[true]')).toEqual(undefined)
  expect(parsePath('[1]a')).toEqual(undefined)
})

it('utils.getPath', () => {
  expect(getPath({ '1': 'a' }, [])).toEqual({ '1': 'a' })
  expect(getPath({ '1': 'a' }, [1])).toEqual('a')
  expect(getPath({ x: 'b' }, ['x'])).toEqual('b')
  expect(getPath({ y: ['a', 'b', 'c'] }, ['y', '2'])).toEqual('c')
  expect(getPath({ y: ['a', 'b', 'c'] }, ['y', 2])).toEqual('c')
  expect(getPath({ x: 'b' }, ['x'])).toEqual('b')
  expect(getPath({ x: 'b' }, ['y'])).toEqual(undefined)
  expect(getPath({ x: 'b' }, ['x', 'y'])).toEqual(undefined)
  expect(getPath('a', ['y'])).toEqual(undefined)
  expect(getPath('a', [0])).toEqual(undefined)
  expect(getPath('a', ['length'])).toEqual(undefined)
  expect(getPath(undefined, ['length'])).toEqual(undefined)
  expect(getPath('a', [])).toEqual('a')
})

it('utils.setPath', () => {
  expect(setPath(3, [], 4)).toEqual(4)
  expect(setPath([1, 2, 3], [1], 4)).toEqual([1, 4, 3])
  expect(setPath({ x: 'b' }, ['x', 'y'], 3)).toEqual({ x: { y: 3 } })
  expect(setPath({ x: { z: 4 } }, ['x', 'y'], 3)).toEqual({ x: { y: 3, z: 4 } })
  //expect(setPath({ x: [3] }, ["x", "y"], 4), { x: [3, y: 4] }) //???
  expect(setPath({ x: [3] }, ['x', 'y'], 4, true)).toEqual({ x: { y: 4 } })
  expect(setPath({ x: { a: 3 } }, ['x', 0], 4)).toEqual({
    x: { a: 3, ['0']: 4 }
  })
  expect(setPath({ x: { a: 3 } }, ['x', 0], 4, true)).toEqual({ x: [4] })
  const arrWithoutIndex0: unknown[] = []
  arrWithoutIndex0[1] = 4
  expect(setPath({ x: { a: 3 } }, ['x', 1], 4, true)).toEqual({
    x: arrWithoutIndex0
  })
  expect(setPath({ x: { a: 3 } }, ['x', 0], 4, true)).toEqual({ x: [4] })
  expect(setPath(undefined, ['x', 0], 4, true)).toEqual({ x: [4] })
})

it('utils.matchPath', () => {
  expect(matchPath([], [])).toEqual(true)
  expect(matchPath(['a', 'b'], ['a', 'b'])).toEqual(true)
  expect(matchPath(['a', 'b'], ['*', '*'])).toEqual(true)
  expect(matchPath([1, '0'], [1, 0])).toEqual(true)
  expect(matchPath([1, '0'], ['1', '0'])).toEqual(true)
  expect(matchPath([1, '0'], ['*', '*'])).toEqual(true)
  expect(matchPath([1, '0', ''], ['*', '*'])).toEqual(false)
  expect(matchPath([1, '0'], ['*', '*', '*'])).toEqual(false)
  expect(matchPath([1, '0'], [0, '0'])).toEqual(false)
  expect(matchPath([1, '1'], [1, '0'])).toEqual(false)
  expect(matchPath([1, '0'], ['0', '0'])).toEqual(false)
  expect(matchPath([1, '1'], [1, 0])).toEqual(false)
})

it('utils.stripMatchingElements', () => {
  expect(stripMatchingElements({ a: '3' }, [])).toEqual({ a: '3' })
  expect(stripMatchingElements([1, 2, 3], [])).toEqual([1, 2, 3])
  expect(stripMatchingElements({ a: '3' }, [[]])).toEqual(undefined)
  expect(stripMatchingElements([1, 2, 3], [[]])).toEqual(undefined)
  expect(stripMatchingElements('', [[]])).toEqual(undefined)
  expect(stripMatchingElements('a', [[1]])).toEqual('a')
  expect(stripMatchingElements({ a: '3' }, [['1']])).toEqual({ a: '3' })
  expect(stripMatchingElements({ a: '3', b: 'c' }, [['a'], ['b']])).toEqual({})
  expect(stripMatchingElements({ a: '3', b: 'c' }, [['*']])).toEqual({})
  expect(stripMatchingElements([1, 2], [['0'], [1]])).toEqual([])
  expect(stripMatchingElements([1, 2], [['*']])).toEqual([])

  expect(stripMatchingElements([1, 2, 3], [[1]])).toEqual([1, 3])
  expect(stripMatchingElements({ a: '3', b: 4 }, [['a']])).toEqual({ b: 4 })
  expect(stripMatchingElements({ a: '3', b: { x: 3 } }, [['b', 'x']])).toEqual({
    a: '3',
    b: {}
  })
  expect(
    stripMatchingElements({ a: '3', b: [1, 2, 3], c: 4 }, [['b', 1], ['c']])
  ).toEqual({ a: '3', b: [1, 3] })
})

it('utils.merge', () => {
  expect(merge(undefined, undefined)).toEqual(undefined)
  expect(merge([1], undefined)).toEqual([1])
  expect(merge(1, undefined)).toEqual(1)
  expect(merge(undefined, [2])).toEqual([2])
  expect(merge(undefined, 2)).toEqual(2)
  expect(merge(1, 2)).toEqual(2)
  expect(merge({ a: 3 }, 2)).toEqual(2)
  expect(merge([1, 2, 3], [4, 5])).toEqual([4, 5, 3])
  expect(merge([1, 2, 3], [4, 5, 6, 7])).toEqual([4, 5, 6, 7])
  expect(merge([1, 2, 3], { x: 3 })).toEqual({ x: 3 })
  expect(merge({ x: 3 }, [1, 2, 3])).toEqual([1, 2, 3])
  expect(
    merge({ y: { a: 4 }, z: { b: '1', d: '3' } }, { x: 3, z: { c: '2', d: 4 } })
  ).toEqual({ x: 3, y: { a: 4 }, z: { b: '1', c: '2', d: 4 } })
  expect(
    merge({ x: [1, 2], y: [1, 2] }, { x: [3, 4, 5], y: [3, 4] }, [['x']])
  ).toEqual({ x: [1, 2, 3, 4, 5], y: [3, 4] })
})

describe('applyTemplate', () => {
  let mockReplacer: jest.Mock
  const replacements: { [key: string]: string } = {
    a: 'A',
    b: 'B',
    LONG_VAR: 'long',
    ['"']: 'C',
    [')$)']: 'D'
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockReplacer = jest.fn((key: string) => replacements[key])
  })

  it('does no replacement unless matching fully', () => {
    expect(
      applyTemplate('abc', () => {
        throw new Error('not expected to call replacer')
      })
    ).toEqual('abc')
    expect(
      applyTemplate('$(abc', () => {
        throw new Error('not expected to call replacer')
      })
    ).toEqual('$(abc')
    expect(
      applyTemplate('$\\', () => {
        throw new Error('not expected to call replacer')
      })
    ).toEqual('$\\')
    expect(
      applyTemplate('abc$', () => {
        throw new Error('not expected to call replacer')
      })
    ).toEqual('abc$')
  })

  it('replaces $$', () => {
    expect(applyTemplate('a$$b', mockReplacer)).toEqual('a$b')
    expect(applyTemplate('$$', mockReplacer)).toEqual('$')
    expect(applyTemplate('$$x$$', mockReplacer)).toEqual('$x$')
    expect(mockReplacer).toHaveBeenCalledTimes(0)
  })

  it('replaces simple variables (e.g. $var)', () => {
    expect(applyTemplate('$a', mockReplacer)).toEqual('A')
    expect(applyTemplate('x$LONG_VAR z', mockReplacer)).toEqual('xlong z')
    expect(applyTemplate('$a.$b.$a', mockReplacer)).toEqual('A.B.A')
    expect(mockReplacer).toHaveBeenCalledTimes(5)
    expect(mockReplacer).toHaveBeenCalledWith('a')
    expect(mockReplacer).toHaveBeenCalledWith('b')
    expect(mockReplacer).toHaveBeenCalledWith('LONG_VAR')
  })

  it('replaces variables in brackets (e.g. $(var))', () => {
    expect(applyTemplate('$(a)', mockReplacer)).toEqual('A')
    expect(applyTemplate('x$(LONG_VAR) z', mockReplacer)).toEqual('xlong z')
    expect(applyTemplate('$(a).$(b).$(a)', mockReplacer)).toEqual('A.B.A')
    expect(applyTemplate('"$(")"', mockReplacer)).toEqual('"C"')
    expect(applyTemplate('"$($)$$$))"', mockReplacer)).toEqual('"D"')
    expect(mockReplacer).toHaveBeenCalledTimes(7)
    expect(mockReplacer).toHaveBeenCalledWith('a')
    expect(mockReplacer).toHaveBeenCalledWith('b')
    expect(mockReplacer).toHaveBeenCalledWith('"')
    expect(mockReplacer).toHaveBeenCalledWith(')$)')
    expect(mockReplacer).toHaveBeenCalledWith('LONG_VAR')
  })
})
