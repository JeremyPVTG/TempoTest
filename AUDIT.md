# Summary
This repository is a pnpm/Turbo monorepo containing a Vite web app (migrated to apps/web) and two stub packages (packages/domain, packages/data). Tests run and pass in the web app with high coverage. Linting currently fails due to an ESM module resolution mismatch for the root eslint config when invoked from apps/web.

# Repository Classification
- Classification: monorepo (Turbo + pnpm workspaces)
- Evidence: `turbo.json`, `pnpm-workspace.yaml`, multiple package.json files under apps/ and packages/.

# Workspace & Packages
- Root files: turbo.json, pnpm-workspace.yaml, tsconfig.base.json
- Packages detected:
  - apps/web (Vite React app)
  - packages/domain (stub)
  - packages/data (stub)
- package.json index:
  - /package.json → name: @habituals/mono; scripts: dev/build/typecheck/lint/test via turbo
  - /apps/web/package.json → name: @habituals/web; scripts: dev, build, preview, typecheck, lint, test, test:coverage, types:supabase
  - /packages/domain/package.json → name: @habituals/domain; scripts: build, typecheck, lint, test
  - /packages/data/package.json → name: @habituals/data; scripts: build, typecheck, lint, test

# Build & Tooling
- Vite config: apps/web/vite.config.ts (react-swc + vite-tsconfig-paths; Vitest config embedded)
- Turbo version: 2.5.6 (requires `tasks` field; current turbo.json uses deprecated `pipeline` key → build fails)
- pnpm version: 9.0.0
- No Next.js/expo/metro configs found

# TypeScript Config Matrix
- Root: tsconfig.base.json → strict: true, target: ES2020, module: ESNext, moduleResolution: Bundler, JSX: react-jsx, paths for @habituals/*
- apps/web/tsconfig.json → extends base; outDir dist; rootDir src; types: vite/client
- packages/*/tsconfig.json → extends base; declaration true; outDir dist; rootDir src

# Source Inventory & LOC
- Tree (depth ≤3) saved to audit_logs_tree.txt (find output).
- LOC (approx; excludes node_modules/dist/build/.next/.expo/.turbo):
  - .ts: 595
  - .tsx: 7,465
  - .js: 729
  - .json: 9,118
  - .svg: 1
  - .css: 530
  - Total: 18,438
- Top largest files (many are coverage artifacts). Full list in audit_top_files.json.

# Tests, Lint & Coverage
- Test framework: Vitest (apps/web)
- Run: `pnpm -C apps/web test:run -- --coverage`
  - Test files: 9 passed (35 tests), duration ~2.2s
  - Coverage (v8): statements 86.25%, lines 86.25%, functions 81.81%, branches 96.66%
- Lint:
  - `pnpm -C apps/web lint` failed due to root `eslint.config.js` being ESM without `type: module` in root package.json. Severity: medium.

# Data Layer & Backend Artifacts
- Supabase: no supabase/ migrations; `types:supabase` script exists in apps/web to generate `src/types/supabase.ts` (currently empty).
- API schemas/contracts: none detected (no zod schemas under packages).
- Env vars: no `process.env.*` references found.

# Architecture Signals (Domain/Data/UI/Queue/IAP/Analytics)
- Domain: package scaffold exists but is a stub.
- Data: package scaffold exists but is a stub; no Supabase client code yet.
- UI: apps/web contains ShadCN UI components and stories (now under app paths).
- Queue/Offline: no MMKV/NetInfo or offline queue present.
- Analytics: no direct PostHog imports detected; no wrapper found either.
- IAP/Storefront: none.

# Risks & Compatibility Notes
- Turbo 2.x requires `tasks` in turbo.json; current file still uses `pipeline` → `pnpm build` fails. Severity: high (blocks CI build).
- Lint ESM config issue (root eslint.config.js loaded from app). Severity: medium.
- Monorepo migration performed; ensure CI, paths, and coverage configs are updated accordingly across apps/web.
- No Supabase types or client in packages/data; Phase 3 work required.

# Migration Decision (Keep vs Turborepo)
- Decision: keep Turborepo (monorepo) and proceed.
- Reasons:
  1. Phase 3 requires domain/data separation and shared packages (packages/data, packages/domain).
  2. React Native/Expo app is planned (apps/mobile), which benefits from monorepo layout.
  3. Turbo/pnpm workspaces enable shared lint/build/test pipelines.

# Recommended Next Actions (ranked)
1. Fix turbo.json (`pipeline` → `tasks`) to restore `pnpm -w build` (High, Low effort).
2. Adjust ESLint setup for workspaces (either ESM everywhere or convert config to CJS) (High, Medium effort).
3. Implement packages/data Step B: Supabase client + typed helpers; set strict TS (High, Medium effort).
4. Implement offline queue (MMKV abstraction compatible for Expo) and React Query hooks (High, High effort).
5. Add CI pipelines for unit/contract/RLS/E2E as per plan (High, Medium effort).
6. Generate Supabase types into apps/mobile and/or packages/data as needed (Medium, Low effort).
7. Add analytics wrapper and lint rule to forbid raw PostHog imports (Medium, Low effort).
8. Write README and Testing Notes for packages/data (Medium, Low effort).
