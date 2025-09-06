BitCraft Project Planner
=======================

A Remix + Vite one‑pager with Chakra UI to plan BitCraft crafting projects. It ingests BitCraft GameData via a Git submodule and provides a server API to compute recipe/resource breakdowns.

Project Structure
- `app/`: Remix app code
  - `routes/`: `/projects` (main UI) and `api.recipes.calculate` (server API)
  - `services/`: recipe calculator + bitcraft parser
  - `components/`, `types/`, `constants/`
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

Environment
- No server env vars are required for the planner.

Notes
- The app reads BitCraft GameData directly in server code via JSON imports.
