# Release Notes

All notable changes to `@techtrips/ai-assistant` are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.1/) and the project uses [Semantic Versioning](https://semver.org/).

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| [1.8.0](#180--2026-05-02) | 2026-05-02 | Settings panel gained admin-controlled **extension visibility toggles**, **renderer reorder UI**, and **Markdown** renderer toggle. **Default renderer chain** trimmed: `dynamicUi` removed (still exported — hosts must opt in via `messageRenderers`). New **`agentName` prop** on `<AIAssistant>` is now the single source of truth for agent scoping; `AIAssistantService` constructor no longer accepts `agentName` (use `setAgentName` for non-React consumers). |
| [1.7.0](#170--2026-05-02) | 2026-05-02 | Per-agent isolation extended to **templates** and **user/global settings** (alongside existing prompts, conversations, agent names) — scoped `AIAssistantService` embeds no longer share template lists or settings with the host app |
| [1.6.0](#160--2026-05-02) | 2026-05-02 | Logs panel polish: turn dropdown (server-driven via new `getThreadTurns`), infinite-scroll pagination, collapsible rows, hide-duplicates toggle, content-derived friendly thread names in history & logs |
| [1.5.4](#154--2026-05-01) | 2026-05-01 | Re-publish of 1.5.3 (`agUiAdapter` correctness pass: per-call `HttpAgent`, deduped error events, abort-listener cleanup, opt-in `forwardHistory`) |
| [1.5.3](#153--2026-05-01) | 2026-05-01 | `agUiAdapter` correctness pass: per-call `HttpAgent` (no concurrent-call races), deduped error events, abort-listener cleanup, opt-in `forwardHistory` |
| [1.5.0](#150--2026-05-01) | 2026-05-01 | **Breaking:** default renderer chain reordered to `template → markdown → adaptiveCard → dynamicUi` so the assistant's prose answer wins over raw tool payloads |
| [1.4.2](#142--2026-05-01) | 2026-05-01 | Adaptive Card renderer unwraps MCP tool-result envelopes (also covers reloaded conversation history) |
| [1.4.1](#141--2026-05-01) | 2026-05-01 | AG-UI adapter unwraps MCP content blocks before exposing them as `data.payload` |
| [1.4.0](#140--2026-05-01) | 2026-05-01 | Hover-revealed copy button on every chat message |
| [1.3.1](#131--2026-05-01) | 2026-05-01 | Scoped `AIAssistantService` now also constrains starter prompts and agent-name list to the configured agent |
| [1.3.0](#130--2026-05-01) | 2026-05-01 | `AIAssistantService` accepts an `agentName` scope so embeds (e.g. Agent Playground) get a sidebar with only their own threads |
| [1.2.0](#120--2026-05-01) | 2026-05-01 | Conversation history forwarded on every `sendMessage` so stateless adapters can give the agent context of prior turns |
| [1.1.2](#112--2026-05-01) | 2026-05-01 | Fix StrictMode-induced cache poisoning that left assistant messages rendering as raw markdown; removed AbortSignal threading from the cached resolver |
| [1.1.1](#111--2026-05-01) | 2026-05-01 | Revert lazy loading of `marked` and `dompurify` (kept lazy for `adaptivecards`); markdown messages were rendering as raw text in some bundles |
| [1.1.0](#110--2026-05-01) | 2026-05-01 | Scalability pass: lazy-loaded heavy deps, abortable render pipeline, sanitize memoization, shared adapter HTTP helpers, `sideEffects` for tree-shaking |
| [1.0.1](#101--2026-05-01) | 2026-05-01 | Structured chat error events with `onError` prop and `ChatErrorCode` codes, themed sidebar history scrollbar |
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
## [1.8.0] — 2026-05-02

Admins (`ManageSettings` permission) can now tailor the assistant chrome and message-rendering pipeline at runtime, without code changes from the host app. This release also consolidates agent scoping behind a single `agentName` prop on `<AIAssistant>`.

### Added

- **`agentName` prop on `<AIAssistant>`.** Single source of truth for the agent the assistant is talking to. When set, the bootstrap effect skips the `getAgentNames()` discovery call and pushes the value into the service via `setAgentName()` so per-request URLs (templates, settings, conversations, starter prompts) stay scoped without the host having to configure it twice.
- **`IAIAssistantService.setAgentName(name?)`.** New required method on the service contract. The built-in `AIAssistantService` ships an implementation; custom service implementations must add one (no-op is fine for unscoped backends).
- **Visible features (extensions) toggle.** New "Visible features" section in Settings lists every extension actually configured on the assistant (`extensions` prop — or the package defaults if omitted). Admins can hide/show each one (the `Settings` extension itself stays visible to admins so they can recover). Stored as `IAIAssistantSettings.enabledExtensions: Record<string, boolean>` in **global** settings.
- **Renderer order UI.** New "Renderer order" section with up/down buttons lets admins reorder the active renderer chain. Saved as `IAIAssistantSettings.rendererOrder: string[]` in **global** settings; `buildRendererChain` honors it (renderers not in the list keep their relative order at the end).
- **Markdown renderer toggle.** `MessageRendererType.Markdown` is now a first-class entry in the renderer enable/disable list (previously it was implicitly always-on).
- Context exposes `configuredExtensions` and `configuredRendererTypes` for extensions that need to introspect the host setup.

### Changed

- **Breaking:** `ICreateServiceOptions.agentName` removed. Pass the scope via the `<AIAssistant agentName="…">` prop, or call `service.setAgentName(name)` directly for non-React consumers. This eliminates the dual-source-of-truth where hosts had to keep the prop and the constructor option in sync.
- **Breaking:** `IAIAssistantService` now requires a `setAgentName(name?)` method. Custom service implementations must add one.
- **Default renderer chain trimmed:** `defaultMessageRenderers` is now `[template, adaptiveCard, markdown]`. `dynamicUiRenderer` is still exported but **opt-in** — hosts that want LLM-generated HTML must pass an explicit `messageRenderers` prop including it. This avoids surprise LLM-token costs in default deployments.
- **Removed `visibleAgents` setting.** Redundant now that services are scoped per-agent and the prop drives discovery; the agent picker UI was removed alongside it.

### Migration

For each `<AIAssistant>` site:

```diff
- new AIAssistantService({ baseUrl, getToken, agentName: "My Agent" })
+ new AIAssistantService({ baseUrl, getToken })

  <AIAssistant
+   agentName="My Agent"
    service={service}
    …
  />
```

Custom `IAIAssistantService` implementations must add `setAgentName(name?: string): void`. A no-op body is acceptable when the backend isn't agent-scoped.

---
## [1.7.0] — 2026-05-02

Completes the per-agent isolation story so multiple `AIAssistantService` embeds in the same app no longer leak data between each other.

### Added

- **Templates scoped by agent.** `getTemplates()` now appends `?agentName=<scope>` when the service was constructed with an `agentName`, and the API filters the table by the matching `agent` field. Embeds (e.g. Agent Playground) see only templates they own.
- **Settings scoped by agent.** Both user and global AI settings (`getUserSettings`, `saveUserSettings`, `getGlobalSettings`, `saveGlobalSettings`) now pass the `agentName` query param. The server stores them under a row key of `settings__<agent>`, falling back to the legacy `settings` row when no scope is supplied (back-compat for unscoped hosts).

### Changed

- `ICreateServiceOptions.agentName` doc updated: it now scopes conversations, starter prompts, agent-name list, **templates**, and **user/global settings**.

### Notes

- Hosts that previously instantiated `AIAssistantService` without an `agentName` continue to read/write the global rows — no migration required. Adding `agentName` to an existing embed will start it from a clean per-agent slate.

---
## [1.6.0] — 2026-05-02

Logs side-panel reaches feature-parity with the chat: pick a turn, scroll back through history, hide noisy intermediate snapshots, and see human-readable thread names everywhere.

### Added

- **Logs turn dropdown.** New `getThreadTurns(threadId)` on `IConversationService` returns one entry per user message (`runId`, label, `firstSeen`). Default `AIAssistantService` calls `GET /conversations/{threadId}/turns`. The Logs panel populates its dropdown from this endpoint so older turns appear without paginating through every event. Falls back to deriving turns from loaded events when the host service doesn't expose the new method.
- **Infinite-scroll pagination.** `useRawLogs` now requests events page-by-page (50 per page, newest first); scrolling near the top of the list prepends the previous batch and preserves the visible row.
- **Hide duplicates toggle.** Client-side option (default on) collapses consecutive identical assistant snapshots within a turn — useful for orchestrator agents that emit intermediate state. Toggle is hidden when there are no events.
- **Collapsible event rows.** Each row now starts collapsed with a chevron; click to expand/collapse the content body.
- **Content-derived friendly thread names.** New `friendlyThreadName(text)` util takes a chat message (or any text) and produces a short title-cased label (e.g. `Add Hook React`). Used in the sidebar chat history, the conversation history extension, and the Logs page header.

### Changed

- **Logs page header** now shows `<friendly-name> — Logs` for "All turns" or `Turn N: <prompt>` when a specific turn is selected (so the changing prefix stays visible even when the header is truncated).
- **`PageLayout`** title truncates with ellipsis and surfaces the full text via the `title` attribute.
- **Conversation history sidebar / panel** display the friendly name as the primary label; the original first-message text moves to the tooltip.
- **Server `getThreadEvents`** now returns consecutive identical assistant snapshots verbatim (was previously deduping). The client controls the toggle.

### Removed

- `ChatMessageBubble` no longer renders the `Tools used` footer; tool activity is visible in the Logs panel instead.

### Notes for hosts

- The `getThreadTurns` method is **optional**. Existing services without it continue to work — the dropdown will fall back to deriving turns from the loaded event window.
- API hosts implementing the default service should expose `GET /conversations/:threadId/turns` (Hono route + controller + service example included in `techtrips-api`).

---
## [1.5.4] — 2026-05-01

Re-publish of 1.5.3 with no functional changes. See the [1.5.3](#153--2026-05-01) entry for details.

### Fixed

- **`agUiAdapter` no longer races on concurrent `sendMessage` calls.** Previously a single cached `HttpAgent` was reused across calls and mutated on every run (`threadId`, `headers`, `model`, `setMessages`). Two concurrent chats from the same adapter (multi-thread UI, regenerate-while-typing, two `<AIAssistant />` mounts sharing one adapter) could clobber each other's thread id and message list mid-flight. A fresh `HttpAgent` is now constructed per `sendMessage` invocation.
- **Single error event per failure.** AG-UI emits both `onRunErrorEvent` and `onRunFailed` for one failure; `useChatState` was rendering two error bubbles. The adapter now dedupes via an internal flag so consumers see exactly one `{ type: "error" }` per failure.
- **Abort listener leak.** The listener attached to `request.abortSignal` is now registered with `{ once: true }` and explicitly removed in `finally`. Previously each `sendMessage` invocation left a closure attached to the consumer's signal.

### Added

- **`forwardHistory` option on `agUiAdapter`.** When `true`, prior conversation turns from `request.history` are sent alongside the user message in each AG-UI run. Default `false` because most AG-UI servers (TechTrips included) attach a `ChatHistoryProvider` keyed by `threadId` and rehydrate prior turns server-side — forwarding history in that setup would duplicate every turn. Set to `true` for stateless AG-UI servers.

---

## [1.5.3] — 2026-05-01

### Fixed

- **`agUiAdapter` no longer races on concurrent `sendMessage` calls.** A fresh `HttpAgent` is now constructed per `sendMessage` invocation instead of reusing a single cached instance whose `threadId` / `headers` / `model` / `messages` were mutated on every run.
- **Single error event per failure.** Deduped `onRunErrorEvent` / `onRunFailed` / catch-block error sources so a single failure produces a single `{ type: "error" }` event.
- **Abort listener leak.** Listener attached to `request.abortSignal` is now registered with `{ once: true }` and explicitly removed in `finally`.

### Added

- **`forwardHistory` option on `agUiAdapter`.** Opt-in forwarding of prior conversation turns from `request.history` for stateless AG-UI servers. Default `false`.

---
## [1.5.0] — 2026-05-01

### Changed (mildly breaking)

- **`defaultMessageRenderers` now runs `template → markdown → adaptiveCard → dynamicUi`** (markdown moved from last to second).

  The previous order (`template → adaptiveCard → dynamicUi → markdown`) meant Adaptive Card would always beat the assistant's prose whenever a tool was called and a payload was attached — producing 2-column “Title | Content” tables of raw tool data instead of the LLM's synthesized answer.

  Templates still run first because they are the most explicit consumer-controlled signal (`data.templateId` matched against a registered template). The markdown renderer self-skips when `message.content` is empty, so structured-only tool responses still flow through to AC / dynamic-ui as before. Net effect: prose answers render as prose; tool-only payloads still render as cards; explicit templates still win.

  **Migration:** consumers always have full control of order by passing their own `messageRenderers={[…]}` prop. Consumers that depend on AC always beating markdown can pass `[templateRenderer, adaptiveCardRenderer, dynamicUiRenderer, markdownRenderer]` explicitly. Consumers using `defaultMessageRenderers` get the new order automatically.

---

## [1.4.2] — 2026-05-01

### Fixed

- **Adaptive Card renderer now unwraps MCP tool-result envelopes itself.** 1.4.1 fixed the live-message path inside `agUiAdapter`, but messages reloaded from a conversation-history API still carried the raw `{ content: [{ type: "text", text: "…" }], structuredContent: {…} }` shape in `data.payload`. AC turned that into a useless 2-column “Type | Text” table whose row contained the inner JSON. `renderAdaptiveCard` now: (1) prefers `structuredContent` when present, (2) else JSON-parses each text block, (3) else returns `undefined` so the markdown renderer takes over and the assistant's prose answer is shown.

---

## [1.4.1] — 2026-05-01

### Fixed

- **MCP content-block unwrapping in `agUiAdapter`.** MCP tools return their results wrapped as `[{ "type": "text", "text": "<inner>" }, ...]`. The previous `defaultMapData` exposed that wrapper directly as `data.payload`, which caused the Adaptive Card renderer to render a useless 2-column “Type | Text” table whose row contained the raw inner JSON — burying the assistant's actual answer. The mapper now detects the content-block shape, unwraps to the inner content, and JSON-parses each block. Structured inner content (rich item arrays, key/value objects) flows to AC and renders properly; plain-text inner content is dropped from `payload` so the assistant's markdown answer wins instead.

---

## [1.4.0] — 2026-05-01

### Added

- **Copy button on every chat message.** Hovering (or keyboard-focusing) a user or assistant message reveals a small Fluent UI subtle button that copies the message to the clipboard. Copies `message.content` (the original markdown source) when present — great for pasting answers into another agent, doc, or PR — and falls back to `message.data.payload` for tool-result-only messages. Tooltip flips to “Copied” for 1.5s after each successful copy. Pure UI — no API surface change.

---

## [1.3.1] — 2026-05-01

### Fixed

- **Scoped service no longer leaks other agents' starter prompts.** When `AIAssistantService` is constructed with `agentName`, `getStarterPrompts()` now ignores the caller's `agentNames` argument and constrains to the configured agent, and `getAgentNames()` short-circuits to `[agentName]`. This stops the embed from auto-loading and rendering starter prompt cards belonging to the host app's other agents (visible in 1.3.0 inside the Agent Playground).

---

## [1.3.0] — 2026-05-01

### Added

- **`AIAssistantService` agent scope.** `ICreateServiceOptions` now accepts an optional `agentName`. When provided, `getConversationHistory` forwards it as `?agentName=` to `/conversations`, so the chat-history sidebar surfaces only threads belonging to that agent. Use this when embedding `<AIAssistant />` for a specific agent (e.g. the Agent Playground's `PlaygroundOrchestrator`) so the sidebar isn't polluted by threads from the host app's main assistant. The API filter is additive — existing callers that omit `agentName` still see all of the user's conversations.

---

## [1.2.0] — 2026-05-01

### Added

- **Conversation history on `ISendMessageRequest`.** The chat host now snapshots prior user/assistant turns from the on-screen thread (capped at the last 20 turns) and forwards them to the adapter as `request.history: ReadonlyArray<ChatHistoryEntry>`. Stateless backends — custom REST agents, A2A endpoints, the playground orchestrator's LLM call — can replay them so the agent has memory of the conversation without persisting anything client-side. Stateful adapters (AG-UI with a `ChatHistoryProvider`) can ignore the field; their server-managed history wins.
- New exported type `ChatHistoryEntry` (`{ role: "user" | "assistant"; content: string }`).
- `restAdapter` includes `history` in the default request body so any REST endpoint that POSTs through the helper gets it for free.

### Notes

- Existing adapters that override `mapBody` are unaffected and can opt-in by reading `request.history`.
- The window size (20 turns) is intentionally small to keep payloads bounded; long-running threads should rely on the server's own history provider rather than the client window.

---

## [1.1.2] — 2026-05-01

### Fixed

- **Markdown messages rendered as raw text after the first render in StrictMode.** The 1.1.0 scalability pass threaded an `AbortSignal` through the cached `resolveMessage` chain. In React StrictMode the first effect mount aborts on cleanup, the chain bails out with `undefined`, and that `undefined` gets cached forever — so the second mount (and all subsequent reads) saw "no result" and the bubble fell back to the raw-text branch. The signal threading has been removed; the hook layer's `disposed` flag is the only thing that needs to swallow stale results, and it doesn't poison the cache.

### Changed

- `IRenderContext.signal` removed (it was added in 1.1.0 and never observed by any renderer in practice).
- `resolveMessage` no longer accepts an `AbortSignal`. Renderers always run to completion so cached promises resolve to a stable value across remounts.

---

## [1.1.1] — 2026-05-01

### Fixed

- Markdown messages were rendering as raw text in some consumer bundles. Reverted the dynamic `import("marked")` introduced in 1.1.0 to a static import — markdown is the default fallback for nearly every assistant reply, so deferring it offered little benefit. Same for `dompurify`, which sanitises every HTML render.
- `IsolatedHtmlRenderer` no longer goes through an async-load + `useState` round-trip; sanitisation is now a synchronous `useMemo` keyed by the raw HTML.

### Changed

- `adaptivecards` is still loaded lazily, since it is the heaviest dependency (~150 kB gz) and only fires when an Adaptive Card payload is received.

---

## [1.1.0] — 2026-05-01

### Added

- `signal?: AbortSignal` on `IRenderContext`. The render pipeline now bails out between renderers when the host component unmounts or the request is cancelled. `useResolveMessage` creates an `AbortController` per render and aborts it on cleanup.
- Shared adapter HTTP helpers in `adapters/http.ts` (`buildAuthHeaders`, `httpStatusToErrorCode`). Both `restAdapter` and `agUiAdapter` use them, eliminating duplicated bearer-token / 401-403 mapping logic.
- `"sideEffects": ["**/*.css"]` declaration in `package.json` so consumer bundlers can tree-shake unused renderers and adapters.

### Changed

- **Lazy-loaded heavy dependencies.** `marked`, `dompurify` and `adaptivecards` (~250 kB combined) are no longer imported eagerly. They load via dynamic `import()` the first time the matching renderer fires, so apps that never receive markdown / HTML / Adaptive-Card payloads pay zero bundle cost. *(See 1.1.1 — `marked` and `dompurify` were reverted to static imports.)*
- `IsolatedHtmlRenderer` now memoizes the sanitized HTML keyed by the raw input. Theme toggles, resizes and unrelated re-renders no longer re-run DOMPurify or rewrite the shadow root.

### Breaking

- `renderAdaptiveCard(payload, theme?, adapter?)` is now `async` and returns `Promise<string | undefined>` (was `string | undefined`). Required to support lazy-loading the Adaptive Cards SDK. Consumers calling it directly must `await` the result; the built-in `adaptiveCardRenderer` is unaffected.

---

## [1.0.1] — 2026-05-01

### Added

- `onError` prop on `<AIAssistant>` for receiving structured chat error events. Plumbed through `useAIAssistant` and `useChatState`.
- `ChatErrorCode` const-object and `ChatErrorCodeLike` type exported from the package root. Codes include `AuthRequired`, allowing consumers to react to 401/403 responses (e.g. re-prompt for tokens).
- Error events now carry an optional `code: ChatErrorCodeLike` and `data?: Record<string, unknown>` payload so consumers can route handling based on the underlying cause.

### Fixed

- Sidebar chat history scrollbar now uses themed colors (transparent track, themed thumb with hover) instead of the browser default, which appeared jarring against the dark theme.

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