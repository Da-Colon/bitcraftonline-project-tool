import { useFetcher } from "@remix-run/react"
import { useEffect, useMemo } from "react"

import type { PlayerDetailsResponse, StandardErrorResponse } from "~/types/api-responses"
import type { PlayerDetail } from "~/types/player"
import { extractFetcherError } from "~/utils/error-handling"
import { xpToLevel } from "~/utils/levels"
import { getSkillDef } from "~/utils/skills"
import { isStandardErrorResponse } from "~/utils/type-guards"

export function usePlayerDetails(id: string | null | undefined) {
  const fetcher = useFetcher<PlayerDetailsResponse | StandardErrorResponse>()

  useEffect(() => {
    if (!id) {
      return
    }
    fetcher.load(`/api/players/${encodeURIComponent(id)}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!id) {
      return
    }

    const interval = setInterval(() => {
      fetcher.load(`/api/players/${encodeURIComponent(id)}`)
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // API route returns PlayerDetailsResponse { player: { ... } } structure
  const detail = useMemo<PlayerDetail | null>(() => {
    if (!fetcher.data) {
      return null
    }

    if (isStandardErrorResponse(fetcher.data)) {
      return null
    }

    if (typeof fetcher.data !== "object" || fetcher.data === null) {
      return null
    }

    const data = fetcher.data as Record<string, unknown>
    
    if (!("player" in data) || typeof data.player !== "object" || data.player === null) {
      return null
    }

    const player = data.player as Record<string, unknown>
    
    if (!("entityId" in player) || typeof player.entityId !== "string") {
      return null
    }
    
    if (!("username" in player) || typeof player.username !== "string") {
      return null
    }

    return {
      player: player as PlayerDetail["player"],
    }
  }, [fetcher.data])

  const error = useMemo<string | null>(() => {
    return extractFetcherError(fetcher.data, "Failed to load player")
  }, [fetcher.data])

  const loading = fetcher.state === "loading" || fetcher.state === "submitting"

  const derived = useMemo(() => {
    if (!detail?.player) return null
    const exp = detail.player.experience || []
    let best = null as null | { skill_id: number; quantity: number }
    for (const e of exp) {
      if (e.skill_id === 1) continue // ignore ANY
      if (!best || e.quantity > best.quantity) best = e
    }
    if (!best) return { highestSkill: null, locationName: detail.player.location?.name || null }
    const skillDef = getSkillDef(best.skill_id)
    const level = xpToLevel(best.quantity)
    return {
      highestSkill: {
        id: best.skill_id,
        name: skillDef?.name || String(best.skill_id),
        title: skillDef?.title || "",
        icon_asset_name: skillDef?.icon_asset_name,
        level,
        xp: best.quantity,
      },
      locationName: detail.player.location?.name || null,
    }
  }, [detail])

  return { detail, loading, error, derived } as const
}
