# Release Notes

All notable changes to `@techtrips/ai-assistant` are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/0.1.4/) and the project uses [Semantic Versioning](https://semver.org/).

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| [0.1.6](#016--2026-04-20) | 2026-04-20 | - |
| [0.1.5](#015--2026-04-19) | 2026-04-19 | Context filter fallback to all prompts |
| [0.1.4](#014--2026-04-19) | 2026-04-19 | Context-aware starter prompts, order field fix |
| [0.1.3](#013--2026-04-19) | 2026-04-19 | TemplateForm error handling, removed unused export, updated keywords |
| [0.1.2](#011--2026-04-19) | 2026-04-19 | Extract useAIAssistant hook, Settings extension, parameterized prompts, types/models convention |
| [0.1.1](#011--2026-04-19) | 2026-04-19 | Extract useAIAssistant hook, Settings extension, parameterized prompts, types/models convention |
| [0.1.0](#010--2026-04-19) | 2026-04-19 | Initial release — AIAssistant, TemplateRenderer, TemplateDesigner |


---

## [0.1.6] — 2026-04-20

### Added

- _Update this section before publishing_

### Changed

- _Update this section before publishing_

### Fixed

- _Update this section before publishing_

---

## [0.1.5] — 2026-04-19

### Fixed

- **Context filter fallback** — when no starter prompts match the current page context (e.g. home page), all prompts are now shown instead of an empty list.

---

## [0.1.4] — 2026-04-19

### Added

- **Context-aware starter prompts** — `AIAssistant` accepts a new optional `context` prop (`IAIAssistantContext`) with `page`, `url`, `tags`, and arbitrary string keys. When provided, starter prompt chips are filtered by matching context keywords against each prompt's tags, title, description, and agent name. As the user navigates pages, updating `context` reactively re-filters the visible chips.
- **`IAIAssistantContext` type** — exported as `AIAssistantContext` from the package for consumer use.

### Fixed

- **Order field stale closure** — `handleSubmit` in `useStarterPromptForm` now reads form state via `useRef` instead of a closure-captured `form`, preventing stale values when the user edits the order field and submits quickly.

---

## [0.1.3] — 2026-04-19

### Added

- **TemplateForm error handling** — tool fetching now catches errors and displays inline error messages (`fieldError` style) when tools fail to load or none are available for the selected agent.

### Changed

- **Package keywords** — updated `package.json` keywords for improved npm discoverability.

### Fixed

- **Removed unused export** — removed `export * from "./common"` from `components/index.ts` to clean up the public API surface.

---

## [0.1.2] — 2026-04-19

### Added

- **Settings extension** — new sidebar extension for user and global settings management, gated by `ManageSettings` permission.
- **Parameterized starter prompts** — prompt text supports `{paramName}` (required) and `{paramName?}` (optional) placeholders. Selecting a parameterized prompt opens `PromptParameterForm` with input fields for each parameter.
- **`refreshStarterPrompts`** — new context callback; starter prompt list auto-refreshes after save or delete in the StarterPrompts extension.
- **`THEME_VARS`** — module-level constant for CSS custom properties, replacing per-render `useMemo`.

### Changed

- **`AIAssistant.tsx` is now JSX-only** — all state, effects, callbacks, and memos extracted into the `useAIAssistant` orchestrator hook.
- **File naming convention** — `*.types.ts` for pure type/interface files, `*.models.ts` for files with runtime code (enums, constants, functions). Renamed `SlidePanel.models.ts`, `PageLayout.models.ts`, `common.models.ts`, `ControlEditor.models.ts` to `.types.ts`.
- **Removed `ai-assistant-old` dependency** — all types (`IActionArgs`, `ITemplateInfo`, `ITemplateComponentProps`, `TemplateComponent`) moved into `templates.models.ts`. `IAIAssistantAgent` inlined in `Home.models.ts`. The `ai-assistant-old` folder can now be safely deleted.
- **`Settings` added to `extensions/index.ts`** barrel export for consistency.
- **Message IDs** now use `Date.now() + Math.random()` instead of a shared mutable counter.
- **`resolveCache`** now uses LRU eviction (max 200 entries) to prevent memory leaks in long sessions.
- **`RawDataFallback`** inline styles replaced with `makeStyles` (`rawDataLabel`, `rawDataPre`).
- **Starter prompt form** — removed info icon tooltip from Prompt field; parameter syntax guidance moved to the field description.
- **Documentation updated** — `AGENTS.md`, `docs/AIAssistant.md`, and `.github/copilot-instructions.md` refreshed to reflect current architecture, props, extensions, theming, and conventions.

---

## [0.1.1] — 2026-04-19

### Added
- Documentation fix

---

## [0.1.0] — 2026-04-19

### Added

- **Initial release** of `@techtrips/ai-assistant`.
- **AIAssistant** — Adapter-driven conversational AI chat component.
  - `IChatAdapter` interface for pluggable backends.
  - Built-in `agUiAdapter` for [AG-UI protocol](https://docs.ag-ui.com) streaming.
  - Built-in `restAdapter` for simple REST POST endpoints.
  - Multi-agent support with configurable agent list.
  - Resizable side panel with drag-to-resize via `useResizePanel` hook.
  - Full-screen and side-panel display modes with responsive toggle.
  - Mobile responsive layout — fullscreen overlay on small screens (≤768px).
  - Lazy message loading via `IntersectionObserver` (last 6 eager, older on scroll).
  - Auto-scroll with grandchild and subtree mutation observation.
  - Starter prompt chips for guided onboarding.
  - Voice input with Web Speech API integration.
  - Permission model via `AIAssistantPermission` enum (`View`, `ManageTemplates`, `ManageStarterPrompts`).
  - `useAIAssistantContext()` hook for accessing assistant state from extensions.
  - `useChatState` hook managing messages, streaming, thread lifecycle.
  - `AIAssistantService` with full CRUD for conversations, starter prompts, and templates.
- **Extension system** — Plug-in sidebar views via `AIAssistantExtension`.
  - `defineExtension()` helper for creating extensions with metadata.
  - Built-in extensions: `ConversationHistory`, `StarterPrompts`, `TemplateRenderer`.
  - Permission-gated access per extension.
- **TemplateRenderer** — JSON-driven card rendering engine.
  - Renders `ITemplate` definitions into structured UI cards.
  - 8 built-in control types: `field`, `badge`, `button`, `table`, `image`, `progressBar`, `inputField`, `separator`.
  - Data binding via `IBindable<T>` with dot-path expression syntax.
  - Table control with sorting, searching, summary tiles, and row-click prompts.
  - Form inputs with validation (`text`, `textarea`, `number`, `date`, `dropdown`, `checkbox`, `toggle`, `radio`).
  - Section-level and card-level layout support (`stack`, `row`, `grid`).
  - Action handling for button controls with prompt interpolation.
- **TemplateDesigner** — Visual template editor.
  - Drag-and-drop card and control placement.
  - Property panel for editing control attributes.
  - Live preview mode for real-time template rendering.
  - JSON editor mode for direct template manipulation.
  - Data source schema binding for autocomplete in binding expressions.
  - `extractBindingPaths()` and `validateTemplateJson()` utilities.
- Project setup with Rspack, TypeScript, Biome (lint/format), and React 19.