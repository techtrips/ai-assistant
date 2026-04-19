# AGENTS.md

This is the **@techtrips/ai-assistant** repository — an adapter-driven React component library for building AI assistant experiences, published to npm as `@techtrips/ai-assistant`.

The library provides the `AIAssistant` chat component, a plug-in extension system, template rendering, and a visual template designer — all built on [Fluent UI v9](https://react.fluentui.dev/) and the [AG-UI protocol](https://docs.ag-ui.com).

## Repo Layout

| Directory | Purpose |
|-----------|---------|
| `src/components/ai-assistant/` | Core `AIAssistant` component, adapters, extensions, chat state |
| `src/components/ai-assistant/adapters/` | `agUiAdapter` (streaming) and `restAdapter` (non-streaming) |
| `src/components/ai-assistant/extensions/` | Built-in extensions: ConversationHistory, StarterPrompts, TemplateRenderer |
| `src/components/ai-assistant/chat-area/` | Chat message display, lazy loading, auto-scroll |
| `src/components/ai-assistant/chat-input/` | Chat input with voice input support |
| `src/components/ai-assistant/sidebar-chat-history/` | Sidebar conversation navigation |
| `src/components/ai-assistant/starter-prompt-chips/` | Onboarding starter prompt chips |
| `src/components/ai-assistant-old/` | Legacy assistant (kept for backwards compat, not exported in new builds) |
| `src/components/templates/` | TemplateRenderer and TemplateDesigner components |
| `src/components/common/` | Shared layout, slide-panel, page-layout |
| `src/hooks/` | Shared React hooks |
| `src/models/` | Shared TypeScript models |
| `src/resources/` | Styles, theme, images |
| `src/utilities/` | Shared utility functions |
| `docs/` | Component documentation (AIAssistant, TemplateRenderer, TemplateDesigner, ChangeLog) |
| `scripts/` | Postversion automation |
| `public/` | Dev app HTML entry |

## Conventions

- **Language**: TypeScript (strict mode)
- **Formatting**: Biome (tabs, double quotes). No Prettier or ESLint
- **Linting**: `biome check .` — recommended rules
- **Package manager**: npm (not yarn or pnpm)
- **Build tool**: Rspack (dev server), `tsc` (library build)
- **Indent style**: Tabs
- **Component style**: Fluent UI `makeStyles` (Griffel)
- **Exports**: All public API flows through `src/index.ts` → `src/components/index.ts` → `src/components/ai-assistant/index.ts`
- **File naming**: PascalCase for components (`AIAssistant.tsx`), camelCase for hooks/utils (`useChatState.ts`)
- **Styles**: Co-located `*.styles.ts` files using `makeStyles`
- **Types**: Co-located `*.types.ts` files

## Key Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Dev server | `npm run dev` (Rspack, port 3000) |
| Build lib | `npm run build` (clean + tsc → `lib/`) |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Lint fix | `npm run lint-fix` |
| Version bump | `npm run versionupdate` (patch bump + changelog scaffold) |
| Publish | `npm publish --access public` |

## Architecture

```
@techtrips/ai-assistant (npm package)
  │
  ├── AIAssistant ─────── Core chat component
  │     ├── adapter ────── IChatAdapter interface (pluggable backend)
  │     │     ├── agUiAdapter ── AG-UI streaming (HttpAgent)
  │     │     └── restAdapter ── REST POST (non-streaming)
  │     ├── extensions ─── Plug-in sidebar views
  │     │     ├── ConversationHistory
  │     │     ├── StarterPrompts
  │     │     └── TemplateRenderer
  │     ├── service ────── IAIAssistantService (CRUD for conversations, prompts, templates)
  │     ├── chat-area ──── Message display, lazy loading, auto-scroll
  │     ├── chat-input ─── Input box, voice input
  │     └── sidebar ────── Collapsible sidebar navigation
  │
  ├── TemplateRenderer ── JSON → UI card rendering engine
  │     └── 8 control types: field, badge, button, table, image, progressBar, inputField, separator
  │
  └── TemplateDesigner ── Visual drag-and-drop template editor
        ├── Property panel
        ├── Live preview
        └── JSON editor
```

### Adapter Pattern

The `AIAssistant` component does NOT know about any specific backend. All message transport flows through the `IChatAdapter` interface:

```ts
interface IChatAdapter {
  sendMessage(request: ISendMessageRequest): AsyncIterable<ChatEvent>;
}
```

Consumers pick or create an adapter:
- `agUiAdapter({ url, getToken })` — AG-UI streaming via `@ag-ui/client`
- `restAdapter({ url, getToken })` — Simple REST POST
- Custom implementation of `IChatAdapter`

### Extension System

Extensions are React components with static `extensionMeta` that self-register into the sidebar. Gated by `AIAssistantPermission`:

| Extension key | Required permission |
|---------------|---------------------|
| `prompts` | `ManageStarterPrompts` |
| `templates` | `ManageTemplates` |

### Service Layer

`IAIAssistantService` provides CRUD for conversations, starter prompts, and templates. The built-in `AIAssistantService` class calls a REST API. Consumers can provide their own implementation.

## Library Build

The library is built with `tsc` (not Rspack). The `tsconfig.prod.json` excludes the dev app files (`App.tsx`, `main.tsx`, `appConfig.ts`, etc.) and outputs declaration files to `lib/`.

Published files: `lib/` (JS + `.d.ts`), `package.json`, `README.md`, `LICENSE`, `docs/`.

## Dev App

The repo includes a standalone Rspack dev app (`src/App.tsx`, `src/main.tsx`) for local development and testing. It is NOT part of the published package.

- Dev server: `npm run dev` → `http://localhost:3000`
- Config: `src/app.config.dev.json` / `src/app.config.prod.json`

## Documentation

| Document | Path |
|----------|------|
| AIAssistant component | `docs/AIAssistant.md` |
| TemplateRenderer schema | `docs/TemplateRenderer.md` |
| TemplateDesigner editor | `docs/TemplateDesigner.md` |
| Changelog | `docs/ChangeLog.md` |

## Important Patterns

- The adapter abstraction is the core design — all AI backends are pluggable via `IChatAdapter`
- Extensions self-describe via `extensionMeta` (key, label, icon) — no central registry
- `useChatState` hook manages all chat state (messages, streaming, thread lifecycle)
- `useResizePanel` hook manages drag-to-resize for side panel mode
- Lazy message loading uses `IntersectionObserver` — last 6 messages render eagerly, older ones load on scroll
- Mobile detection uses `useSyncExternalStore` with `matchMedia` (no resize listeners)
- Biome is the single tool for linting + formatting — do NOT introduce Prettier or ESLint

## DAG (Document Augmented Generation)

When you need deeper framework context, fetch these docs:

| Framework / Tool | Doc URL |
|-----------------|---------|
| AG-UI Protocol | <https://docs.ag-ui.com/concepts/overview> |
| AG-UI Client SDK | <https://docs.ag-ui.com/sdk/js/overview> |
| Fluent UI v9 | <https://storybooks.fluentui.dev/react/llms.txt> |
| Rspack | <https://rspack.rs/llms.txt> |
| Biome | <https://biomejs.dev/> |
| TypeScript | <https://www.typescriptlang.org/docs/> |
