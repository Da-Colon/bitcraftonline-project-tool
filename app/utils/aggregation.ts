/**
 * @fileoverview Utility functions for aggregating data into Record types
 * 
 * Provides reusable functions to replace repeated reduce patterns for grouping,
 * summing, and counting data by keys.
 */

/**
 * Groups array items into a Record by a key function
 * 
 * @param items - Array of items to group
 * @param keyFn - Function that extracts the key from each item
 * @returns Record mapping keys to arrays of items
 * 
 * @example
 * ```typescript
 * const items = [{ tier: 1, name: 'A' }, { tier: 1, name: 'B' }, { tier: 2, name: 'C' }]
 * const grouped = groupBy(items, item => item.tier)
 * // Result: { 1: [{ tier: 1, name: 'A' }, { tier: 1, name: 'B' }], 2: [{ tier: 2, name: 'C' }] }
 * ```
 */
export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>
  for (const item of items) {
    const key = keyFn(item)
    if (!result[key]) {
      result[key] = []
    }
    result[key].push(item)
  }
  return result
}

/**
 * Sums numeric values grouped by a key function
 * 
 * @param items - Array of items to aggregate
 * @param keyFn - Function that extracts the key from each item
 * @param valueFn - Function that extracts the numeric value to sum
 * @returns Record mapping keys to summed values
 * 
 * @example
 * ```typescript
 * const items = [{ tier: 1, quantity: 10 }, { tier: 1, quantity: 5 }, { tier: 2, quantity: 3 }]
 * const sums = sumBy(items, item => item.tier, item => item.quantity)
 * // Result: { 1: 15, 2: 3 }
 * ```
 */
export function sumBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K,
  valueFn: (item: T) => number
): Record<K, number> {
  const result = {} as Record<K, number>
  for (const item of items) {
    const key = keyFn(item)
    result[key] = (result[key] || 0) + valueFn(item)
  }
  return result
}

/**
 * Counts occurrences grouped by a key function
 * 
 * @param items - Array of items to count
 * @param keyFn - Function that extracts the key from each item
 * @returns Record mapping keys to counts
 * 
 * @example
 * ```typescript
 * const items = [{ source: 'personal' }, { source: 'personal' }, { source: 'claim' }]
 * const counts = countBy(items, item => item.source)
 * // Result: { personal: 2, claim: 1 }
 * ```
 */
export function countBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, number> {
  const result = {} as Record<K, number>
  for (const item of items) {
    const key = keyFn(item)
    result[key] = (result[key] || 0) + 1
  }
  return result
}
