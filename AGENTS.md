# Repository Guidelines

## Project Structure & Module Organization
`src/` hosts the Vite + React reader; feature folders keep components, hooks, and styles together. Shared utilities live in `shared/links-metadata`, reusable libraries in `packages/*`, and operational tooling in `tools/` (`matrix-bot`, `links-check`, `snapshot-tests`). Gray Paper PDFs stay in the `graypaper-archive/` submodule and are copied into `public/` via `scripts/cp-gp.js` during `predev/prebuild`. Build artifacts land in `dist/`—never edit them.

## Build, Test & Development Commands
- `npm ci` installs workspace dependencies.
- `npm run dev` launches Vite and triggers the Gray Paper sync hook.
- `npm run build` executes `tsc -b` then `vite build`; run before releases.
- `npm run preview` serves the production bundle for smoke tests.
- `npm run qa` / `npm run qa-fix` run Biome lint+format.
- `npm run docker:build && npm run docker:test` cover snapshot tests; `npm run docker:test:update` refreshes approved changes.

## Coding Style & Naming Conventions
Code is TypeScript-first with functional React components. Prefer hooks over HOCs and colocate helpers with their consumer. Use 2-space indentation, `PascalCase` for components, `camelCase` for functions/variables, and `SCREAMING_SNAKE_CASE` for constants. Tailwind utilities complement `@fluffylabs/shared-ui`; favor semantic wrappers over long class strings. Run `npm run qa-fix` before pushing so Biome normalizes formatting, imports, and lint rules.

## Testing Guidelines
Unit and integration specs live beside their subjects (e.g., `src/components/NotesProvider/utils/remoteSources.spec.ts`) and follow the `*.spec.ts(x)` pattern. Use Vitest via `npm run test` for fast feedback; add targeted suites for stateful logic or data transforms. Visual regressions run through `tools/snapshot-tests/tests/basic-snapshots.spec.ts` inside Docker—inspect the Playwright report and update snapshots only when UI changes are expected.

## Commit & Pull Request Guidelines
History shows Conventional Commit prefixes (`feat:`, `fix:`, `chore(deps): …`) enforced by `commitlint`. Write imperative, present-tense subjects under 72 characters and include scopes when helpful (`feat(notes): add label filter`). Pull requests must outline motivation, implementation notes, linked issues, and before/after screenshots or snapshot diffs for UI changes. Note the commands you ran (tests, lint, build) and keep PRs focused—split tooling or dependency work from feature logic when possible.

## Security & Configuration Tips
Run `git submodule update --init && npm run cp-gp` whenever the Gray Paper archive changes. Keep secrets out of the repo—`.env` files stay local, and matrix/API tokens should be injected via your shell. Docker snapshot runs may accumulate containers; use `npm run docker:clean` to reset the environment.
