import { readFile } from "node:fs/promises"
import path from "node:path"

let cachedVersion: string | null = null

export async function getAppVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion
  try {
    const pkgPath = path.resolve(process.cwd(), "package.json")
    const raw = await readFile(pkgPath, "utf-8")
    const pkg = JSON.parse(raw) as { version?: string }
    cachedVersion = pkg.version ?? "dev"
  } catch {
    cachedVersion = "dev"
  }
  return cachedVersion
}
