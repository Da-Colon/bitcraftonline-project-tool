export function normalizeItemId(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) {
    return ""
  }

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return `item_${raw}`
  }

  const value = String(raw).trim()
  if (value.length === 0) {
    return ""
  }

  // If it already uses the canonical prefix, return as-is (after ensuring no stray whitespace)
  if (value.startsWith("item_")) {
    return value
  }

  // Strip any accidental prefix duplicates like "item_item_123"
  const normalized = value.replace(/^item_+/i, "")

  return `item_${normalized}`
}

export function isCanonicalItemId(value: string): boolean {
  return /^item_\d+$/.test(value)
}
