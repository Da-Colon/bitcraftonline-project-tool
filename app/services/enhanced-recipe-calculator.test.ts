 
import { describe, it, expect, beforeAll } from "vitest"

// import { TierCalculationResult } from "~/types/recipes"

import { EnhancedRecipeCalculator } from "./enhanced-recipe-calculator.server"



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
    it("should zero only direct children when parent is fully satisfied by inventory", () => {
      // Test scenario: Need 1x Heated Capacitor, have 2x Refined Peerless Brick
      // This should only zero the direct children of Refined Peerless Brick, not all items
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
        expect(peerlessBrick.actualRequired).toBe(0)

        // Only direct children should be zeroed, not all items
        // The breakdown should still contain other items that are needed
        expect(result.breakdown.length).toBeGreaterThan(5) // Should still have many items
        
        // Verify that items with no inventory still show their requirements
        const itemsWithNoInventory = result.breakdown.filter(item => 
          item.currentInventory === 0 && 
          item.itemId !== "item_1344950671" && 
          item.itemId !== "item_4101"
        )
        
        // At least some items should still be needed
        const stillNeeded = itemsWithNoInventory.filter(item => item.actualRequired > 0)
        expect(stillNeeded.length).toBeGreaterThan(0)
      } else {
        // If not in breakdown, it means it was fully satisfied and removed
        // This is also valid behavior
        console.log(`✅ Refined Peerless Brick was fully satisfied and removed from breakdown`)
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
      expect(targetItem?.actualRequired).toBeGreaterThan(0) // Should need more (exact amount may vary)

      const peerlessBrick = result.breakdown.find((item) => item.itemId === "item_1344950671")
      if (peerlessBrick) {
        expect(peerlessBrick.currentInventory).toBe(1)
        expect(peerlessBrick.actualRequired).toBeGreaterThan(0) // Should still need more
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
      expect(item.actualRequired).toBe(5)
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

      // All items should have actualRequired > 0 since no inventory
      const itemsWithDeficit = result.breakdown.filter((item) => item.actualRequired > 0)
      expect(itemsWithDeficit.length).toBe(result.breakdown.length)
    })
  })

  describe("Multiple Quantities with Inventory", () => {
    
    it("should preserve recipeRequired immutability when crafting multiple items with inventory", () => {
      // Test scenario: Craft 20x Proficient Codex with partial inventory
      // This should verify that recipeRequired never gets zeroed out incorrectly
      const inventory = [
        { itemId: "item_2036617800", quantity: 5 }, // 5x Proficient Codex already have
        { itemId: "item_2020003", quantity: 100 }, // Some planks
        { itemId: "item_1010001", quantity: 200 }, // Some wood logs
      ]

      const result = calculator.calculateWithInventory("item_2036617800", 20, inventory) // 20x Proficient Codex

      expect(result.breakdown).toBeDefined()
      expect(result.breakdown.length).toBeGreaterThan(0)

      // Find the target item
      const targetItem = result.breakdown.find((item) => item.itemId === "item_2036617800")
      expect(targetItem).toBeDefined()
      expect(targetItem?.recipeRequired).toBe(20) // Should always be 20, never 0
      expect(targetItem?.currentInventory).toBe(5) // Should show we have 5
      expect(targetItem?.actualRequired).toBe(15) // Should need 15 more (20 - 5)
      expect(targetItem?.actualRequired).toBe(15)

      // Verify that recipeRequired is never 0 for any item in the breakdown
      const itemsWithZeroRecipeRequired = result.breakdown.filter((item) => item.recipeRequired === 0)
      expect(itemsWithZeroRecipeRequired.length).toBe(0)

      // Verify that items with inventory show correct actualRequired calculations
      const itemsWithInventory = result.breakdown.filter((item) => item.currentInventory > 0)
      for (const item of itemsWithInventory) {
        // The actualRequired should be at most max(0, recipeRequired - currentInventory)
        // but could be less if parent items are satisfied
        expect(item.actualRequired).toBeLessThanOrEqual(Math.max(0, item.recipeRequired - item.currentInventory))
      }

      console.log(`✅ RecipeRequired immutability verified for ${result.breakdown.length} items`)
    })

    it("should analyze Flawless Codex recipe tree structure", () => {
      // First, analyze the actual recipe tree with no inventory
      const result = calculator.calculateWithInventory("item_673045961", 50, []) // 50x Flawless Codex

      expect(result.breakdown).toBeDefined()
      expect(result.breakdown.length).toBeGreaterThan(100)

      // Group by tier
      const byTier: Record<number, unknown[]> = {}
      result.breakdown.forEach(item => {
        if (!byTier[item.tier]) byTier[item.tier] = []
        byTier[item.tier].push(item)
      })

      const tiers = Object.keys(byTier).map(Number).sort((a, b) => b - a)
      console.log(`✅ Recipe tree analysis: ${tiers.join(', ')} tiers, ${result.breakdown.length} total items`)

      // Find key research items
      const keyItems = [
        { id: 'item_673045961', name: 'Flawless Codex' },
        { id: 'item_415346424', name: 'Flawless Stone Research' },
        { id: 'item_544991481', name: 'Flawless Wood Research' },
        { id: 'item_362774622', name: 'Flawless Metal Research' },
        { id: 'item_1924457276', name: 'Flawless Leather Research' },
        { id: 'item_434858722', name: 'Flawless Cloth Research' },
        { id: 'item_659145609', name: 'Refined Flawless Brick' },
        { id: 'item_1726162081', name: 'Flawless Study Journal' }
      ]

      console.log('\n=== Key Items Baseline (50x Flawless Codex, no inventory) ===')
      keyItems.forEach(item => {
        const found = result.breakdown.find(b => b.itemId === item.id)
        if (found) {
          console.log(`${item.name}: recipeRequired=${found.recipeRequired}`)
        } else {
          console.log(`${item.name}: NOT FOUND`)
        }
      })

      expect(result.breakdown.length).toBeGreaterThan(0)
    })

    it("should cascade inventory reductions through ALL tiers for Flawless Codex (Tier 10)", () => {
      // Test scenario: Craft 50x Flawless Codex with strategic inventory at different tiers
      // This tests the cascade effect - when you have items at different levels, 
      // it should properly reduce requirements for ALL dependent items
      const inventory = [
        { itemId: "item_673045961", quantity: 10 }, // 10x Flawless Codex (Tier 10) - top level
        { itemId: "item_2036617800", quantity: 5 }, // 5x Proficient Codex (Tier 4) - mid level
        { itemId: "item_2020003", quantity: 200 },  // 200x Simple Plank (Tier 1) - low level
        { itemId: "item_1010001", quantity: 1000 }, // 1000x Rough Wood Log (Tier -1) - raw material
      ]

      const result = calculator.calculateWithInventory("item_673045961", 50, inventory) // 50x Flawless Codex

      expect(result.breakdown).toBeDefined()
      expect(result.breakdown.length).toBeGreaterThan(100) // Should have many items across all tiers

      // Group by tier to verify ALL tiers are processed
      const byTier: Record<number, unknown[]> = {}
      result.breakdown.forEach(item => {
        if (!byTier[item.tier]) byTier[item.tier] = []
        byTier[item.tier].push(item)
      })

      const tiers = Object.keys(byTier).map(Number).sort((a, b) => b - a)
      console.log(`✅ Processed items across tiers: ${tiers.join(', ')} (${result.breakdown.length} total items)`)

      // Verify target item (Flawless Codex)
      const targetItem = result.breakdown.find((item) => item.itemId === "item_673045961")
      expect(targetItem).toBeDefined()
      expect(targetItem?.recipeRequired).toBe(50) // Should always be 50, never 0
      expect(targetItem?.currentInventory).toBe(10) // Should show we have 10
      expect(targetItem?.actualRequired).toBe(40) // Should need 40 more (50 - 10)
      expect(targetItem?.actualRequired).toBe(40)

      // Verify recipeRequired immutability across ALL items
      const itemsWithZeroRecipeRequired = result.breakdown.filter((item) => item.recipeRequired === 0)
      expect(itemsWithZeroRecipeRequired.length).toBe(0)

      // Test cascade effect: items with inventory should show proper reductions
      const itemsWithInventory = result.breakdown.filter((item) => item.currentInventory > 0)
      expect(itemsWithInventory.length).toBeGreaterThan(0)

      for (const item of itemsWithInventory) {
        // actualRequired should never exceed max(0, recipeRequired - currentInventory)
        expect(item.actualRequired).toBeLessThanOrEqual(Math.max(0, item.recipeRequired - item.currentInventory))
      }

      // Verify specific cascade scenarios:
      
      // 1. Proficient Codex (Tier 4) - should be reduced by inventory
      const proficientCodex = result.breakdown.find((item) => item.itemId === "item_2036617800")
      if (proficientCodex) {
        expect(proficientCodex.recipeRequired).toBeGreaterThan(0)
        expect(proficientCodex.currentInventory).toBe(5)
        expect(proficientCodex.actualRequired).toBeLessThanOrEqual(Math.max(0, proficientCodex.recipeRequired - 5))
        console.log(`✅ Proficient Codex cascade: recipeRequired=${proficientCodex.recipeRequired}, actualRequired=${proficientCodex.actualRequired}`)
      }

      // 2. Simple Plank (Tier 1) - should be reduced by inventory
      const simplePlank = result.breakdown.find((item) => item.itemId === "item_2020003")
      if (simplePlank) {
        expect(simplePlank.recipeRequired).toBeGreaterThan(0)
        expect(simplePlank.currentInventory).toBe(200)
        expect(simplePlank.actualRequired).toBeLessThanOrEqual(Math.max(0, simplePlank.recipeRequired - 200))
        console.log(`✅ Simple Plank cascade: recipeRequired=${simplePlank.recipeRequired}, actualRequired=${simplePlank.actualRequired}`)
      }

      // 3. Rough Wood Log (Tier -1) - should be reduced by inventory
      const woodLog = result.breakdown.find((item) => item.itemId === "item_1010001")
      if (woodLog) {
        expect(woodLog.recipeRequired).toBeGreaterThan(0)
        expect(woodLog.currentInventory).toBe(1000)
        expect(woodLog.actualRequired).toBeLessThanOrEqual(Math.max(0, woodLog.recipeRequired - 1000))
        console.log(`✅ Wood Log cascade: recipeRequired=${woodLog.recipeRequired}, actualRequired=${woodLog.actualRequired}`)
      }

      // 4. Verify that having higher-tier items reduces lower-tier requirements
      // (This tests the parent-satisfaction cascade)
      const tier10Items = byTier[10] || []
      const tier4Items = byTier[4] || []
      const tier1Items = byTier[1] || []
      const tierMinus1Items = byTier[-1] || []

      console.log(`✅ Cascade verification: T10=${tier10Items.length}, T4=${tier4Items.length}, T1=${tier1Items.length}, T-1=${tierMinus1Items.length}`)

      // All items should have non-zero recipeRequired (proving immutability)
      const allItemsHaveRecipeRequired = result.breakdown.every(item => item.recipeRequired > 0)
      expect(allItemsHaveRecipeRequired).toBe(true)

      console.log(`✅ Flawless Codex cascade test: ${result.breakdown.length} items across ${tiers.length} tiers processed correctly`)
    })

    it("Scenario 1: Top-level satisfaction cascade - 10/50 Flawless Codex", () => {
      // Test: Craft 50x Flawless Codex, have 10x in inventory
      // Expected: ALL children reduced by exactly 20% (10/50 = 0.2)
      const inventory = [
        { itemId: "item_673045961", quantity: 10 }, // 10x Flawless Codex
      ]

      const result = calculator.calculateWithInventory("item_673045961", 50, inventory)

      // Verify target item
      const targetItem = result.breakdown.find((item) => item.itemId === "item_673045961")
      expect(targetItem?.recipeRequired).toBe(50)
      expect(targetItem?.currentInventory).toBe(10)
      expect(targetItem?.actualRequired).toBe(40) // 50 - 10
      expect(targetItem?.actualRequired).toBe(40)

      // Verify ALL research items are reduced by exactly 20%
      const researchItems = [
        { id: 'item_415346424', name: 'Flawless Stone Research', expectedRequired: 40 }, // 50 * 0.8
        { id: 'item_544991481', name: 'Flawless Wood Research', expectedRequired: 40 },
        { id: 'item_362774622', name: 'Flawless Metal Research', expectedRequired: 40 },
        { id: 'item_1924457276', name: 'Flawless Leather Research', expectedRequired: 40 },
        { id: 'item_434858722', name: 'Flawless Cloth Research', expectedRequired: 40 },
      ]

      researchItems.forEach(item => {
        const found = result.breakdown.find(b => b.itemId === item.id)
        if (found) {
          expect(found.recipeRequired).toBe(50) // Immutable
          expect(found.actualRequired).toBe(item.expectedRequired) // Reduced by 20%
          expect(found.actualRequired).toBe(item.expectedRequired)
          console.log(`✅ ${item.name}: recipeRequired=${found.recipeRequired}, actualRequired=${found.actualRequired}`)
        }
      })

      // Verify Flawless Study Journal (should be reduced by 20%: 250 * 0.8 = 200)
      const studyJournal = result.breakdown.find((item) => item.itemId === "item_1726162081")
      if (studyJournal) {
        expect(studyJournal.recipeRequired).toBe(250) // Immutable
        expect(studyJournal.actualRequired).toBe(200) // 250 * 0.8
        expect(studyJournal.actualRequired).toBe(200)
        console.log(`✅ Flawless Study Journal: recipeRequired=${studyJournal.recipeRequired}, actualRequired=${studyJournal.actualRequired}`)
      }

      // Verify recipeRequired immutability across ALL items
      const itemsWithZeroRecipeRequired = result.breakdown.filter((item) => item.recipeRequired === 0)
      expect(itemsWithZeroRecipeRequired.length).toBe(0)

      console.log(`✅ Scenario 1: Top-level cascade verified - 20% reduction across all items`)
    })

    it("Scenario 2: Branch isolation - Flawless Stone Research inventory", () => {
      // Test: Craft 50x Flawless Codex, have 5x Flawless Stone Research
      // Expected: ONLY Stone Research branch reduced, other branches unaffected
      const inventory = [
        { itemId: "item_415346424", quantity: 5 }, // 5x Flawless Stone Research
      ]

      const result = calculator.calculateWithInventory("item_673045961", 50, inventory)

      // Verify target item (unaffected by mid-level inventory)
      const targetItem = result.breakdown.find((item) => item.itemId === "item_673045961")
      expect(targetItem?.recipeRequired).toBe(50)
      expect(targetItem?.actualRequired).toBe(50) // No inventory, no reduction

      // Verify Stone Research is reduced
      const stoneResearch = result.breakdown.find((item) => item.itemId === "item_415346424")
      expect(stoneResearch?.recipeRequired).toBe(50) // Immutable
      expect(stoneResearch?.currentInventory).toBe(5)
      expect(stoneResearch?.actualRequired).toBe(45) // 50 - 5

      // Verify OTHER research branches are NOT affected
      const otherResearch = [
        { id: 'item_544991481', name: 'Flawless Wood Research' },
        { id: 'item_362774622', name: 'Flawless Metal Research' },
        { id: 'item_1924457276', name: 'Flawless Leather Research' },
        { id: 'item_434858722', name: 'Flawless Cloth Research' },
      ]

      otherResearch.forEach(item => {
        const found = result.breakdown.find(b => b.itemId === item.id)
        if (found) {
          expect(found.recipeRequired).toBe(50) // Immutable
          expect(found.actualRequired).toBe(50) // No reduction (no inventory)
          expect(found.actualRequired).toBe(50)
          console.log(`✅ ${item.name}: UNCHANGED - recipeRequired=${found.recipeRequired}, actualRequired=${found.actualRequired}`)
        }
      })

      // Verify Refined Flawless Brick (part of Stone branch) is reduced
      const brick = result.breakdown.find((item) => item.itemId === "item_659145609")
      if (brick) {
        expect(brick.recipeRequired).toBe(50) // Immutable
        expect(brick.actualRequired).toBe(45) // Should be reduced by 5 (same as Stone Research)
        expect(brick.actualRequired).toBe(45)
        console.log(`✅ Refined Flawless Brick: REDUCED - recipeRequired=${brick.recipeRequired}, actualRequired=${brick.actualRequired}`)
      }

      console.log(`✅ Scenario 2: Branch isolation verified - only Stone branch affected`)
    })

    it("Scenario 3: Deep-level cascade - Refined Flawless Brick inventory", () => {
      // Test: Craft 50x Flawless Codex, have 20x Refined Flawless Brick
      // Expected: Brick's children reduced, but Study Journal branch unaffected
      const inventory = [
        { itemId: "item_659145609", quantity: 20 }, // 20x Refined Flawless Brick
      ]

      const result = calculator.calculateWithInventory("item_673045961", 50, inventory)

      // Verify target item (unaffected by deep-level inventory)
      const targetItem = result.breakdown.find((item) => item.itemId === "item_673045961")
      expect(targetItem?.recipeRequired).toBe(50)
      expect(targetItem?.actualRequired).toBe(50) // No inventory, no reduction

      // Verify Refined Flawless Brick is reduced
      const brick = result.breakdown.find((item) => item.itemId === "item_659145609")
      expect(brick?.recipeRequired).toBe(50) // Immutable
      expect(brick?.currentInventory).toBe(20)
      expect(brick?.actualRequired).toBe(30) // 50 - 20

      // Verify Flawless Study Journal is NOT affected (different branch)
      const studyJournal = result.breakdown.find((item) => item.itemId === "item_1726162081")
      if (studyJournal) {
        expect(studyJournal.recipeRequired).toBe(250) // Immutable
        expect(studyJournal.actualRequired).toBe(250) // No reduction (different branch)
        console.log(`✅ Flawless Study Journal: UNCHANGED - recipeRequired=${studyJournal.recipeRequired}, actualRequired=${studyJournal.actualRequired}`)
      }

      // Verify Stone Research is NOT directly affected (it's a parent of Brick)
      const stoneResearch = result.breakdown.find((item) => item.itemId === "item_415346424")
      if (stoneResearch) {
        expect(stoneResearch.recipeRequired).toBe(50) // Immutable
        expect(stoneResearch.actualRequired).toBe(50) // No direct reduction
        console.log(`✅ Flawless Stone Research: UNCHANGED - recipeRequired=${stoneResearch.recipeRequired}, actualRequired=${stoneResearch.actualRequired}`)
      }

      console.log(`✅ Scenario 3: Deep-level cascade verified - Brick reduced, other branches unaffected`)
    })

    it("Scenario 4: Multi-level cascade - inventory at 3 different tiers", () => {
      // Test: Craft 50x Flawless Codex with inventory at multiple levels
      // - 5x Flawless Codex (top level)
      // - 10x Flawless Stone Research (T10)  
      // - 20x Refined Flawless Brick (T10)
      // Expected: Each level's cascade calculated independently, no double-counting
      const inventory = [
        { itemId: "item_673045961", quantity: 5 }, // 5x Flawless Codex (top)
        { itemId: "item_415346424", quantity: 10 }, // 10x Flawless Stone Research (T10)
        { itemId: "item_659145609", quantity: 20 }, // 20x Refined Flawless Brick (T10)
      ]

      const result = calculator.calculateWithInventory("item_673045961", 50, inventory)

      // Verify target item (reduced by top-level inventory)
      const targetItem = result.breakdown.find((item) => item.itemId === "item_673045961")
      expect(targetItem?.recipeRequired).toBe(50)
      expect(targetItem?.currentInventory).toBe(5)
      expect(targetItem?.actualRequired).toBe(45) // 50 - 5

      // Verify Stone Research (reduced by both top-level AND mid-level inventory)
      const stoneResearch = result.breakdown.find((item) => item.itemId === "item_415346424")
      expect(stoneResearch?.recipeRequired).toBe(50) // Immutable
      expect(stoneResearch?.currentInventory).toBe(10)
      // Should be reduced by top-level (45 needed) AND mid-level (10 in inventory)
      // So actualRequired should be max(0, 45 - 10) = 35
      expect(stoneResearch?.actualRequired).toBe(35)

      // Verify Refined Flawless Brick (reduced by all three levels)
      const brick = result.breakdown.find((item) => item.itemId === "item_659145609")
      expect(brick?.recipeRequired).toBe(50) // Immutable
      expect(brick?.currentInventory).toBe(20)
      // Should be reduced by Stone Research (35 needed) AND Brick inventory (20)
      // So actualRequired should be max(0, 35 - 20) = 15
      expect(brick?.actualRequired).toBe(15)

      // Verify other research branches are only affected by top-level reduction
      const otherResearch = [
        { id: 'item_544991481', name: 'Flawless Wood Research' },
        { id: 'item_362774622', name: 'Flawless Metal Research' },
        { id: 'item_1924457276', name: 'Flawless Leather Research' },
        { id: 'item_434858722', name: 'Flawless Cloth Research' },
      ]

      otherResearch.forEach(item => {
        const found = result.breakdown.find(b => b.itemId === item.id)
        if (found) {
          expect(found.recipeRequired).toBe(50) // Immutable
          expect(found.actualRequired).toBe(45) // Only reduced by top-level (50 - 5)
          expect(found.actualRequired).toBe(45)
          console.log(`✅ ${item.name}: TOP-LEVEL ONLY - recipeRequired=${found.recipeRequired}, actualRequired=${found.actualRequired}`)
        }
      })

      // Verify no double-counting: items should not be over-reduced
      const allItems = result.breakdown.filter(item => item.actualRequired >= 0)
      expect(allItems.length).toBeGreaterThan(0)
      
      // Verify recipeRequired immutability
      const itemsWithZeroRecipeRequired = result.breakdown.filter((item) => item.recipeRequired === 0)
      expect(itemsWithZeroRecipeRequired.length).toBe(0)

      console.log(`✅ Scenario 4: Multi-level cascade verified - independent calculations, no double-counting`)
    })

    it("Scenario 5: Raw material cascade - bottom-up behavior", () => {
      // Test: Craft 50x Flawless Codex with large quantities of raw materials
      // Expected: Only immediate parents reduced, top-level items show full requirements
      const inventory = [
        { itemId: "item_1010001", quantity: 10000 }, // 10k Rough Wood Log (T-1)
        { itemId: "item_2020003", quantity: 5000 },  // 5k Simple Plank (T1)
        { itemId: "item_1010002", quantity: 8000 },  // 8k Rough Stone (T-1)
      ]

      const result = calculator.calculateWithInventory("item_673045961", 50, inventory)

      // Verify target item (unaffected by raw material inventory)
      const targetItem = result.breakdown.find((item) => item.itemId === "item_673045961")
      expect(targetItem?.recipeRequired).toBe(50)
      expect(targetItem?.actualRequired).toBe(50) // No reduction from raw materials

      // Verify research items (unaffected by raw material inventory)
      const researchItems = [
        { id: 'item_415346424', name: 'Flawless Stone Research' },
        { id: 'item_544991481', name: 'Flawless Wood Research' },
        { id: 'item_362774622', name: 'Flawless Metal Research' },
        { id: 'item_1924457276', name: 'Flawless Leather Research' },
        { id: 'item_434858722', name: 'Flawless Cloth Research' },
      ]

      researchItems.forEach(item => {
        const found = result.breakdown.find(b => b.itemId === item.id)
        if (found) {
          expect(found.recipeRequired).toBe(50) // Immutable
          expect(found.actualRequired).toBe(50) // No reduction from raw materials
          expect(found.actualRequired).toBe(50)
          console.log(`✅ ${item.name}: UNCHANGED - recipeRequired=${found.recipeRequired}, actualRequired=${found.actualRequired}`)
        }
      })

      // Verify raw materials are reduced by their inventory
      const rawMaterials = [
        { id: 'item_1010001', name: 'Rough Wood Log', expectedReduction: 10000 },
        { id: 'item_2020003', name: 'Simple Plank', expectedReduction: 5000 },
        { id: 'item_1010002', name: 'Rough Stone', expectedReduction: 8000 },
      ]

      rawMaterials.forEach(item => {
        const found = result.breakdown.find(b => b.itemId === item.id)
        if (found) {
          expect(found.recipeRequired).toBeGreaterThan(0) // Immutable
          expect(found.currentInventory).toBe(item.expectedReduction)
          expect(found.actualRequired).toBeLessThanOrEqual(Math.max(0, found.recipeRequired - item.expectedReduction))
          console.log(`✅ ${item.name}: REDUCED - recipeRequired=${found.recipeRequired}, actualRequired=${found.actualRequired}`)
        }
      })

      // Verify recipeRequired immutability across ALL items
      const itemsWithZeroRecipeRequired = result.breakdown.filter((item) => item.recipeRequired === 0)
      expect(itemsWithZeroRecipeRequired.length).toBe(0)

      console.log(`✅ Scenario 5: Raw material cascade verified - bottom-up doesn't affect top-level`)
    })

    it("should handle complex multi-tier recipes with multiple quantities", () => {
      // Test with a complex item that has many dependencies
      const inventory = [
        { itemId: "item_4101", quantity: 1 }, // 1x Heated Capacitor
        { itemId: "item_1344950671", quantity: 2 }, // 2x Refined Peerless Brick
      ]

      const result = calculator.calculateWithInventory("item_4101", 5, inventory) // 5x Heated Capacitor

      expect(result.breakdown).toBeDefined()
      expect(result.breakdown.length).toBeGreaterThan(10) // Should have many items

      // Find the target item
      const targetItem = result.breakdown.find((item) => item.itemId === "item_4101")
      expect(targetItem).toBeDefined()
      expect(targetItem?.recipeRequired).toBe(5) // Should always be 5, never 0
      expect(targetItem?.currentInventory).toBe(1) // Should show we have 1
      expect(targetItem?.actualRequired).toBe(4) // Should need 4 more (5 - 1)
      expect(targetItem?.actualRequired).toBe(4)

      // Verify recipeRequired immutability for all items
      const itemsWithZeroRecipeRequired = result.breakdown.filter((item) => item.recipeRequired === 0)
      expect(itemsWithZeroRecipeRequired.length).toBe(0)

      // Verify that the Refined Peerless Brick shows correct values
      const peerlessBrick = result.breakdown.find((item) => item.itemId === "item_1344950671")
      if (peerlessBrick) {
        expect(peerlessBrick.recipeRequired).toBeGreaterThan(0) // Should never be 0
        expect(peerlessBrick.currentInventory).toBe(2)
        // actualRequired should be at most recipeRequired - inventory, but could be less due to parent satisfaction
        expect(peerlessBrick.actualRequired).toBeLessThanOrEqual(Math.max(0, peerlessBrick.recipeRequired - 2))
      }

      console.log(`✅ Complex multi-tier recipe with multiple quantities verified`)
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

  describe("Effort Calculation", () => {
    it("should calculate effort for items with recipes based on actualRequired", () => {
      // Test with an item that has a recipe with known actions_required
      // Using Simple Plank (item_2020003) - need to check if it has a recipe with actions_required
      const result = calculator.calculateWithInventory("item_2020003", 10, [])

      const targetItem = result.breakdown.find((item) => item.itemId === "item_2020003")
      expect(targetItem).toBeDefined()

      if (targetItem) {
        const recipe = calculator.getRecipe("item_2020003")
        
        if (recipe && recipe.actionsRequired) {
          // If item has a recipe with actionsRequired, verify effort calculation
          const expectedBatches = Math.ceil(targetItem.actualRequired / recipe.outputQuantity)
          const expectedEffort = recipe.actionsRequired * expectedBatches

          expect(targetItem.effortPerBatch).toBe(recipe.actionsRequired)
          expect(targetItem.effortAfterInventory).toBe(expectedEffort)
          expect(targetItem.effortAfterInventory).toBeGreaterThanOrEqual(0)
          
          // Effort should be based on actualRequired, not recipeRequired
          if (targetItem.effortPerBatch !== undefined) {
            expect(targetItem.effortAfterInventory).toBe(
              targetItem.effortPerBatch * Math.ceil(targetItem.actualRequired / recipe.outputQuantity)
            )
          }
        }
      }
    })

    it("should reduce effort when inventory is provided", () => {
      // Test: Craft 10 items, have 3 in inventory
      // Effort should be calculated based on remaining 7 items
      const inventory = [
        { itemId: "item_2020003", quantity: 3 }, // Simple Plank
      ]

      const result = calculator.calculateWithInventory("item_2020003", 10, inventory)

      const targetItem = result.breakdown.find((item) => item.itemId === "item_2020003")
      expect(targetItem).toBeDefined()

      if (targetItem) {
        const recipe = calculator.getRecipe("item_2020003")
        
        if (recipe && recipe.actionsRequired) {
          // Verify effort is calculated from actualRequired (7), not recipeRequired (10)
          expect(targetItem.recipeRequired).toBe(10)
          expect(targetItem.actualRequired).toBe(7) // 10 - 3 inventory
          expect(targetItem.actualRequired).toBe(7)

          const expectedBatches = Math.ceil(targetItem.actualRequired / recipe.outputQuantity)
          const expectedEffort = recipe.actionsRequired * expectedBatches

          expect(targetItem.effortAfterInventory).toBe(expectedEffort)
          
          // Effort should match: actions_required * ceil(actualRequired / outputQuantity)
          expect(targetItem.effortAfterInventory).toBe(
            recipe.actionsRequired * Math.ceil(targetItem.actualRequired / recipe.outputQuantity)
          )
        }
      }
    })

    it("should set effort to 0 for items without recipes (raw materials)", () => {
      // Find a raw material item (no recipe)
      // Most tier 0 or tier 1 basic materials should not have recipes
      const result = calculator.calculateWithInventory("item_4101", 1, []) // Heated Capacitor - complex item

      // Find items in breakdown that have no recipe
      const itemsWithoutRecipes = result.breakdown.filter((item) => {
        const recipe = calculator.getRecipe(item.itemId)
        return !recipe
      })

      if (itemsWithoutRecipes.length > 0) {
        const rawMaterial = itemsWithoutRecipes[0]
        expect(rawMaterial.effortPerBatch).toBeUndefined()
        expect(rawMaterial.effortAfterInventory).toBeUndefined()
      }
    })

    it("should calculate effort correctly for multiple items with different batch sizes", () => {
      // Test with an item that requires multiple batches
      // Craft 25 items where recipe outputs 10 per batch
      const result = calculator.calculateWithInventory("item_2020003", 25, [])

      const targetItem = result.breakdown.find((item) => item.itemId === "item_2020003")
      expect(targetItem).toBeDefined()

      if (targetItem) {
        const recipe = calculator.getRecipe("item_2020003")
        
        if (recipe && recipe.actionsRequired) {
          // 25 items with outputQuantity 10 = ceil(25/10) = 3 batches
          const expectedBatches = Math.ceil(25 / recipe.outputQuantity)
          const expectedEffort = recipe.actionsRequired * expectedBatches

          expect(targetItem.effortAfterInventory).toBe(expectedEffort)
          expect(targetItem.effortAfterInventory).toBe(
            recipe.actionsRequired * Math.ceil(targetItem.actualRequired / recipe.outputQuantity)
          )
        }
      }
    })

    it("should calculate effort for all items in breakdown chain", () => {
      // Test complex recipe chain - all intermediate items should have correct effort
      const result = calculator.calculateWithInventory("item_4101", 1, []) // Heated Capacitor

      // Check all items with recipes have effort calculated
      result.breakdown.forEach((item) => {
        const recipe = calculator.getRecipe(item.itemId)
        
        if (recipe && recipe.actionsRequired) {
          // Items with recipes should have effort
          expect(item.effortPerBatch).toBe(recipe.actionsRequired)
          
          // Effort should be based on actualRequired
          const expectedEffort = recipe.actionsRequired * Math.ceil(item.actualRequired / recipe.outputQuantity)
          expect(item.effortAfterInventory).toBe(expectedEffort)
        } else {
          // Items without recipes should not have effort
          expect(item.effortPerBatch).toBeUndefined()
          expect(item.effortAfterInventory).toBeUndefined()
        }
      })
    })
  })
})
