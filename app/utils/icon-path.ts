/**
 * Utility functions for converting GameData icon_asset_name to asset paths
 */

/**
 * Converts a GameData icon_asset_name to a usable asset path
 *
 * Handles various patterns (all assets are flattened to /assets/ root):
 * - "GeneratedIcons/Items/AncientGear" -> "/assets/AncientGear.png"
 * - "GeneratedIcons/Other/Buildings/Stockpile/StockpileSmallT1" -> "/assets/StockpileSmallT1.png"
 * - "Items/HexCoin[,3,10,500]" -> "/assets/HexCoin.png"
 * - "GeneratedIcons/Cargo/Animals/GrassBird" -> "/assets/GrassBird.png"
 * - "GeneratedIcons/Other/GeneratedIcons/Items/Tools/FerralithAxe" -> "/assets/FerralithAxe.png"
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

  // Remove all instances of "GeneratedIcons/" from anywhere in the path
  while (cleanPath.includes("GeneratedIcons/")) {
    cleanPath = cleanPath.replace("GeneratedIcons/", "")
  }

  // Remove all directory paths - we only want the filename since all assets are flattened
  // Handle paths like "Other/Items/Tools/FerralithAxe" -> "FerralithAxe"
  const pathParts = cleanPath.split("/")
  cleanPath = pathParts[pathParts.length - 1] // Get the last part (filename)

  // Handle special cases with brackets (like "HexCoin[,3,10,500]")
  // Remove everything from the first '[' onwards
  const bracketIndex = cleanPath.indexOf("[")
  if (bracketIndex !== -1) {
    cleanPath = cleanPath.substring(0, bracketIndex)
  }

  // Add .png extension if not already present
  if (!cleanPath.endsWith(".png")) {
    cleanPath += ".png"
  }

  // Return the full asset path (all files are now in the root of /assets/)
  return `/assets/${cleanPath}`
}

/**
 * Checks if an icon asset name is valid (not empty, null, or a unicode escape)
 */
export function isValidIconAssetName(iconAssetName: string | undefined | null): boolean {
  return convertIconAssetNameToPath(iconAssetName) !== null
}

/**
 * Gets a fallback icon path for when the main icon is not available
 */
export function getFallbackIconPath(): string {
  return "/assets/IconsAtlas.png" // Use the atlas as fallback (served from public/assets folder)
}
