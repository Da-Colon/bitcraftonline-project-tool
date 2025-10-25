import { Box, Image, type BoxProps } from "@chakra-ui/react";
import React, { useState, useMemo, useEffect } from "react";

import {
  convertIconAssetNameToPath,
  getFallbackIconPath,
  getAlternativeIconPaths,
} from "~/utils/icon-path"

interface GameDataIconProps {
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
}: GameDataIconProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPathIndex, setCurrentPathIndex] = useState(0)

  const allPaths = useMemo(() => {
    const iconPath = convertIconAssetNameToPath(iconAssetName)
    const alternativePaths = getAlternativeIconPaths(iconAssetName)
    const paths = iconPath ? [iconPath, ...alternativePaths] : []

    return paths
  }, [iconAssetName])

  const fallbackPath = getFallbackIconPath()
  const currentPath = allPaths[currentPathIndex]

  // Reset state when iconAssetName changes
  useEffect(() => {
    setCurrentPathIndex(0)
    setHasError(false)
    setIsLoading(true)
  }, [iconAssetName])

  // Shared placeholder component
  const PlaceholderIcon = () => (
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

  // If no valid icon path and no fallback, return null
  if (allPaths.length === 0 && !showFallback) {
    return null
  }

  // If no valid icon path, show fallback immediately
  if (allPaths.length === 0) {
    return fallback ? <>{fallback}</> : <PlaceholderIcon />
  }

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)

    // Try the next alternative path if available
    if (currentPathIndex < allPaths.length - 1) {
      setCurrentPathIndex(currentPathIndex + 1)
      setHasError(false) // Reset error state to try the next path
      setIsLoading(true)
      return
    }

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
          // If even the fallback fails, the Image component will show its fallback
        }}
        fallback={<PlaceholderIcon />}
      />
    )
  }

  return (
    <Box display="inline-block" width={size} height={size} {...boxProps}>
      <Image
        key={`${iconAssetName}-${currentPathIndex}`}
        src={currentPath}
        alt={alt || "Icon"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity: isLoading ? 0.7 : 1,
          transition: "opacity 0.2s",
          display: "block",
        }}
        onLoad={handleLoad}
        onError={handleError}
      />
    </Box>
  )
}
