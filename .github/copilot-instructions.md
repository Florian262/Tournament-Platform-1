## Purpose

Help coding agents quickly understand and contribute to the Arena tournament platform.

## Big Picture

- **Frontend**: React + TypeScript app built with Vite (`src/`). Navigation is manual state in `src/App.tsx` (no router). Components receive an `onNavigate` prop and use `currentPage` to render views.
- **Auth & Data**: Supabase is the single backend. Client is in `src/lib/supabase.ts` and reads `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from environment.
- **Domain logic**: Tournament and bracket rules live in `src/utils/bracketGenerator.ts` and rely on `TournamentParticipant` types in `src/types/index.ts`.
- **Persistence**: DB schema/migrations are in `superbase/migrations/` and use Row Level Security; many components call Supabase directly via `supabase.from(...).select/insert/update`.

## Key Files to Inspect First

- `src/contexts/AuthContext.tsx` — central auth flows: signUp, signIn, signOut, profile fetch, and `supabase.auth.onAuthStateChange` subscription.
- `src/lib/supabase.ts` — single Supabase client; ensure env vars are present before use.
- `src/utils/bracketGenerator.ts` — canonical implementation for single/double elimination and round-robin generation.
- `src/App.tsx` — app-level navigation pattern (state-driven). Follow this when adding pages/components.
- `superbase/migrations/220201800_create_tournamnet_platform_schema.sql` — authoritative DB schema and RLS expectations.

## Project Conventions & Patterns

- Navigation: No react-router. Use `onNavigate(page: string, data?: unknown)` and check `navigation.page` in `App.tsx`.
- Auth: Use the `useAuth()` hook from `src/contexts/AuthContext.tsx`. Example: `const { user, profile, refreshProfile } = useAuth()`.
- Supabase usage: call the exported `supabase` client directly. Handle and rethrow Supabase errors consistently (many contexts/components expect thrown errors).
- Environment: Variables must be `VITE_` prefixed. Add them to a `.env` file in project root for local dev.
- Component props: Components are PascalCase, accept `onNavigate` and sometimes `tournamentId`; prefer typed props in new components.

## Build / Dev / Debug Commands

- Install: `npm install`
- Dev server: `npm run dev` (Vite)
- Build: `npm run build`
- Preview production build: `npm run preview`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck` (uses `tsconfig.app.json`)

## Integration Notes & Gotchas

- Supabase env is validated on startup in `src/lib/supabase.ts`; missing variables throw immediately — add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before running.
- Auth flow creates a `user_profiles` row after `supabase.auth.signUp`. Tests or manual flows must account for this insert (see `signUp` implementation in `AuthContext`).
- Bracket generator uses placeholder IDs like `bye-0` for byes; callers must interpret `participant_id === null` as a bye in UI or match creation.
- Because RLS is enabled, many server-side inserts/updates rely on the currently-authenticated user; debugging database permission issues often means checking RLS policies in the SQL migration file.

## Examples (copyable)

- Create component that navigates:
  ```tsx
  // in a new component
  props.onNavigate('tournament-detail', tournamentId);
  ```
- Use auth hook to refresh profile:
  ```ts
  import { useAuth } from './contexts/AuthContext';
  const { refreshProfile } = useAuth();
  await refreshProfile();
  ```
- Supabase client:
  ```ts
  import { supabase } from './lib/supabase';
  await supabase.from('tournaments').select('*');
  ```

## What to Do If You Need More

- Read `PROJECT_DOCUMENTATION.md` for deeper architecture notes.
- If behavior depends on DB policies, inspect `superbase/migrations/*.sql` for RLS rules.
- Ask the repo owner to provide a test Supabase project or service key for integration tests (do not commit secrets).

---
If any section is unclear or you want more examples (component skeletons, typical API calls, or a checklist for PR reviews), tell me which area to expand.
