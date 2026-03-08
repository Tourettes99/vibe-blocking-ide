# Vibe Blocking IDE

A desktop app that lets you design and generate full applications using AI — by describing your app through structured design phases instead of writing code.

Built with Electron + React (Vite) and powered by the Google Gemini API.

## How It Works

Instead of a single prompt box, the app breaks your design intent into **7 color-coded design phases** that map to the real parts of building any application:

| Phase | Color | What to describe |
|---|---|---|
| **Concept & Vision** | Teal | What the app is, who it's for, core problem it solves |
| **UI & Layout** | Purple | Visual design, navigation, colors, typography |
| **Core Features** | Blue | Main functionality, user interactions, key workflows |
| **Data & Backend** | Green | Data model, APIs, storage, server architecture |
| **Auth & Users** | Amber | Authentication, roles, permissions, security |
| **Platform & Config** | Rose | Target platform, performance, deployment strategy |
| **Project Structure & Folders** | Sky | Folder tree, scaffold command (e.g. `npx create-vite`), optional presets, feed existing files as context |

You can also add **custom requirement blocks** beyond the 7 core phases for anything else your app needs.

When you hit **Build Vibe App**, the prompts are combined into a structured specification and sent to Gemini, which generates all the code files for a working application. Files are saved to `Documents/VibeApps/<ProjectName>/`.

## Features

### Vibe Blocks (Main Tab)
- 7 structured design phase inputs displayed in a 2-column grid (including Project Structure & Folders)
- Each phase has a distinct color, icon, description, and placeholder guidance
- **Project Structure** — Tree editor for folders, presets (React/Vite, Node API, Static Site), freeform description, scaffold command, and **feed existing files** (upload src/config files for the AI to extend); whitelisted scaffold commands (`npm create`, `npx create-*`, `mkdir`) run automatically on save
- Optional custom requirement blocks can be added/removed below the grid
- One-click build sends the full design spec to Gemini and saves generated files

### MCP Servers Tab
- **Build with AI** — Describe an MCP server and Gemini generates the full Node.js project, installs dependencies, and registers it
- **Add existing** — Install from npm or point to a local folder
- View and manage all installed MCP servers

### Skills Tab
- **Create with AI** — Describe a skill and Gemini generates a SKILL.md following Anthropic's Skills format
- **Import from GitHub** — Clone a repo and auto-discover all SKILL.md files
- **Browse local** — Scan a local folder for skill files
- Preview and manage installed skills

### Settings
- Gemini API key and model selection (auto-fetches available models)
- PIN-encrypted credential storage (AES-256-GCM encrypted ZIP archive)
- Change PIN without re-entering the API key
- Configurable storage drive paths

### Other
- Custom frameless titlebar with native window controls
- Load/save projects with full state persistence (`vibe-config.json`)
- Launch generated apps directly from the IDE

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 7, Lucide icons
- **Desktop:** Electron 40 (frameless window, IPC for all OS operations)
- **AI:** Google Gemini API (configurable model)
- **Security:** AES-256-GCM encryption via Node.js crypto + adm-zip
- **Styling:** Custom CSS with Outfit font, glassmorphism, mocha color palette

## Project Structure

```
vibe-blocking-ide/
├── electron/
│   ├── main.js          # Electron main process (IPC handlers, file system, encryption)
│   └── preload.cjs      # Context bridge exposing electronAPI to renderer
├── src/
│   ├── App.tsx           # Main React component (all UI + state logic)
│   ├── index.css         # Global styles
│   └── main.tsx          # React entry point
├── vite.config.ts        # Vite dev server config (HMR for Electron)
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- A [Google AI Studio](https://aistudio.google.com/) API key

### Install & Run

```bash
npm install
npm start
```

This runs Vite on port 5173 and launches Electron in development mode with hot reload.

### First Launch
1. Click **Settings** in the sidebar
2. Paste your Gemini API key
3. (Optional) Set a PIN to encrypt and save credentials locally
4. Fill in the 6 design phases for your app
5. Click **Build Vibe App**

Generated files are saved to `Documents/VibeApps/<ProjectName>/`.

### Production Build

```bash
npm run build
npm run build:electron
```

Output goes to `dist-electron/`.

## Current Status

**v0.2.2** — Active development. Recent additions:

- **Project Structure & Folders** — Tree editor for defining folder structure, presets (React/Vite, Node API, Static Site), freeform description, scaffold command, and **feed existing files** (upload files to provide context — the AI extends, modifies, or integrates them). Whitelisted scaffold commands (`npm create`, `npx create-*`, `mkdir`) run automatically when saving a new project.
- **Iterative refinement** — After the first build, a refine input appears in the action bar. Describe changes and hit "Refine Build" to send your previous output + edits back to Gemini for an updated generation.
- **Live preview** — A Preview tab shows generated web apps directly inside the IDE via an inline iframe (`srcdoc`). CSS and JS are inlined automatically. **React+JSX** apps supported via Babel standalone and CDN React. Preview updates after each build or version restore.
- **MCP & Skills in the build pipeline** — Installed MCP server descriptions and Skill file contents are injected into the Gemini prompt at build time. **Structured tool-calling:** Skills via `get_skill(name)`; MCP tools via `call_mcp_tool(server, tool, args)`. The model can invoke installed MCP servers for search, fetch, etc.
- **Version history** — Every build saves a timestamped snapshot under `.vibe-versions/` in the project folder. A version badge in the action bar opens a history panel where you can view and restore any previous build.
- **Cross-platform** — App launching uses Electron's `shell.openPath()` instead of Windows-specific commands. Path handling is platform-agnostic.

### Remaining limitations

- No conversational multi-turn chat (refinement is single-turn against the last output)
- No inline diff view between versions (restore is full-snapshot)

## License

MIT License — see [LICENSE](LICENSE) for details.
