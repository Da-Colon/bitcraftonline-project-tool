/**
 * Migration utility for inventory tracking system
 * Migrates from old global tracking format to new per-player format
 */

import { inventoryStorageService } from "~/services/inventory-storage.service"
import type { TrackedInventorySnapshot } from "~/types/inventory-tracking"

const OLD_TRACKING_KEY = "bitcraft-tracked-inventories"
const MIGRATION_COMPLETE_KEY = "bitcraft-inventory-migration-complete"

export async function migrateInventoryTracking(): Promise<void> {
  // Check if migration has already been completed
  if (typeof window === "undefined") return

  const migrationComplete = localStorage.getItem(MIGRATION_COMPLETE_KEY)
  if (migrationComplete === "true") {
    return
  }

  try {
    // Check for old format data
    const oldData = localStorage.getItem(OLD_TRACKING_KEY)
    if (!oldData || oldData === "[]") {
      // No old data to migrate
      localStorage.setItem(MIGRATION_COMPLETE_KEY, "true")
      return
    }

    const oldTrackedIds: string[] = JSON.parse(oldData)
    if (!Array.isArray(oldTrackedIds) || oldTrackedIds.length === 0) {
      localStorage.setItem(MIGRATION_COMPLETE_KEY, "true")
      return
    }

    // Migrating tracked inventories from old format

    // Create a migration snapshot for the current player
    // We'll need to get the current player from the existing system
    const selectedPlayerRaw = localStorage.getItem("selectedPlayer")
    if (!selectedPlayerRaw) {
      // No selected player found during migration, skipping
      localStorage.setItem(MIGRATION_COMPLETE_KEY, "true")
      return
    }

    const selectedPlayer = JSON.parse(selectedPlayerRaw)
    if (!selectedPlayer?.entityId) {
      // Invalid selected player data during migration, skipping
      localStorage.setItem(MIGRATION_COMPLETE_KEY, "true")
      return
    }

    // Create placeholder snapshots for the old tracked inventories
    // These will be replaced with real data when the user next views their inventories
    const migrationSnapshots: TrackedInventorySnapshot[] = oldTrackedIds.map((id) => ({
      id,
      name: `Migrated Inventory ${id}`,
      type: "unknown",
      source: "personal" as const,
      items: [],
      lastUpdated: new Date().toISOString(),
      snapshotTimestamp: new Date().toISOString(),
    }))

    // Save migration snapshots
    for (const snapshot of migrationSnapshots) {
      await inventoryStorageService.saveTrackedInventory(selectedPlayer.entityId, snapshot)
    }

    // Clean up old data
    localStorage.removeItem(OLD_TRACKING_KEY)
    localStorage.setItem(MIGRATION_COMPLETE_KEY, "true")

    // Inventory tracking migration completed successfully
  } catch {
    // Failed to migrate inventory tracking
    // Don't mark as complete if migration failed
  }
}

export function isMigrationNeeded(): boolean {
  if (typeof window === "undefined") return false

  const migrationComplete = localStorage.getItem(MIGRATION_COMPLETE_KEY)
  if (migrationComplete === "true") return false

  const oldData = localStorage.getItem(OLD_TRACKING_KEY)
  return oldData !== null && oldData !== "[]"
}
