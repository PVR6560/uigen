# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup (installs deps, generates Prisma client, runs migrations)
npm run setup

# Development server (Turbopack)
npm run dev

# Development server in background (logs to logs.txt)
npm run dev:daemon

# Build
npm run build

# Run all tests
npm test

# Run a single test file
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx

# Lint
npm run lint

# Reset database
npm run db:reset
```

## Environment

Copy `.env.bak` to `.env`. The app runs without `ANTHROPIC_API_KEY` — it falls back to a `MockLanguageModel` that returns static component code. Add a real key to use Claude.

The JWT secret defaults to `"development-secret-key"` when `JWT_SECRET` is not set.

All `npm run` scripts require `node-compat.cjs` via `NODE_OPTIONS='--require'` for Node.js compatibility.

## Architecture

**UIGen** is an AI-powered React component generator with live preview. Users describe a component in chat; Claude generates JSX/TSX files into a virtual in-memory filesystem; a sandboxed iframe renders the result in real time.

### Data flow

1. User sends a chat message via `ChatContext` (`src/lib/contexts/chat-context.tsx`)
2. `ChatContext` calls `POST /api/chat` with messages + serialized virtual filesystem
3. The API route (`src/app/api/chat/route.ts`) streams responses from Claude (or mock), with two tools available: `str_replace_editor` and `file_manager`
4. Tool calls are intercepted client-side via `onToolCall` in `ChatContext` and dispatched to `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`)
5. `FileSystemContext` mutates the `VirtualFileSystem` instance and triggers a refresh
6. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) detects the refresh, transforms JSX files to blob URLs via `src/lib/transform/jsx-transformer.ts`, and injects them into a sandboxed `<iframe>` via an import map

### Key abstractions

- **`VirtualFileSystem`** (`src/lib/file-system.ts`): In-memory filesystem. Serializes to/from plain JSON for API transport and Prisma storage. Files are stored in a flat `Map<string, FileNode>` with a root directory tree.
- **`FileSystemContext`**: React context wrapping a single `VirtualFileSystem` instance. All UI components read/write files through this context. The `handleToolCall` method translates AI tool calls into filesystem mutations.
- **`ChatContext`**: Wraps Vercel AI SDK's `useChat` hook. Passes the serialized filesystem as request body on every message so the server can reconstruct state.
- **`getLanguageModel()`** (`src/lib/provider.ts`): Returns real `anthropic(claude-haiku-4-5)` when `ANTHROPIC_API_KEY` is set, otherwise returns `MockLanguageModel`.
- **AI tools** (`src/lib/tools/`): `str_replace_editor` handles file create/view/str_replace/insert; `file_manager` handles rename/delete.

### Preview iframe

`PreviewFrame` resolves the entry point by checking these paths in order: `/App.jsx`, `/App.tsx`, `/index.jsx`, `/index.tsx`, `/src/App.jsx`, `/src/App.tsx`. If none exist, it falls back to the first `.jsx`/`.tsx` file found.

The iframe uses:
- `https://cdn.tailwindcss.com` for Tailwind CSS
- `https://esm.sh/<package>` for any third-party npm imports (auto-resolved at runtime)
- Blob URLs for all virtual filesystem files

### AI generation conventions

The system prompt (`src/lib/prompts/generation.tsx`) enforces these rules for generated components:
- Every project must have a root `/App.jsx` as the entry point
- Local file imports must use the `@/` alias (e.g., `@/components/Button`)
- Use Tailwind CSS for styling, not inline styles
- No HTML files — `App.jsx` is the only entry point

### Persistence

Authenticated users' projects are stored in SQLite via Prisma. The `Project` model stores chat `messages` and file `data` as JSON strings. Anonymous users' work is tracked in `src/lib/anon-work-tracker.ts` and can be claimed after sign-up.

Auth uses JWT cookies (`jose`), not NextAuth. Session handling is in `src/lib/auth.ts`; the middleware at `src/middleware.ts` protects routes.

### Prisma

The database schema is defined in `prisma/schema.prisma`. Reference it anytime you need to understand the structure of data stored in the database.

Generated client output is `src/generated/prisma` (not the default location). After schema changes, run `npx prisma migrate dev` and `npx prisma generate`.

## Code Style

Use comments sparingly. Only comment complex code.

### Testing

Tests use Vitest + jsdom + React Testing Library. Test files live next to their source in `__tests__/` subdirectories.
