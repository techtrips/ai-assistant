# Release Notes

All notable changes to `@techtrips/ai-assistant` are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/0.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| [0.1.0](#010--2026-04-19) | 2026-04-19 | Initial release — AIAssistant, TemplateRenderer, TemplateDesigner |


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