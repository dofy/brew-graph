# CLAUDE.md

This file provides guidance to Claude (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (see `pnpm-workspace.yaml` and `pnpm-lock.yaml`). Node 18+ required.

- `pnpm dev` — start Vite dev server
- `pnpm build` — type-check (`tsc -b`) then `vite build` (build will fail on TypeScript errors)
- `pnpm lint` — run ESLint (flat config in `eslint.config.js`)
- `pnpm preview` — preview the production build
- `pnpm generate-icons` — regenerate PWA icons from `public/homebrew.svg` via `scripts/generate-icons.mjs` (uses `sharp`)

There is no test runner configured in this project.

## Architecture

Brew Graph is a client-only React 19 + TypeScript SPA (Vite 7) that browses the Homebrew Formulae/Casks catalog. There is no backend; all data lives in the browser.

### Data flow

1. **Remote source**: `https://formulae.brew.sh/api/formula.json` and `.../cask.json`, fetched in `src/db/sync.ts`.
2. **Local persistence**: Dexie/IndexedDB (`src/db/index.ts`, DB name `BrewGraph`) with tables `formulae`, `casks`, `favorites`, `tags`, `meta`. Schema version is `1` — bumping it requires a Dexie migration.
3. **Sync policy**: `isSyncExpired()` defaults to 48 hours. `checkAndSync()` runs on app load; `syncData(_, force=true)` is triggered by the `r` hotkey. Bulk writes are batched (`BATCH_SIZE = 500`) and progress is reported via `SyncProgressCallback` to `SyncOverlay`.
4. **Service worker**: `vite-plugin-pwa` (autoUpdate) caches the Homebrew API with `NetworkFirst` and Google Fonts with `CacheFirst` (see `vite.config.ts`). PWA caching is independent of the IndexedDB cache.

### State management

Three layers, intentionally split:

- **Zustand stores** in `src/stores/` for cross-cutting UI/user state:
  - `useSearchStore` — query, type filter, tag filter, favorites-only, hideDeprecated, selectedIndex, search dialog open state. Only `hideDeprecated` is persisted to localStorage (`partialize`).
  - `useFavoriteStore` — favorites and user tags, mirrored to Dexie. Must call `loadFromDB()` on app boot before reads are valid.
  - `useSettingsStore`, `useSyncStore` — theme/width settings and sync progress.
- **Dexie + `dexie-react-hooks`** (`useLiveQuery`) for reactive reads of package data — see `src/hooks/usePackages.ts`. These hooks **read from the Zustand favorites/tags maps** as part of their filter logic, so the live-query deps include `favoritesSize`/`tagsSize` to retrigger when the Map identity is replaced.
- **URL state** via React Router 7 — routes in `src/App.tsx`: `/`, `/favorites`, `/trending`, `/tags`, `/tags/:tagName`, `/:type/:name` (where `type` is `formula` or `cask`).

### Search

`useSearchPackages` in `src/hooks/usePackages.ts` is the core search function. It:

1. Parses the query for special tokens via `parseSearchQuery`: `#tag` (multiple allowed, partial match, case-insensitive), `*` (favorites-only), and remaining plain text.
2. Combines URL-derived filters (`tag` param, `favoritesOnly` flag) with query-derived ones.
3. Loads **all** formulae/casks from Dexie and filters in-memory (no Dexie indices are used for search), then scores via `calculateMatchScore` (exact name > prefix > word-boundary > contains > description).
4. Returns a sliced page; `useTotalPackageCount` runs the same pipeline to compute pagination totals. **Keep these two functions in sync when changing filter/scoring logic.**

### Hotkeys

Global hotkeys are mounted by `HotkeyProvider` (wraps the router) using `useGlobalHotkeys` from `src/hooks/useHotkeys.ts`. View-specific hotkeys live in `useCardNavigation` (list grid: arrows/hjkl, `1/2/3` for type, `[`/`]` pagination, `f`, `t`, Enter) and `useDetailHotkeys` (`f`, `t`, `o`, `c`, Backspace). The full reference is in `README.md` and `HotkeyHelp.tsx`.

### Conventions

- Path alias `@/*` → `src/*` (configured in `vite.config.ts` and `tsconfig.app.json`).
- UI primitives in `src/components/ui/` are shadcn/ui (style `new-york`, base color `neutral`, icons `lucide-react`) — see `components.json`. Add new shadcn components via the CLI rather than hand-rolling.
- Tailwind CSS v4 via `@tailwindcss/vite`; global styles in `src/index.css`.
- Build splits manual chunks: `react-vendor`, `ui-vendor` (Radix), `data-vendor` (Dexie/Zustand) — update `manualChunks` in `vite.config.ts` if adding heavy deps.
- Deployment target is Vercel (`vercel.json`).
