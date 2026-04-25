# GEMINI.md - Arena Esports Platform Context

## Project Overview
**Arena** is a premier esports tournament management platform. It has been refined into a high-performance, cinematically branded "Premier League" application with a robust architectural foundation.

### Tech Stack
- **Frontend**: React 18 (TypeScript) + Vite
- **Styling**: Tailwind CSS (Pro-League System: Slate-950, Blue-500, Glassmorphism)
- **Writing Style**: Clean Esports Elite (Professional, simple terminology, natural casing).
- **Data Fetching**: TanStack Query (React Query) for caching and background synchronization.
- **Global State**: Zustand for persistent UI state (filters, themes).
- **Backend/Auth**: Supabase (PostgreSQL + RLS + Realtime).
- **Testing**: Vitest + React Testing Library + jsdom.

### Architecture & Standards
- **Component Design**: Functional components using the `useCallback` + `useEffect` (with full dependencies) pattern.
- **Data Layer**: Abstracted into custom hooks in `src/hooks/` (e.g., `useTournaments`, `useTeams`, `useNotifications`).
- **Security**: 
    - Platform Administrator role has "God Mode" access via the `is_admin()` SQL helper.
    - Public read access is enabled for core data (`anon`).
    - Authenticated CRUD is strictly enforced via RLS.
- **Database**: Single-source-of-truth schema in `COMPLETE_SUPABASE_SCHEMA.sql`.
- **Validation**: Strict TypeScript usage. Every core utility MUST have a corresponding `.test.ts` file.

---

## Building and Running

### Development
```powershell
# Install dependencies
npm install

# Run development server
npm run dev

# Run unit tests
npm run test

# Type check & Lint
npm run typecheck; npm run lint
```

### Production
```powershell
# Build for production
npm run build
```

---

## Development Conventions

### Coding Standards
- **UI Consistency**: Maintain the "Rounded-[2rem]" and glassmorphism aesthetic. Use cinematic design tokens defined in `src/index.css` (e.g., `custom-scrollbar`, `text-glow-blue`, `holo-card`). 
- **Input Standards**: All text inputs and placeholders MUST use natural casing (avoid forced uppercase). Language must be simple and accessible.
- **Interaction Model**: 
    - All full-screen modals MUST support mandatory backdrop-click-to-close.
    - Floating dropdowns (Notifications, User Menu) must implement auto-close logic when clicking outside their container.
    - Modals must support internal scrolling for long content while keeping headers fixed.
- **Data Fetching**: Use TanStack Query. No manual `useEffect` fetching allowed for primary data.
- **Franchise Management**: Personnel management is handled via a dual-path invitation lifecycle. Owners recruit via **Scouting**, players submit **Join Requests**.
- **Pro-Player Digital ID**: Shareable, holographic ID cards featuring tournament history, active roster links, social connections, and **Legacy Badges**.
- **Automated Competition Flow**:
    - **Quick-Join**: Team captains can deploy their entire squad with a single click.
    - **Live Ticker**: Global real-time match score streaming.
    - **Auto-Advancement**: Winners in brackets are automatically moved to the next round upon result verification.

### Project Structure
- `src/hooks/`: All API/Supabase interaction logic.
- `src/store/`: Global UI state (Zustand).
- `src/index.css`: Global Pro-League design tokens and animations.
- `src/components/`: Modular UI (e.g., `tournament/`, `privacy/`).
- `src/utils/`: Pure logic (Brackets, Scheduling, Time).

---

## Key Files
- `COMPLETE_SUPABASE_SCHEMA.sql`: The unified database definition.
- `src/components/AdminDashboard.tsx`: Fully functional authority console for user and role management.
- `src/components/MatchResultSubmission.tsx`: Cinematic result verification with automated bracket advancement.
- `src/components/tournament/InteractiveBracket.tsx`: React Flow implementation with clickable match reporting.
- `src/hooks/useNotifications.ts`: Core real-time notification engine.
- `src/components/PlayerProfilePage.tsx`: The Pro-Player Digital ID / CV central interface.
- `src/components/QuickJoinModal.tsx`: The automated squad deployment interface.
