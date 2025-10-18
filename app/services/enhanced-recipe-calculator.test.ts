import { describe, it, expect, beforeAll } from "vitest"
import { EnhancedRecipeCalculator } from "./enhanced-recipe-calculator.server"
import { readFileSync } from "fs"
import { join } from "path"

describe("EnhancedRecipeCalculator", () => {
  let calculator: EnhancedRecipeCalculator

  beforeAll(() => {
    calculator = new EnhancedRecipeCalculator()
  })

  describe("Basic Recipe Calculation", () => {
    it("should calculate recipe requirements without inventory", () => {
      // Test with a simple item that has a recipe
      const result = calculator.calculateWithInventory("item_2020003", 1, []) // Simple Plank

      expect(result.breakdown).toBeDefined()
      expect(result.breakdown.length).toBeGreaterThan(0)

      const targetItem = result.breakdown.find((item) => item.itemId === "item_2020003")
      expect(targetItem).toBeDefined()
      expect(targetItem?.recipeRequired).toBe(1)
    })

    it("should handle complex recipe chains", () => {
      // Test with Heated Capacitor (most complex T6 item)
      const result = calculator.calculateWithInventory("item_4101", 1, []) // Heated Capacitor

      expect(result.breakdown).toBeDefined()
      expect(result.breakdown.length).toBeGreaterThan(10) // Should have many items in breakdown

      const targetItem = result.breakdown.find((item) => item.itemId === "item_4101")
      expect(targetItem).toBeDefined()
      expect(targetItem?.recipeRequired).toBe(1)
    })
  })

  describe("Bug Fix: Fully Satisfied Parent Zeros Children", () => {
    it("should zero all children when parent is fully satisfied by inventory", () => {
      // Test scenario: Need 1x Heated Capacitor, have 2x Refined Peerless Brick
      // This should zero ALL children across T5, T4, T3, T2, T1, T-1 tiers
      const inventory = [
        { itemId: "item_1344950671", quantity: 2 }, // Refined Peerless Brick
      ]

      const result = calculator.calculateWithInventory("item_4101", 1, inventory) // Heated Capacitor

      expect(result.breakdown).toBeDefined()

      // Find the Refined Peerless Brick in breakdown
      const peerlessBrick = result.breakdown.find((item) => item.itemId === "item_1344950671")

      if (peerlessBrick) {
        // If it's in the breakdown, it should be fully satisfied
        expect(peerlessBrick.currentInventory).toBe(2)
        expect(peerlessBrick.recipeRequired).toBeLessThanOrEqual(2)
        expect(peerlessBrick.deficit).toBe(0)

        // All children should be zeroed
        const childItems = result.breakdown.filter(
          (item) => item.itemId !== "item_1344950671" && item.itemId !== "item_4101"
        )

        const nonZeroedChildren = childItems.filter((item) => item.deficit > 0)
        expect(nonZeroedChildren.length).toBe(0)
        console.log(`✅ Zeroed ${childItems.length} child items when parent was fully satisfied`)
      } else {
        // If not in breakdown, it means it was fully satisfied and removed
        // All remaining items should be zeroed
        const remainingItems = result.breakdown.filter((item) => item.itemId !== "item_4101")
        const nonZeroedItems = remainingItems.filter((item) => item.deficit > 0)
        expect(nonZeroedItems.length).toBe(0)
        console.log(`✅ All ${remainingItems.length} items zeroed when parent was fully satisfied`)
      }
    })

    it("should handle partial satisfaction correctly", () => {
      // Test scenario: Need 2x Heated Capacitor, have 1x Refined Peerless Brick
      const inventory = [
        { itemId: "item_1344950671", quantity: 1 }, // Refined Peerless Brick
      ]

      const result = calculator.calculateWithInventory("item_4101", 2, inventory) // 2x Heated Capacitor

      expect(result.breakdown).toBeDefined()

      const targetItem = result.breakdown.find((item) => item.itemId === "item_4101")
      expect(targetItem).toBeDefined()
      expect(targetItem?.recipeRequired).toBe(2)
      expect(targetItem?.deficit).toBeGreaterThan(0) // Should need more (exact amount may vary)

      const peerlessBrick = result.breakdown.find((item) => item.itemId === "item_1344950671")
      if (peerlessBrick) {
        expect(peerlessBrick.currentInventory).toBe(1)
        expect(peerlessBrick.deficit).toBeGreaterThan(0) // Should still need more
      }
    })
  })

  describe("Edge Cases", () => {
    it("should handle items with no recipes (raw materials)", () => {
      const result = calculator.calculateWithInventory("item_1010001", 5, []) // Rough Wood Log

      expect(result.breakdown).toBeDefined()
      expect(result.breakdown.length).toBe(1)

      const item = result.breakdown[0]
      expect(item.itemId).toBe("item_1010001")
      expect(item.recipeRequired).toBe(5)
      expect(item.deficit).toBe(5)
    })

    it("should handle inventory with different item ID formats", () => {
      // Test with both prefixed and non-prefixed item IDs
      const inventory = [
        { itemId: "item_2020003", quantity: 1 }, // Prefixed
        { itemId: "2020003", quantity: 1 }, // Non-prefixed
      ]

      const result = calculator.calculateWithInventory("item_2020003", 1, inventory)

      expect(result.breakdown).toBeDefined()

      const targetItem = result.breakdown.find((item) => item.itemId === "item_2020003")
      expect(targetItem).toBeDefined()
      expect(targetItem?.currentInventory).toBeGreaterThan(0)
    })

    it("should handle empty inventory gracefully", () => {
      const result = calculator.calculateWithInventory("item_2020003", 1, [])

      expect(result.breakdown).toBeDefined()
      expect(result.breakdown.length).toBeGreaterThan(0)

      // All items should have deficit > 0 since no inventory
      const itemsWithDeficit = result.breakdown.filter((item) => item.deficit > 0)
      expect(itemsWithDeficit.length).toBe(result.breakdown.length)
    })
  })

  describe("Performance", () => {
    it("should handle complex recipes efficiently", () => {
      const startTime = Date.now()

      const result = calculator.calculateWithInventory("item_4101", 1, []) // Heated Capacitor

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(result.breakdown).toBeDefined()
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds

      console.log(`Complex recipe calculation took ${duration}ms`)
    })
  })
})
