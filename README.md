# Arena - Elite Esports Tournament Platform

**Arena** is a premier esports tournament management platform designed for the next generation of competitive gaming. It features a high-performance, cinematically branded "Elite" aesthetic, real-time synchronization, and a robust professional scouting ecosystem.

## 🏆 Key Features

- **Pro-Player Digital ID**: Shareable, holographic profile cards featuring tournament history, team memberships, and earned Legacy Badges.
- **Scouting Hub (LFG)**: A real-time marketplace for elite talent and world-class franchises to synchronize their rosters.
- **League Updates (Notifications)**: A global real-time alert system for invitations, match updates, and system announcements.
- **Live Match Ticker**: A cinematic, global scrolling bar showcasing active match scores and ongoing tournaments.
- **Automated Competition Flow**:
    - **Quick-Join**: Streamlined squad deployment for team captains with a single click.
    - **Auto-Advancement**: Automatic bracket progression for winners upon match verification.
- **Pro-League Dashboard**: Advanced control panel for organizers to manage participants, brackets, and event information.
- **Admin Command Center**: Central authority console for user role management and account verified status.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the migration scripts found in `database/migrations/` in your Supabase SQL Editor.

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## 📁 Project Structure

The codebase is beautifully organized into domain-driven logical subdirectories:

```
src/
├── components/          
│   ├── admin/           # System authority consoles
│   ├── auth/            # Clean, professional sign-in portals
│   ├── home/            # Cinematic landing experiences
│   ├── layout/          # Structural wrappers (Navbar, Footer, LiveTicker)
│   ├── profile/         # Digital IDs and Team profiles
│   ├── scouting/        # Recruitment marketplace (ScoutingHub)
│   ├── team/            # Franchise and roster management
│   ├── tournament/      # Full tournament lifecycle and brackets
│   └── ui/              # Reusable atomic elements (Avatar, Skeleton)
├── contexts/            # Authentication and Global Contexts
├── hooks/               # Domain-specific API & Supabase logic
├── store/               # Global UI state (Zustand)
├── types/               # Strict TypeScript definitions
└── utils/               # Pure business logic and bracket generators
database/
└── migrations/          # SQL schema and migration scripts
```

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Glassmorphism & Cinematic Design Tokens)
- **Data**: TanStack Query (React Query) & Zustand
- **Backend**: Supabase (PostgreSQL + RLS + Realtime)
- **Visualization**: React Flow (Interactive Brackets)
- **Icons**: Lucide React

## 💎 Design Philosophy: "Clean Esports Elite"

- **High Prestige**: Deep Slate-950 palette with Blue-500 accents and neon glows.
- **Professionalism**: Simple, accessible terminology and natural input casing (no forced caps).
- **Immersion**: Holographic effects, smooth transitions, and a "Live Event" atmosphere.
- **Usability**: Mobile-first responsive design with intuitive "click-outside" dropdown controls.

## 📄 Documentation

- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md): Detailed architecture and API reference.

## License

Demonstration project for elite esports tournament management.
