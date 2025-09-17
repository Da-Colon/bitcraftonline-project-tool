import { useState, useEffect, useCallback } from "react"

const TRACKED_INVENTORIES_KEY = "bitcraft-tracked-inventories"

export function useTrackedInventories() {
  const [trackedInventories, setTrackedInventories] = useState<Set<string>>(new Set())
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    let storedValue: string | null = null
    try {
      storedValue = window.localStorage.getItem(TRACKED_INVENTORIES_KEY)
      if (storedValue && storedValue !== "[]") {
        const parsed = JSON.parse(storedValue)
        if (Array.isArray(parsed) && parsed.every((value) => typeof value === "string")) {
          setTrackedInventories(new Set(parsed))
        } else {
          console.warn("Invalid tracked inventories payload found in localStorage — resetting state", parsed)
          window.localStorage.removeItem(TRACKED_INVENTORIES_KEY)
        }
      }
    } catch (error) {
      console.warn("Failed to load tracked inventories from localStorage — clearing saved value", error)
      if (storedValue !== null) {
        window.localStorage.removeItem(TRACKED_INVENTORIES_KEY)
      }
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage whenever trackedInventories changes
  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return

    try {
      const arrayToSave = Array.from(trackedInventories)
      window.localStorage.setItem(TRACKED_INVENTORIES_KEY, JSON.stringify(arrayToSave))
    } catch (error) {
      console.warn("Failed to persist tracked inventories to localStorage", error)
    }
  }, [trackedInventories, isLoaded])

  const toggleTracking = useCallback((inventoryId: string) => {
    setTrackedInventories((prev) => {
      const newSet = new Set(prev)
      const id = String(inventoryId)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }, [])

  const isTracked = useCallback(
    (inventoryId: string) => {
      return trackedInventories.has(String(inventoryId))
    },
    [trackedInventories]
  )

  const clearAll = useCallback(() => {
    setTrackedInventories(new Set())
  }, [])

  const trackAll = useCallback((inventoryIds: string[]) => {
    setTrackedInventories(new Set(inventoryIds.map(String)))
  }, [])

  const untrackAll = useCallback(() => {
    setTrackedInventories(new Set())
  }, [])

  return {
    trackedInventories,
    toggleTracking,
    isTracked,
    clearAll,
    trackAll,
    untrackAll,
    isLoaded,
  }
}
