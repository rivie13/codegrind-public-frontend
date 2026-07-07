# CodeGrind Frontend

The React frontend for [CodeGrind](https://codegrind.online) — a cyberpunk-themed platform for
learning algorithms and data structures through interactive tower-defense-style challenges.

This repo is meant to be an open core, a way of letting people see and contribute to the codebase. See `CONTRIBUTING.md` for more information.

NOTE: Downloading this repo alone is not enough to properly run the full codegrind experience. This repo is intended to allow devs to see, make edits and contribute to the portions of the Frontend    codebase; but requires and does not provide: environment variables, additional assets, private packages and backend code to run (See below for more information).

## CodeGrind WebSite Status

Please use the following link to check the status of the website and its services: [https://stats.uptimerobot.com/MYXleQpuCX](https://stats.uptimerobot.com/MYXleQpuCX) (monitor link)

## Tech Stack

| Technology | Version | Notes |
|------------|---------|-------|
| React | 18.x | JavaScript only — no TypeScript (working on upgrading to React 19)|
| Vite | 6.x | Build tool and dev server |
| Chakra UI | 2.x | Component library |
| React Router | v6 | Client-side routing |
| React Query | v5 (@tanstack/react-query) | Server state management (to be implemented) |
| Monaco Editor | 4.x | In-game code editor |
| Vitest | 4.x | Unit and component tests |
| ESLint | v9 flat config | `eslint.config.js` — never `.eslintrc.*` |

## Dev Setup

```bash
# From the codegrind-frontend/ directory:
npm install
npm run dev        # Vite dev server at http://localhost:5173
```

Copy `.env.example` to `.env` and fill in values before running locally:

```bash
cp .env.example .env
```

The key variable is `VITE_API_URL` — point it at your local backend (default: `http://localhost:3000`).

Local dev asset note:

Because I can not dispense the assets for CodeGrind due to the licenses, please note that parts of the site / game will not work as intended / may crash the experience.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint (v9 flat config) |
| `npm test` | Run Vitest test suite |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest with V8 coverage |


## Project Structure

```
codegrind-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── aiProblems/      # AI problem creation components
│   │   ├── learningPath/    # Learning path / cluster UI
│   │   ├── problemWorkspace/ # Code workspace (non-game mode)
│   │   ├── profileDashboard/ # User profile components
│   │   └── towerDefense/    # Tower defense game components
│   ├── pages/               # Route-level page components
│   │   ├── ai/              # AI problem pages
│   │   ├── games/           # Game pages (tower defense v2)
│   │   ├── learning/        # Learning path pages
│   │   └── profile/         # Profile pages
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API service wrappers (axios-based)
│   ├── utils/               # Pure utility functions
│   ├── config/              # App-wide config (ad slots, etc.)
│   ├── contexts/            # React context providers
│   ├── theme.js             # Chakra UI theme (cyberpunk/neon)
├── public/                  # Static assets (audio, images)
├── eslint.config.js         # ESLint v9 flat config
├── vite.config.js           # Vite config
└── vitest.config.js         # Vitest config
```

## ESLint

This project uses ESLint **v9 with flat config** (`eslint.config.js`).
Do **not** create `.eslintrc`, `.eslintrc.js`, or any legacy config files.

Run linting:
```bash
npm run lint
```

## Testing

Tests use Vitest + `@testing-library/react`. Test files are colocated with their source:

```
src/components/profileDashboard/NextObjectiveWidget.test.jsx
src/utils/code/CodeContextCollector.test.js
```

Run all tests:
```bash
npm test
```

## Audio

The Tower Defense game includes a cyberpunk audio system 
(sound effects + background music). Please note that as stated before, 
I can not distribute the assets due to licesnse restrictions. This 
means that audio effects and music will not work as intended / may crash the experience.

## AI Features

CodeGrind features AI-powered tools, including an AI problem generator and an AI code assistant. These features rely on API keys for the AI models and access to the backend. 

If you are running CodeGrind locally and do not have the necessary API keys and backend access, these features will not work as intended.

## Licensing & Core Packages

* **Frontend Platform**: Shipped under the [Business Source License 1.1 (BSL 1.1)](LICENSE).
* **Proprietary Core**: CodeGrind's client-side sandboxed compilers, execution wrappers, and bidirectional editor sync events are proprietary. They are resolved via the private npm package hosted on GitHub Packages. Due to the private nature of the package, parts of the code will not work as intended / may crash the experience.

