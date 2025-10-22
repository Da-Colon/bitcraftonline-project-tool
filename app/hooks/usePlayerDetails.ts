import { useEffect, useMemo, useState } from "react"

import type { PlayerDetail } from "~/types/player"
import { xpToLevel } from "~/utils/levels"
import { getSkillDef } from "~/utils/skills"

export function usePlayerDetails(id: string | null | undefined) {
  const [detail, setDetail] = useState<PlayerDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setDetail(null)
      return
    }

    let active = true
    async function fetchOnce() {
      setLoading(true)
      setError(null)
      try {
        if (!id) return
        const res = await fetch(`/api/player/${encodeURIComponent(id)}`)
        if (!res.ok) {
          if (res.status === 503) {
            const errorData = await res.json().catch(() => ({}))
            const errorMsg = errorData.isExternalError 
              ? `${errorData.service || 'External API'} Error: ${errorData.detail || 'Service unavailable'}`
              : errorData.detail || "External service is currently unavailable"
            throw new Error(errorMsg)
          }
          throw new Error(`Failed (${res.status})`)
        }
        const data: PlayerDetail = await res.json()
        if (active) setDetail(data)
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load player")
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchOnce()
    const i = setInterval(fetchOnce, 5 * 60 * 1000)
    return () => {
      active = false
      clearInterval(i)
    }
  }, [id])

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
