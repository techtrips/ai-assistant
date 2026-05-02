# @techtrips/ai-assistant

[![version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/techtrips/ai-assistant/blob/main/docs/ChangeLog.md)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/techtrips/ai-assistant/blob/main/LICENSE)

A React component library for building agent-based AI assistants. Provides a production-ready, adapter-driven conversational UI with streaming support, an extension system, and template rendering — all built on [Fluent UI](https://react.fluentui.dev/) and the [AG-UI protocol](https://github.com/ag-ui-protocol).

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Components](#components)
- [Adapters](#adapters)
- [Message Rendering](#message-rendering)
- [Error Handling](#error-handling)
- [Extensions](#extensions)
- [Dependencies](#dependencies)
- [Security](#security)
- [Browser Support](#browser-support)
- [Release Notes](#release-notes)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Adapter-driven architecture** — swap between AG-UI streaming, REST, or custom backends with a single prop
- Conversational AI assistant with multi-agent support and real-time streaming
- Resizable side panel with drag-to-resize, or full-screen mode
- Mobile responsive layout — fullscreen overlay on small screens, side panel on desktop
- Plug-in extension system for conversation history, starter prompts, templates, and custom views
- Starter prompt chips for guided onboarding
- **Pluggable message rendering pipeline** — Templates (DB lookup), Adaptive Cards (deterministic, zero LLM cost), LLM-generated dynamic UI, and GitHub-flavoured Markdown, plus your own custom renderers
- **Lazy-loaded Adaptive Cards** — the Adaptive Cards SDK (~150 kB gz) is only fetched the first time an Adaptive Card payload arrives
- **Abortable rendering** — every render context carries an `AbortSignal` that fires on unmount, so async renderers can cancel in-flight fetches
- **Sanitized by default** — HTML responses pass through DOMPurify before being injected into a shadow root
- JSON-driven template rendering with built-in control types and data binding
- Visual template designer with drag-and-drop, live preview, and JSON editing
- Built on Microsoft Fluent UI for a consistent, accessible design system
- Fully typed with TypeScript — ships with declaration files

---

## Installation

```bash
npm install @techtrips/ai-assistant
```

---

## Quick Start

```tsx
import {
  AIAssistant,
  agUiAdapter,
  AIAssistantPermission,
  defaultMessageRenderers,
  MessageRendererType,
} from "@techtrips/ai-assistant";
import type { IMessageRenderer } from "@techtrips/ai-assistant";

const adapter = agUiAdapter({
  url: "https://agent.example.com/agui",
  getToken: () => getAccessToken(),
});

// Optional: a custom renderer always runs first
const weatherRenderer: IMessageRenderer = {
  type: MessageRendererType.Custom,
  async render(ctx) {
    if (ctx.message.data?.templateId === "weather") {
      return <WeatherCard payload={ctx.message.data.payload} />;
    }
    return undefined; // skip — let the next renderer handle it
  },
};

function App() {
  return (
    <AIAssistant
      chatAdapter={adapter}
      headerText="TechTrips Assistant"
      greetingText="How can I help you today?"
      agents={[{ name: "TechTrips Agent", description: "Handles TechTrips queries" }]}
      permissions={[AIAssistantPermission.View]}
      theme="dark"
      messageRenderers={[weatherRenderer, ...defaultMessageRenderers]}
      onClose={() => console.log("closed")}
    />
  );
}
```

---

## Components

| Component | Description | Documentation |
|-----------|-------------|---------------|
| **AIAssistant** | Adapter-driven conversational AI chat UI with streaming, multi-agent support, extensions, and responsive side-panel / full-screen modes. | [AIAssistant Docs](https://github.com/techtrips/ai-assistant/blob/main/docs/AIAssistant.md) |
---

## Adapters

Adapters are the integration point between the component and your AI backend.

| Adapter | Description |
|---------|-------------|
| `agUiAdapter` | Streams messages via the [AG-UI protocol](https://docs.ag-ui.com). |
| `restAdapter` | Non-streaming adapter for simple REST POST endpoints. |
| Custom | Implement the `IChatAdapter` interface for any backend. |

```tsx
// AG-UI (streaming) — most servers attach a ChatHistoryProvider keyed by
// threadId and rehydrate prior turns server-side, so history is implicit.
const adapter = agUiAdapter({ url: agentUrl, getToken });

// AG-UI against a stateless server — opt in to forwarding prior turns
// from request.history alongside each new user message.
const adapter = agUiAdapter({ url: agentUrl, getToken, forwardHistory: true });

// AG-UI with per-request extra headers (e.g. tenant id, request-scoped
// credentials, correlation ids). Resolved fresh per `sendMessage` and
// merged on top of the auth headers.
const adapter = agUiAdapter({
  url: agentUrl,
  getToken,
  extraHeaders: async () => ({
    "X-Tenant-Id": getTenantId(),
    "X-Correlation-Id": crypto.randomUUID(),
  }),
});

// REST (non-streaming)
const adapter = restAdapter({ url: "/api/chat", getToken });
```

See the [AIAssistant docs](https://github.com/techtrips/ai-assistant/blob/main/docs/AIAssistant.md#adapters) for full adapter API details.

---

## Message Rendering

Assistant messages can carry structured `data` (`{ payload?, templateId? }`) alongside their text. The **message rendering pipeline** transforms that data into rich visual output through an ordered list of `IMessageRenderer`s. Custom renderers always run first; built-ins are filtered by `IAIAssistantSettings.enabledRenderers`. The first renderer to return a non-`undefined` result wins, and results are cached per message ID.

### What `defaultMessageRenderers` contains

`defaultMessageRenderers` is an ordered array of four built-in renderers, exported as-is so consumers can spread, slice, or replace it:

```ts
export const defaultMessageRenderers: IMessageRenderer[] = [
  templateRenderer,      // type: "template"      — fetches template by templateId from IAIAssistantService
  adaptiveCardRenderer,  // type: "adaptiveCard"  — renders payload via the Adaptive Card SDK
  dynamicUiRenderer,     // type: "dynamicUi"     — asks the LLM to generate scoped HTML for payload
  markdownRenderer,      // type: "markdown"      — renders plain content as GFM HTML, sanitized via DOMPurify
];
```

| Renderer | Type key | Triggers when… | Default enabled |
|----------|----------|----------------|-----------------|
| `templateRenderer` | `template` | `message.data.templateId` is set and a template with that ID exists in the DB | Yes |
| `adaptiveCardRenderer` | `adaptiveCard` | `message.data.payload` is set (and `templateRenderer` did not handle it) | Yes |
| `dynamicUiRenderer` | `dynamicUi` | `message.data.payload` is set and earlier renderers skipped — generates HTML via `IAIAssistantService.generateDynamicUi` | No |
| `markdownRenderer` | `markdown` | `message.content` is a non-empty string, or `data.payload` already looks like raw HTML — final fallback | Yes |

Each built-in is also exported individually (`templateRenderer`, `adaptiveCardRenderer`, `dynamicUiRenderer`, `markdownRenderer`, `createAdaptiveCardRenderer`) so you can mix and match. Whether a built-in actually runs is gated by `IAIAssistantSettings.enabledRenderers` — toggleable at runtime from the **Settings** extension.

> **Bundle cost.** `marked`, `dompurify`, and `adaptivecards` are loaded via dynamic `import()` the first time the matching renderer fires. Apps that never see markdown / HTML / Adaptive-Card payloads pay nothing for these dependencies. Combined with the package's `"sideEffects"` declaration, unused renderers are tree-shaken from the consumer build.

### Customising the pipeline

You have four levers, from least to most invasive:

**1. Toggle built-ins via settings.** Pass `settings.enabledRenderers` (or let the user toggle via the Settings extension) — no code changes needed:

```ts
const settings: IAIAssistantSettings = {
  enabledRenderers: { template: true, adaptiveCard: true, dynamicUi: true },
  showAgentActivity: false,
  visibleAgents: [],
};
```

**2. Restrict or reorder built-ins.** Pass an explicit `messageRenderers` array — only those listed are considered:

```tsx
import { templateRenderer, adaptiveCardRenderer } from "@techtrips/ai-assistant";

<AIAssistant
  chatAdapter={adapter}
  messageRenderers={[templateRenderer, adaptiveCardRenderer]}
/>;
```

**3. Add a custom renderer alongside the defaults.** Custom renderers (`type: MessageRendererType.Custom`) always run first regardless of array position — return `undefined` to fall through to the built-ins:

```tsx
import {
  AIAssistant,
  defaultMessageRenderers,
  MessageRendererType,
} from "@techtrips/ai-assistant";
import type { IMessageRenderer, IRenderContext } from "@techtrips/ai-assistant";

const weatherRenderer: IMessageRenderer = {
  type: MessageRendererType.Custom,
  async render(ctx: IRenderContext) {
    // ctx: { message, service?, theme, settings, model?, signal? }
    if (ctx.signal?.aborted) return undefined;
    if (ctx.message.data?.templateId === "weather") {
      return <WeatherCard payload={ctx.message.data.payload} />;
    }
    return undefined; // skip — fall through to defaults
  },
};

<AIAssistant
  chatAdapter={adapter}
  messageRenderers={[weatherRenderer, ...defaultMessageRenderers]}
/>;
```

A renderer can return any of: an HTML string, a React node, or `undefined` to skip. The first non-`undefined` result wins, and results are cached per message ID.

**4. Swap the Adaptive Card adapter.** To keep the pipeline shape but change how Adaptive Cards look or behave, use `createAdaptiveCardRenderer` with a custom `IAdaptiveCardAdapter`:

```tsx
import {
  createAdaptiveCardRenderer,
  templateRenderer,
  dynamicUiRenderer,
} from "@techtrips/ai-assistant";

const myACRenderer = createAdaptiveCardRenderer({
  buildHostConfig: (theme) => ({ /* AC host config */ }),
  dataToCardBody: (data) => [ /* AC body elements */ ],
  postProcess: (root, cardJson) => { /* DOM tweaks */ },
});

<AIAssistant
  chatAdapter={adapter}
  messageRenderers={[templateRenderer, myACRenderer, dynamicUiRenderer]}
/>;
```

See the [Message Rendering Pipeline](https://github.com/techtrips/ai-assistant/blob/main/docs/AIAssistant.md#message-rendering-pipeline) section in the AIAssistant docs for the full `IMessageRenderer`, `IRenderContext`, and `IAdaptiveCardAdapter` API.

---

## Error Handling

The assistant emits structured error events to the optional `onError` prop whenever a chat request fails (network error, adapter rejection, 401/403, etc.). Each event carries a human-readable `message`, an optional `code: ChatErrorCodeLike` for programmatic routing, and an optional `data` bag for adapter-specific context.

```tsx
import { AIAssistant, ChatErrorCode } from "@techtrips/ai-assistant";
import type { IChatErrorEvent } from "@techtrips/ai-assistant";

<AIAssistant
  chatAdapter={adapter}
  onError={(event: IChatErrorEvent) => {
    if (event.code === ChatErrorCode.AuthRequired) {
      // re-prompt the user for a token, refresh credentials, etc.
      promptForToken(event.data);
      return;
    }
    console.error("Chat error:", event.message, event.data);
  }}
/>;
```

`ChatErrorCode` is exported as a const-object so it works in both runtime checks and type narrowing. Currently exported codes:

| Code | Meaning |
|------|---------|
| `AuthRequired` | The backend rejected the request with 401/403 — a fresh token is needed. |

---

## Extensions

Extensions add sidebar navigation items to the assistant. Built-in extensions:

| Extension | Description | Required Permission |
|-----------|-------------|---------------------|
| `ConversationHistory` | Browse and load past conversations. | `View` |
| `StarterPrompts` | Manage starter prompts for guided onboarding. | `ManageStarterPrompts` |
| `TemplateRenderer` | Manage and render structured templates. | `ManageTemplates` |
| `Settings` | Toggle which message renderers (template / adaptive card / dynamic UI) are enabled, manage agent visibility, and developer mode. | `ManageSettings` |

```tsx
import { ConversationHistory, StarterPrompts, TemplateRenderer, AIAssistantService } from "@techtrips/ai-assistant";

const service = new AIAssistantService({ baseUrl: apiUrl, getToken });

<AIAssistant
  adapter={adapter}
  service={service}
  extensions={[ConversationHistory, StarterPrompts, TemplateRenderer]}
  permissions={[AIAssistantPermission.View, AIAssistantPermission.ManageTemplates]}
/>
```

---

## Dependencies

### Peer dependencies

These must be installed by the consumer (most apps already have them):

| Package | Min version | Required? |
|---------|-------------|-----------|
| `react` | `^18.0.0 \|\| ^19.0.0` | **Yes** |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` | **Yes** |
| `@fluentui/react-components` | `^9.73.6` | **Yes** — the entire UI is built on Fluent UI |
| `@ag-ui/client` | `^0.0.48` | **Optional** — only needed if you import `agUiAdapter` |
| `@ag-ui/core` | `^0.0.48` | **Optional** — only needed if you import `agUiAdapter` |

If you're using `restAdapter` or a custom `IChatAdapter`, you can skip the AG-UI packages entirely. They're declared as `peerDependenciesMeta.optional = true` so npm/yarn won't warn.

For consumers who want to be explicit, `agUiAdapter` is also reachable via the `./agui` subpath:

```ts
// Tree-shakeable from the main entry (recommended):
import { agUiAdapter } from "@techtrips/ai-assistant";

// Or, import from the subpath to make the AG-UI dependency obvious to grep:
import { agUiAdapter } from "@techtrips/ai-assistant/agui";
```

### Bundled (runtime) dependencies

| Package | Description |
|---------|-------------|
| `adaptivecards` | Adaptive Cards SDK — lazy-loaded on first use |
| `dompurify` | HTML sanitizer — used by `StreamingMarkdown` and `IsolatedHtmlRenderer` |
| `marked` | GitHub-flavoured Markdown parser — used by `markdownRenderer` |

---

## Security

The library renders agent-supplied content (Markdown, HTML payloads, Adaptive Cards). The default rendering pipeline is sanitized; the notes below describe the assumptions and the surface area to review when overriding defaults.

- **Markdown rendering** (`StreamingMarkdown`, `markdownRenderer`) — Output of `marked` is passed through DOMPurify with `USE_PROFILES: { html: true }`. The default `ALLOWED_URI_REGEXP` rejects `javascript:`, `data:`, and `vbscript:` schemes; do not override `ALLOWED_URI_REGEXP` or pass `ALLOW_UNKNOWN_PROTOCOLS: true` without re-validating the XSS surface.
- **HTML payloads** (`IsolatedHtmlRenderer`) — Renders into a closed shadow root so host page styles don't leak in and the payload's CSS doesn't escape. Combine with a strict CSP (`script-src 'self'`, `frame-ancestors 'none'`) for defence-in-depth.
- **Adaptive Cards** — Rendered via the `adaptivecards` SDK with the bundled host config. Action handlers (`Action.OpenUrl`, `Action.Submit`) are invoked with the payload values directly; if your agent emits user-supplied content into actions, validate it server-side before display.
- **Dynamic UI renderer** — Generates HTML via the LLM. Off by default in v2.0+ (`defaultMessageRenderers` no longer includes it). Opt in only for trusted agents; the generated HTML is rendered through the same shadow-root isolation as static HTML payloads but the prompt itself is the only safeguard against injection.
- **Tokens** — Resolved per-request via the `getToken()` callback. The library does not persist tokens; consumers are responsible for storage (prefer in-memory or HttpOnly cookies over `localStorage`/`sessionStorage`).
- **Token errors** — Both `agUiAdapter` and `restAdapter` accept an `onTokenError(error)` hook. Wire it to your auth flow so silent token failures don't degrade to confusing 401 errors downstream.
- **Debug logs** — Off by default. Set `IAIAssistantSettings.debug = true` to enable internal `console.error` from renderers/adapters during development. Do not enable in production builds.
- **Long chat lists** — The bundled `ChatArea` lazy-mounts message bubbles but does not virtualize. For threads with several hundred messages, wrap the assistant in a paginated container or supply a virtualized custom list via the `messages` slot in a future release.

---

## Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome (latest) | Yes |
| Edge (latest) | Yes |
| Firefox (latest) | Yes |
| Safari (latest) | Yes |

---

## Release Notes

See the full [version history and changelog](https://github.com/techtrips/ai-assistant/blob/main/docs/ChangeLog.md).

---

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/my-feature`)
3. **Commit** your changes (`git commit -m "Add my feature"`)
4. **Push** to the branch (`git push origin feature/my-feature`)
5. **Open** a Pull Request

For questions or feature requests, please [open an issue](https://github.com/techtrips/ai-assistant/issues) or [contact us](mailto:visit.chinmaya@gmail.com).

---

## Authors

Developed and maintained by [Tech Trips](https://github.com/techtrips).

---

## License

This project is licensed under the [MIT License](https://github.com/techtrips/ai-assistant/blob/main/LICENSE).

Copyright © 2026 Tech Trips
