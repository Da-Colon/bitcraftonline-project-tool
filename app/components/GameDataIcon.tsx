import { Image, Box, type ImageProps, type BoxProps } from "@chakra-ui/react"
import { useState } from "react"
import { convertIconAssetNameToPath, getFallbackIconPath } from "~/utils/icon-path"

interface GameDataIconProps extends Omit<ImageProps, "src" | "alt" | "fallback"> {
  /**
   * The icon_asset_name from GameData JSON files
   */
  iconAssetName?: string | null

  /**
   * Alt text for the image. If not provided, will use a generic description
   */
  alt?: string

  /**
   * Size of the icon. Can be a number (px) or string (any CSS unit)
   * @default "24px"
   */
  size?: string | number

  /**
   * Whether to show a fallback when the icon fails to load
   * @default true
   */
  showFallback?: boolean

  /**
   * Custom fallback component to show when icon fails to load
   */
  fallback?: React.ReactNode

  /**
   * Props to pass to the wrapping Box component
   */
  boxProps?: BoxProps
}

/**
 * Component for displaying icons from GameData icon_asset_name properties
 *
 * Handles various icon formats and provides fallback behavior for missing/invalid icons
 */
export function GameDataIcon({
  iconAssetName,
  alt,
  size = "24px",
  showFallback = true,
  fallback,
  boxProps,
  ...imageProps
}: GameDataIconProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const iconPath = convertIconAssetNameToPath(iconAssetName)
  const fallbackPath = getFallbackIconPath()

  // Debug logging for missing files
  if (iconPath && typeof window !== "undefined" && hasError) {
    console.warn(`Failed to load icon: ${iconPath}`)
  }

  // If no valid icon path and no fallback, return null
  if (!iconPath && !showFallback) {
    return null
  }

  // If no valid icon path, show fallback immediately
  if (!iconPath) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Box
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        width={size}
        height={size}
        bg="gray.100"
        borderRadius="md"
        fontSize="xs"
        color="gray.500"
        {...boxProps}
      >
        ?
      </Box>
    )
  }

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  // Show fallback if there's an error and fallback is enabled
  if (hasError && showFallback) {
    if (fallback) {
      return <>{fallback}</>
    }

    // Try to show the fallback image, or a placeholder box if that fails too
    return (
      <Image
        src={fallbackPath}
        alt={alt || "Icon"}
        width={size}
        height={size}
        objectFit="contain"
        onError={() => {
          // If even the fallback fails, we'll show a placeholder
        }}
        fallback={
          <Box
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            width={size}
            height={size}
            bg="gray.100"
            borderRadius="md"
            fontSize="xs"
            color="gray.500"
            {...boxProps}
          >
            ?
          </Box>
        }
        {...imageProps}
      />
    )
  }

  return (
    <Image
      src={iconPath}
      alt={alt || "Icon"}
      width={size}
      height={size}
      objectFit="contain"
      onLoad={handleLoad}
      onError={handleError}
      opacity={isLoading ? 0.7 : 1}
      transition="opacity 0.2s"
      loading="lazy"
      {...imageProps}
    />
  )
}
