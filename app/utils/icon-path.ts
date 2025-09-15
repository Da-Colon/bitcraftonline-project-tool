/**
 * Utility functions for converting GameData icon_asset_name to asset paths
 */

/**
 * Converts a GameData icon_asset_name to a usable asset path
 *
 * Handles various patterns (assets maintain directory structure):
 * - "GeneratedIcons/Items/AncientGear" -> "/assets/GeneratedIcons/Items/AncientGear.png"
 * - "GeneratedIcons/Other/GeneratedIcons/Items/Tools/LuminiteAxe" -> "/assets/GeneratedIcons/Items/Tools/LuminiteAxe.png" (cleans duplicated paths)
 * - "Items/HexCoin[,3,10,500]" -> "/assets/GeneratedIcons/Items/HexCoin.png" (removes brackets, adds GeneratedIcons prefix)
 * - "GeneratedIcons/Cargo/Animals/GrassBird" -> "/assets/GeneratedIcons/Cargo/GrassBird.png"
 * - "\\u0018" -> null (invalid/empty)
 * - "" -> null (empty)
 * - undefined/null -> null
 */
export function convertIconAssetNameToPath(
  iconAssetName: string | undefined | null
): string | null {
  // Handle null, undefined, or empty strings
  if (!iconAssetName || iconAssetName.trim() === "") {
    return null
  }

  // Handle unicode escape sequences (like \u0018) which indicate no icon
  if (iconAssetName.includes("\\u") || iconAssetName.charCodeAt(0) < 32) {
    return null
  }

  let cleanPath = iconAssetName.trim()

  // Handle special cases with brackets (like "HexCoin[,3,10,500]")
  // Remove everything from the first '[' onwards
  const bracketIndex = cleanPath.indexOf("[")
  if (bracketIndex !== -1) {
    cleanPath = cleanPath.substring(0, bracketIndex)
  }

  // Clean up duplicated "GeneratedIcons/" paths that appear in the GameData
  // Handle cases like "GeneratedIcons/Other/GeneratedIcons/Items/Tools/T1_FlintAxe"
  // This should become "GeneratedIcons/Items/Tools/T1_FlintAxe"
  while (cleanPath.includes("GeneratedIcons/Other/GeneratedIcons/")) {
    cleanPath = cleanPath.replace("GeneratedIcons/Other/GeneratedIcons/", "GeneratedIcons/")
  }

  // Also handle cases where there are multiple GeneratedIcons without the "Other" part
  while (cleanPath.includes("GeneratedIcons/GeneratedIcons/")) {
    cleanPath = cleanPath.replace("GeneratedIcons/GeneratedIcons/", "GeneratedIcons/")
  }

  // Handle paths that don't start with "GeneratedIcons/" but should be in GeneratedIcons/Items/
  // This handles cases like "Items/HexCoin" -> "GeneratedIcons/Items/HexCoin"
  if (!cleanPath.startsWith("GeneratedIcons/") && cleanPath.startsWith("Items/")) {
    cleanPath = `GeneratedIcons/${cleanPath}`
  }

  // Add .png extension if not already present
  if (!cleanPath.endsWith(".png")) {
    cleanPath += ".png"
  }

  // Return the full asset path maintaining directory structure
  return `/assets/${cleanPath}`
}

/**
 * Checks if an icon asset name is valid (not empty, null, or a unicode escape)
 */
export function isValidIconAssetName(iconAssetName: string | undefined | null): boolean {
  return convertIconAssetNameToPath(iconAssetName) !== null
}

/**
 * Gets alternative icon paths to try when the primary path doesn't exist
 * This handles the case where some icons might be in OldGeneratedIcons instead of GeneratedIcons
 */
export function getAlternativeIconPaths(iconAssetName: string | undefined | null): string[] {
  const primaryPath = convertIconAssetNameToPath(iconAssetName)
  if (!primaryPath) return []

  const alternatives: string[] = []

  // If the primary path uses GeneratedIcons, try OldGeneratedIcons
  if (primaryPath.includes("/GeneratedIcons/")) {
    alternatives.push(primaryPath.replace("/GeneratedIcons/", "/OldGeneratedIcons/"))
  }

  // If the primary path uses OldGeneratedIcons, try GeneratedIcons
  if (primaryPath.includes("/OldGeneratedIcons/")) {
    alternatives.push(primaryPath.replace("/OldGeneratedIcons/", "/GeneratedIcons/"))
  }

  return alternatives
}

/**
 * Gets a fallback icon path for when the main icon is not available
 */
export function getFallbackIconPath(): string {
  return "/assets/Unknown.png" // Use the Unknown icon as fallback
}
