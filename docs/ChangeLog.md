# Release Notes

All notable changes to `@techtrips/ai-assistant` are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| [0.1.0](#010--2026-03-31) | 2026-03-31 | Initial release — AIAssistant


---

## [0.1.0] — 2026-04-19

### Added

- **Initial release** of `@techtrips/ai-assistant`.
- **AIAssistant** — Conversational AI chat component.
  - Multi-agent support with configurable agent routing.
  - [AG-UI protocol](https://github.com/ag-ui-protocol/ag-ui) integration for real-time streaming.
  - Conversation history management (create, list, delete).
  - Starter prompts support for guided onboarding.
  - Template-based structured responses.
  - Configurable display modes: `Copilot` (side panel) and `Fullscreen`.
  - Feature toggles via `AIAssistantFeature` enum (History, StarterPrompts, Templates, AgentThinking, MarkdownResponse).
  - Permission model via `AIAssistantPermission` enum.
  - `useAiAssistantContext()` hook for accessing assistant state.
  - `AIAssistantService` with full CRUD for conversations, starter prompts, templates, and agent execution.
- **TemplateRenderer** — JSON-driven card rendering engine.
  - Renders `ITemplate` definitions into structured UI cards.
  - 8 built-in control types: `field`, `badge`, `button`, `table`, `image`, `progressBar`, `inputField`, `separator`.
  - Data binding via `IBindable<T>` with `{{path.to.value}}` expression syntax.
  - Section-level and card-level layout support.
  - Action handling for button controls.
- **TemplateDesigner** — Visual template editor.
  - Drag-and-drop card and control placement.
  - Property panel for editing control attributes.
  - Live preview mode for real-time template rendering.
  - JSON editor mode for direct template manipulation.
  - Data source schema binding for autocomplete in binding expressions.
  - `extractBindingPaths()` and `validateTemplateJson()` utilities.
- Project setup with Rspack, TypeScript, Biome (lint/format), and React 19.