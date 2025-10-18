/**
 * Dual persistence service for inventory tracking
 * Uses IndexedDB as primary storage with localStorage fallback
 */

import type {
  TrackedInventorySnapshot,
  PlayerInventoryTracking,
  InventoryTrackingStorage,
} from "~/types/inventory-tracking"

const STORAGE_KEY = "bitcraft-inventory-tracking"
const DB_NAME = "BitCraftInventoryTracking"
const DB_VERSION = 1
const STORE_NAME = "inventories"

class InventoryStorageService {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  private async initDB(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("IndexedDB not available in server environment"))
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "playerId" })
        }
      }
    })

    return this.initPromise
  }

  async saveTrackedInventory(
    playerId: string,
    inventorySnapshot: TrackedInventorySnapshot
  ): Promise<void> {
    try {
      // Try IndexedDB first
      await this.initDB()
      if (this.db) {
        const transaction = this.db.transaction([STORE_NAME], "readwrite")
        const store = transaction.objectStore(STORE_NAME)

        // Get existing data
        const getRequest = store.get(playerId)
        await new Promise<void>((resolve, reject) => {
          getRequest.onsuccess = () => {
            const existing: PlayerInventoryTracking = getRequest.result || {
              playerId,
              trackedInventories: {},
              lastUpdated: new Date().toISOString(),
            }

            existing.trackedInventories[inventorySnapshot.id] = inventorySnapshot
            existing.lastUpdated = new Date().toISOString()

            const putRequest = store.put(existing)
            putRequest.onsuccess = () => resolve()
            putRequest.onerror = () => reject(putRequest.error)
          }
          getRequest.onerror = () => reject(getRequest.error)
        })
      }
    } catch (error) {
      console.warn("IndexedDB save failed, falling back to localStorage:", error)
    }

    // Always save to localStorage as fallback
    try {
      const existing = this.loadFromLocalStorage()
      if (!existing[playerId]) {
        existing[playerId] = {
          playerId,
          trackedInventories: {},
          lastUpdated: new Date().toISOString(),
        }
      }

      existing[playerId].trackedInventories[inventorySnapshot.id] = inventorySnapshot
      existing[playerId].lastUpdated = new Date().toISOString()

      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
      throw error
    }
  }

  async loadTrackedInventories(): Promise<InventoryTrackingStorage> {
    try {
      // Try IndexedDB first
      await this.initDB()
      if (this.db) {
        const transaction = this.db.transaction([STORE_NAME], "readonly")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.getAll()

        const result = await new Promise<InventoryTrackingStorage>((resolve, reject) => {
          request.onsuccess = () => {
            const data: InventoryTrackingStorage = {}
            request.result.forEach((playerData: PlayerInventoryTracking) => {
              // Use the playerId from the object itself
              data[playerData.playerId] = playerData
            })
            resolve(data)
          }
          request.onerror = () => reject(request.error)
        })

        if (Object.keys(result).length > 0) {
          return result
        }
      }
    } catch (error) {
      console.warn("IndexedDB load failed, falling back to localStorage:", error)
    }

    // Fallback to localStorage
    return this.loadFromLocalStorage()
  }

  async getPlayerTrackedInventories(playerId: string): Promise<TrackedInventorySnapshot[]> {
    const allData = await this.loadTrackedInventories()
    const playerData = allData[playerId]

    if (!playerData) {
      return []
    }

    return Object.values(playerData.trackedInventories)
  }

  async removeTrackedInventory(playerId: string, inventoryId: string): Promise<void> {
    try {
      // Try IndexedDB first
      await this.initDB()
      if (this.db) {
        const transaction = this.db.transaction([STORE_NAME], "readwrite")
        const store = transaction.objectStore(STORE_NAME)

        const getRequest = store.get(playerId)
        await new Promise<void>((resolve, reject) => {
          getRequest.onsuccess = () => {
            const existing: PlayerInventoryTracking = getRequest.result
            if (existing) {
              delete existing.trackedInventories[inventoryId]
              existing.lastUpdated = new Date().toISOString()

              const putRequest = store.put(existing)
              putRequest.onsuccess = () => resolve()
              putRequest.onerror = () => reject(putRequest.error)
            } else {
              resolve()
            }
          }
          getRequest.onerror = () => reject(getRequest.error)
        })
      }
    } catch (error) {
      console.warn("IndexedDB remove failed, falling back to localStorage:", error)
    }

    // Always update localStorage as fallback
    try {
      const existing = this.loadFromLocalStorage()
      if (existing[playerId]) {
        delete existing[playerId].trackedInventories[inventoryId]
        existing[playerId].lastUpdated = new Date().toISOString()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
      }
    } catch (error) {
      console.error("Failed to remove from localStorage:", error)
      throw error
    }
  }

  async clearPlayerTracking(playerId: string): Promise<void> {
    try {
      // Try IndexedDB first
      await this.initDB()
      if (this.db) {
        const transaction = this.db.transaction([STORE_NAME], "readwrite")
        const store = transaction.objectStore(STORE_NAME)
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = store.delete(playerId)
          deleteRequest.onsuccess = () => resolve()
          deleteRequest.onerror = () => reject(deleteRequest.error)
        })
      }
    } catch (error) {
      console.warn("IndexedDB clear failed, falling back to localStorage:", error)
    }

    // Always update localStorage as fallback
    try {
      const existing = this.loadFromLocalStorage()
      delete existing[playerId]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    } catch (error) {
      console.error("Failed to clear from localStorage:", error)
      throw error
    }
  }

  async getClaimTrackedInventories(
    playerId: string,
    claimId: string
  ): Promise<TrackedInventorySnapshot[]> {
    const allSnapshots = await this.getPlayerTrackedInventories(playerId)
    return allSnapshots.filter((snapshot) => snapshot.claimId === claimId)
  }

  async clearClaimTracking(playerId: string, claimId: string): Promise<void> {
    const claimSnapshots = await this.getClaimTrackedInventories(playerId, claimId)

    for (const snapshot of claimSnapshots) {
      await this.removeTrackedInventory(playerId, snapshot.id)
    }
  }

  async getTrackingSummaryBySource(playerId: string): Promise<{
    total: number
    bySource: Record<string, number>
    byClaim: Record<string, number>
  }> {
    const allSnapshots = await this.getPlayerTrackedInventories(playerId)

    const summary = {
      total: allSnapshots.length,
      bySource: {} as Record<string, number>,
      byClaim: {} as Record<string, number>,
    }

    for (const snapshot of allSnapshots) {
      // Count by source
      summary.bySource[snapshot.source] = (summary.bySource[snapshot.source] || 0) + 1

      // Count by claim (only for claim inventories)
      if (snapshot.source === "claim" && snapshot.claimId) {
        summary.byClaim[snapshot.claimId] = (summary.byClaim[snapshot.claimId] || 0) + 1
      }
    }

    return summary
  }

  async clearOldSnapshots(maxAgeHours: number = 168): Promise<void> {
    // 7 days default
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)
    const allData = await this.loadTrackedInventories()

    for (const playerId in allData) {
      const playerData = allData[playerId]
      const inventoriesToRemove: string[] = []

      for (const [inventoryId, snapshot] of Object.entries(playerData.trackedInventories)) {
        const snapshotTime = new Date(snapshot.snapshotTimestamp)
        if (snapshotTime < cutoffTime) {
          inventoriesToRemove.push(inventoryId)
        }
      }

      for (const inventoryId of inventoriesToRemove) {
        await this.removeTrackedInventory(playerId, inventoryId)
      }
    }
  }

  private loadFromLocalStorage(): InventoryTrackingStorage {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch (error) {
      console.warn("Failed to load from localStorage:", error)
      return {}
    }
  }
}

export const inventoryStorageService = new InventoryStorageService()
