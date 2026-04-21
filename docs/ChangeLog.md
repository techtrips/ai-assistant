# Release Notes

All notable changes to `@techtrips/ai-assistant` are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project uses [Semantic Versioning](https://semver.org/).

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| [1.0.0](#100--2026-04-21) | 2026-04-21 | Pluggable message rendering pipeline, Adaptive Card renderer, unified settings, `chatAdapter` prop rename |
| [0.1.7](#017--2026-04-20) | 2026-04-20 | `renderMessage` gated on `data` presence instead of `payload` |
| [0.1.6](#016--2026-04-20) | 2026-04-20 | Generic adapter data mapping, typed IChatMessageData, resolution pipeline fixes |
| [0.1.5](#015--2026-04-19) | 2026-04-19 | Context filter fallback to all prompts |
| [0.1.4](#014--2026-04-19) | 2026-04-19 | Context-aware starter prompts, order field fix |
| [0.1.3](#013--2026-04-19) | 2026-04-19 | TemplateForm error handling, removed unused export, updated keywords |
| [0.1.2](#011--2026-04-19) | 2026-04-19 | Extract useAIAssistant hook, Settings extension, parameterized prompts, types/models convention |
| [0.1.1](#011--2026-04-19) | 2026-04-19 | Extract useAIAssistant hook, Settings extension, parameterized prompts, types/models convention |
| [0.1.0](#010--2026-04-19) | 2026-04-19 | Initial release — AIAssistant, TemplateRenderer, TemplateDesigner |


---

## [1.0.0] — 2026-04-21

### Added

- **Pluggable message rendering pipeline** — new `IMessageRenderer` interface with `type` and `render(ctx)` method. Messages with `data.payload` or `data.templateId` are routed through a chain of renderers. The first to return a non-`undefined` result wins.
- **`MessageRendererType` enum** — `Template`, `AdaptiveCard`, `DynamicUi`, `Custom`. Custom renderers always run first regardless of array position.
- **`templateRenderer`** — built-in renderer that fetches templates by `templateId` from the DB via `IAIAssistantService`.
- **`adaptiveCardRenderer`** — built-in renderer using the Adaptive Card SDK for deterministic, zero-LLM-cost rendering of `payload` data. Smart layout selection based on data shape (cards, tables, metrics).
- **`dynamicUiRenderer`** — built-in renderer that sends `payload` to the LLM to generate themed HTML UI. Disabled by default.
- **`createAdaptiveCardRenderer(adapter?)`** — factory for custom Adaptive Card renderers with overridable host config, layout, and post-processing via `IAdaptiveCardAdapter`.
- **`IAdaptiveCardAdapter` interface** — `buildHostConfig(theme)`, `dataToCardBody(data)`, `postProcess(root, cardJson)` for full control over AC rendering.
- **`defaultAdaptiveCardAdapter` export** — the built-in adapter, so consumers can extend rather than rewrite.
- **`defaultMessageRenderers` export** — the default pipeline: `[templateRenderer, adaptiveCardRenderer, dynamicUiRenderer]`.
- **`IRenderContext` type** — context passed to renderers: `message`, `service`, `theme`, `settings`, `model`.
- **`RenderResult` type** — `string | React.ReactNode | undefined`.
- **`messageRenderers` prop** on `AIAssistantProps` — pass only the renderers you want. If omitted, defaults apply (filtered by settings).
- **`enabledRenderers` on `IAIAssistantSettings`** — `Record<string, boolean>` keyed by `MessageRendererType`. Controls which built-in renderers are active. Custom renderers cannot be disabled.
- **`DEFAULT_ENABLED_RENDERERS` export** — `{ template: true, adaptiveCard: true, dynamicUi: false }`.
- **`DEFAULT_SETTINGS` export** — full default settings object.
- **Settings extension renderer toggles** — per-renderer toggle switches for Template, Adaptive Card, and Dynamic UI in the Settings sidebar, with descriptions.
- **`buildRendererChain()`** — internal utility that merges consumer renderers with settings: Custom always first, built-ins gated by `enabledRenderers`.

### Changed

- **BREAKING: `adapter` prop renamed to `chatAdapter`** — the main `IAIAssistantProps` prop for the chat adapter is now `chatAdapter` (was `adapter`).
- **BREAKING: `renderMessage` prop removed** — replaced by the `messageRenderers` pipeline. Consumers should migrate to custom `IMessageRenderer` implementations.
- **BREAKING: `IChatMessage.data` type changed** — now typed as `IChatMessageData` (`{ payload?: string, templateId?: string }`) instead of `Record<string, unknown>`.
- **BREAKING: `IChatMessage.content` is optional** — tool-only messages may not have text content.
- **`ChatEvent.text-done`** — `data` field is now typed as `IChatMessageData` instead of `Record<string, unknown>`. `content` is optional.
- **Settings merge** — `enabledRenderers` replaces the old individual booleans (`enableTemplateResolution`, `enableDynamicUi`). User and global settings are merged with `DEFAULT_ENABLED_RENDERERS` as the base.
- **Rendering pipeline** — built-in renderers no longer self-gate via settings. The pipeline handles filtering centrally via `buildRendererChain()`.
- **LRU cache** — `resolveCache` now caches rendered results (was: resolved data). Max 200 entries with eviction.

### Removed

- **`renderMessage` prop** — replaced by `messageRenderers` pipeline.
- **`enableTemplateResolution` setting** — replaced by `enabledRenderers.template`.
- **`enableDynamicUi` setting** — replaced by `enabledRenderers.dynamicUi`.

---

## [0.1.7] — 2026-04-20

### Fixed

- **`renderMessage` not called for history messages** — the callback was gated on `message.data?.payload` being truthy. Messages with only `templateId` (no `payload`) were skipped. Now gated on `message.data` presence, letting the consumer decide what to render.

---

## [0.1.6] — 2026-04-20

### Added

- **`mapData` callback on `agUiAdapter`** — configurable transform from AG-UI tool call results to the library's canonical `IChatMessageData`. Default: tool results → `payload`, first tool name → `templateId`. Override for agents with different conventions.
- **`mapData` callback on `restAdapter`** — configurable transform from raw REST JSON response to `IChatMessageData`. Default: looks for `data`/`payload` and `templateId`/`template` fields.
- **`defaultMapData` export** — the built-in AG-UI data mapper, exported so consumers can extend rather than rewrite.
- **`IToolCallInfo` type** — protocol-neutral tool call shape (`id`, `name`, `args?`, `result?`) surfaced to `mapData` callbacks.
- **`MapDataFn` type** — callback signature for data mapping.

### Changed

- **`IChatMessageData`** — fixed model with `payload?: string` and `templateId?: string`. All agent data is transformed into this shape at the adapter boundary.
- **`IChatMessage.content`** — now optional. Tool-only messages may not have text.
- **Adapter architecture** — adapters are now the transform layer. The library's internal model is agent-agnostic; adapters handle agent-specific data mapping via `mapData`.
- **Resolution pipeline** — `resolveMessageImpl` catch blocks now log with `console.error` instead of silently swallowing errors.

### Fixed

- **Duplicate messages in conversation history** — turn-based merge in API groups consecutive assistant/tool rows.
- **History messages not resolving to templates** — API now falls back to text content as `payload` when tool results are absent but `templateId` exists.
- **Message ordering** — secondary sort by role when timestamps are identical (user before assistant).

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