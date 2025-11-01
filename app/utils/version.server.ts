import { readFile } from "node:fs/promises"
import path from "node:path"

import { z } from "zod"

let cachedVersion: string | null = null

const PackageJsonSchema = z.object({
  version: z.string().optional(),
}).passthrough()

export async function getAppVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion
  try {
    const pkgPath = path.resolve(process.cwd(), "package.json")
    const raw = await readFile(pkgPath, "utf-8")
    const parsed = JSON.parse(raw)
    const pkg = PackageJsonSchema.parse(parsed)
    cachedVersion = pkg.version ?? "dev"
  } catch {
    cachedVersion = "dev"
  }
  return cachedVersion
}
