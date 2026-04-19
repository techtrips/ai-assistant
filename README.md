# @techtrips/ai-assistant

[![version](https://img.shields.io/badge/version-0.1.6-blue.svg)](https://github.com/techtrips/agent-ui/blob/main/agent-ui-react/docs/ChangeLog.md)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/techtrips/agent-ui/blob/main/agent-ui-react/LICENSE)

A React component library for building agent-based AI assistants. Provides a production-ready, adapter-driven conversational UI with streaming support, an extension system, and template rendering — all built on [Fluent UI](https://react.fluentui.dev/) and the [AG-UI protocol](https://github.com/ag-ui-protocol).

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Components](#components)
- [Adapters](#adapters)
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
- Custom message rendering via `renderMessage` prop
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
import { AIAssistant, agUiAdapter, AIAssistantPermission } from "@techtrips/ai-assistant";

const adapter = agUiAdapter({
  url: "https://agent.example.com/agui",
  getToken: () => getAccessToken(),
});

function App() {
  return (
    <AIAssistant
      adapter={adapter}
      headerText="My AI Assistant"
      greetingText="How can I help you today?"
      agents={[{ name: "OrderAgent", description: "Handles orders" }]}
      permissions={[AIAssistantPermission.View]}
      theme="dark"
      onClose={() => console.log("closed")}
    />
  );
}
```

---

## Components

| Component | Description | Documentation |
|-----------|-------------|---------------|
| **AIAssistant** | Adapter-driven conversational AI chat UI with streaming, multi-agent support, extensions, and responsive side-panel / full-screen modes. | [AIAssistant Docs](https://github.com/techtrips/agent-ui/blob/main/agent-ui-react/docs/AIAssistant.md) |
| **TemplateRenderer** | Renders JSON-defined `ITemplate` objects against server data. Displays structured, data-bound UI cards with support for built-in control types. | [TemplateRenderer Docs](https://github.com/techtrips/agent-ui/blob/main/agent-ui-react/docs/TemplateRenderer.md) |
| **TemplateDesigner** | Visual drag-and-drop editor for creating and editing `ITemplate` JSON definitions. Includes property panel, live preview, JSON editing, and data source binding. | [TemplateDesigner Docs](https://github.com/techtrips/agent-ui/blob/main/agent-ui-react/docs/TemplateDesigner.md) |

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

See the [AIAssistant docs](https://github.com/techtrips/agent-ui/blob/main/agent-ui-react/docs/AIAssistant.md#adapters) for full adapter API details.

---

## Extensions

Extensions add sidebar navigation items to the assistant. Built-in extensions:

| Extension | Description | Required Permission |
|-----------|-------------|---------------------|
| `ConversationHistory` | Browse and load past conversations. | `View` |
| `StarterPrompts` | Manage starter prompts for guided onboarding. | `ManageStarterPrompts` |
| `TemplateRenderer` | Manage and render structured templates. | `ManageTemplates` |

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

See the full [version history and changelog](https://github.com/techtrips/agent-ui/blob/main/agent-ui-react/docs/ChangeLog.md).

---

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/my-feature`)
3. **Commit** your changes (`git commit -m "Add my feature"`)
4. **Push** to the branch (`git push origin feature/my-feature`)
5. **Open** a Pull Request

For questions or feature requests, please [open an issue](https://github.com/techtrips/agent-ui/issues) or [contact us](mailto:visit.chinmaya@gmail.com).

---

## Authors

Developed and maintained by [Tech Trips](https://github.com/techtrips).

---

## License

This project is licensed under the [MIT License](https://github.com/techtrips/agent-ui/blob/main/agent-ui-react/LICENSE).

Copyright © 2026 Tech Trips
