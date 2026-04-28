# @techtrips/ai-assistant

[![version](https://img.shields.io/badge/version-0.1.7-blue.svg)](https://github.com/techtrips/ai-assistant/blob/main/docs/ChangeLog.md)
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
- [Extensions](#extensions)
- [Dependencies](#dependencies)
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
- **Pluggable message rendering pipeline** — Templates (DB lookup), Adaptive Cards (deterministic, zero LLM cost), and LLM-generated dynamic UI, plus your own custom renderers
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
// AG-UI (streaming)
const adapter = agUiAdapter({ url: agentUrl, getToken });

// REST (non-streaming)
const adapter = restAdapter({ url: "/api/chat", getToken });
```

See the [AIAssistant docs](https://github.com/techtrips/ai-assistant/blob/main/docs/AIAssistant.md#adapters) for full adapter API details.

---

## Message Rendering

Assistant messages can carry structured `data` (`{ payload?, templateId? }`) alongside their text. The **message rendering pipeline** transforms that data into rich visual output through an ordered list of `IMessageRenderer`s. Custom renderers always run first; built-ins are filtered by `IAIAssistantSettings.enabledRenderers`. The first renderer to return a non-`undefined` result wins, and results are cached per message ID.

### Built-in renderers

| Renderer | Type key | Behaviour | Default enabled |
|----------|----------|-----------|-----------------|
| `templateRenderer` | `template` | Fetches a template by `templateId` from the DB via `IAIAssistantService` | Yes |
| `adaptiveCardRenderer` | `adaptiveCard` | Renders `payload` using the [Adaptive Card SDK](https://adaptivecards.io/) — deterministic, zero LLM cost | Yes |
| `dynamicUiRenderer` | `dynamicUi` | Sends `payload` to the LLM to generate HTML UI on the fly | No |

```tsx
import {
  AIAssistant,
  agUiAdapter,
  defaultMessageRenderers,
  templateRenderer,
  adaptiveCardRenderer,
  MessageRendererType,
} from "@techtrips/ai-assistant";
import type { IMessageRenderer } from "@techtrips/ai-assistant";

// 1. Use the defaults (template + adaptive card on, dynamic UI off)
<AIAssistant chatAdapter={adapter} />

// 2. Restrict the pipeline to specific renderers only
<AIAssistant
  chatAdapter={adapter}
  messageRenderers={[templateRenderer, adaptiveCardRenderer]}
/>

// 3. Add your own custom renderer (always runs first)
const myRenderer: IMessageRenderer = {
  type: MessageRendererType.Custom,
  async render(ctx) {
    if (ctx.message.data?.templateId === "weather") {
      return <WeatherCard payload={ctx.message.data.payload} />;
    }
    return undefined; // skip — let the next renderer handle it
  },
};

<AIAssistant
  chatAdapter={adapter}
  messageRenderers={[myRenderer, ...defaultMessageRenderers]}
/>;
```

### Customising Adaptive Cards

Provide an `IAdaptiveCardAdapter` to override host config, layout, or post-processing without writing a renderer from scratch:

```tsx
import { createAdaptiveCardRenderer } from "@techtrips/ai-assistant";

const myACRenderer = createAdaptiveCardRenderer({
  buildHostConfig: (theme) => ({ /* AC host config */ }),
  dataToCardBody: (data) => [ /* AC body elements */ ],
  postProcess: (root, cardJson) => { /* DOM tweaks */ },
});
```

See the [Message Rendering Pipeline](https://github.com/techtrips/ai-assistant/blob/main/docs/AIAssistant.md#message-rendering-pipeline) section in the AIAssistant docs for the full `IMessageRenderer`, `IRenderContext`, and `IAdaptiveCardAdapter` API.

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

### Runtime

| Package | Description |
|---------|-------------|
| `@ag-ui/client` | AG-UI protocol client for agent communication |
| `@ag-ui/core` | AG-UI protocol core types and utilities |
| `@fluentui/react-components` | Microsoft Fluent UI React component library |
| `react` | React library |
| `react-dom` | React DOM renderer |
| `react-router` | Declarative routing for React |

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
