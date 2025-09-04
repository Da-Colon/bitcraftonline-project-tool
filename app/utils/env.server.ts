import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  BITJITA_BASE_URL: z.string().url().default("https://bitjita.com"),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60_000),
});

type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Log a concise error to aid debugging without crashing in production
    const formatted = parsed.error.flatten();
    console.error("Invalid environment variables:", formatted.fieldErrors);
    // Still throw in development to surface quickly
    if (process.env.NODE_ENV !== "production") {
      throw parsed.error;
    }
  }
  cached = (parsed.success ? parsed.data : EnvSchema.parse({})) as Env;
  return cached;
}

