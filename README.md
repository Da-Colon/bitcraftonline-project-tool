BitCraft Helper
================

A Remix + Vite app with Chakra UI that helps plan BitCraft crafting projects and (future) player/claim tools. It ingests BitCraft GameData via a Git submodule and provides a recipe calculator and API endpoints.

Project Structure
- `app/`: Remix app code
  - `routes/`: UI and API routes (server-only API under `api.*`)
  - `services/`: domain logic; server-only files end with `.server.ts`
  - `components/`, `types/`, `utils/`, `constants/`
  - `entry.*`, `root.tsx`: Chakra + Emotion SSR setup
- `GameData/BitCraft_GameData`: Git submodule with JSON game data
- `scripts/`: Node scripts and tests
  - `bitcraft/`: raw data loader + parser (ESM, Node-only)
  - `tests/`: small Node scripts that exercise the data parsing

Common Tasks
- Run dev server: `npm run dev`
- Build: `npm run build`
- Start (prod): `npm start`
- Typecheck: `npm run typecheck`
- Extract BitCraft data to `app/data/bitcraft-data.ts` (optional for client use):
  - `npm run data:extract`
- Run sample data tests:
  - `npm run test:data`
  - `npm run test:search`
  - `npm run test:recipes`

Environment
- Server env is validated in `app/utils/env.server.ts` (zod schema)
- Example `.env` (do not commit secrets):
  - `DATABASE_URL`, `REDIS_URL`, `BITJITA_BASE_URL`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW`

Notes
- The app reads BitCraft GameData directly in server code via JSON imports. Scripts under `scripts/bitcraft` offer Node-based parsing and optional extraction for client-side bundles.
- Server-only modules that use Node APIs (`fs`, `path`, Redis) are suffixed with `.server.ts`.

