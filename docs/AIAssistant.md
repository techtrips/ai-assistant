# AIAssistant

A modern, adapter-driven AI chat component built with Fluent UI v9. Features streaming responses, conversation history, starter prompts with parameterized placeholders, templates, resizable side-panel / full-screen modes, and a plug-in extension system.

## Usage

```tsx
import { AIAssistant, agUiAdapter } from '@techtrips/ai-assistant';

const adapter = agUiAdapter({
  url: 'https://agent.example.com/agui',
  getToken: () => getAccessToken(),
});

<AIAssistant
  adapter={adapter}
  headerText="My AI Assistant"
  greetingText="How can I help you today?"
  permissions={[AIAssistantPermission.View]}
  theme="dark"
  onClose={() => setOpen(false)}
/>
```

### Using the REST adapter

```tsx
import { AIAssistant, restAdapter } from '@techtrips/ai-assistant';

const adapter = restAdapter({
  url: '/api/chat',
  getToken: () => getAccessToken(),
});

<AIAssistant adapter={adapter} />
```

### With a service for extensions

```tsx
import {
  AIAssistant,
  agUiAdapter,
  AIAssistantService,
  AIAssistantPermission,
} from '@techtrips/ai-assistant';

const adapter = agUiAdapter({ url: agentUrl, getToken });
const service = new AIAssistantService({ baseUrl: apiBaseUrl, getToken });

<AIAssistant
  adapter={adapter}
  service={service}
  permissions={[
    AIAssistantPermission.View,
    AIAssistantPermission.ManageTemplates,
    AIAssistantPermission.ManageStarterPrompts,
    AIAssistantPermission.ManageSettings,
  ]}
/>
```

## Props — `IAIAssistantProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `adapter` | `IChatAdapter` | Yes | — | Chat adapter that handles message transport (see Adapters below). |
| `theme` | `'light' \| 'dark'` | No | `'light'` | Color theme. |
| `greetingText` | `string` | No | — | Greeting shown when the chat is empty. |
| `headerText` | `string` | No | `'AI Assistant'` | Header title text. |
| `defaultFullScreen` | `boolean` | No | `false` | Start in full-screen mode. |
| `showFullScreenToggle` | `boolean` | No | `true` | Show the full-screen / side-panel toggle button. |
| `className` | `string` | No | — | Additional CSS class for the root element. |
| `extensions` | `AIAssistantExtension[]` | No | Built-in (ConversationHistory, StarterPrompts, TemplateRenderer, Settings) | Plug-in extensions for the sidebar. |
| `renderMessage` | `(message: IChatMessage) => ReactNode` | No | — | Custom renderer for chat messages. |
| `service` | `IAIAssistantService` | No | — | Service implementation for extension data (conversations, templates, prompts, settings, agent names). |
| `permissions` | `AIAssistantPermission[]` | No | `[View]` | Permissions controlling which extensions are accessible. |
| `onClose` | `() => void` | No | — | Callback when the close button is clicked. |

## Adapters

Adapters are the integration point between the component and your AI backend. Two built-in adapters are provided:

### `agUiAdapter`

Streams messages via the [AG-UI protocol](https://docs.ag-ui.com).

```ts
import { agUiAdapter } from '@techtrips/ai-assistant';

const adapter = agUiAdapter({
  url: 'https://agent.example.com/agui',
  getToken: () => getAccessToken(),
});
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `url` | `string` | Yes | AG-UI agent endpoint URL. |
| `getToken` | `() => Promise<string>` | Yes | Async function returning an access token. |

### `restAdapter`

Non-streaming adapter for simple REST POST endpoints.

```ts
import { restAdapter } from '@techtrips/ai-assistant';

const adapter = restAdapter({
  url: '/api/chat',
  getToken: () => getAccessToken(),
  extractText: (json) => json.answer,
});
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `url` | `string` | Yes | REST endpoint URL. |
| `getToken` | `() => Promise<string>` | No | Async function returning an access token. |
| `extractText` | `(json: unknown) => string` | No | Custom extractor for the response text. Defaults to `json.text ?? json.message ?? JSON.stringify(json)`. |

### Custom adapter

Implement the `IChatAdapter` interface:

```ts
interface IChatAdapter {
  sendMessage(request: ISendMessageRequest): AsyncIterable<ChatEvent>;
}
```

`ChatEvent` is a discriminated union:

| Type | Fields | Description |
|------|--------|-------------|
| `text-delta` | `content: string` | Incremental streaming token. |
| `text-done` | `content: string, data?: Record<string, unknown>` | Final complete message. |
| `error` | `message: string` | Error event. |

## Extensions

Extensions add sidebar navigation items (e.g. conversation history, templates). Define an extension with `defineExtension`:

```ts
import { defineExtension } from '@techtrips/ai-assistant';

const MyExtension = defineExtension(MyExtensionComponent, {
  key: 'my-extension',
  label: 'My Extension',
  icon: MyIcon,
});

<AIAssistant adapter={adapter} extensions={[MyExtension]} />
```

Built-in extensions: `ConversationHistory`, `StarterPrompts`, `TemplateRenderer`, `Settings`.

### Extension permissions

Extensions requiring elevated access are gated by `AIAssistantPermission`:

| Extension key | Required permission |
|---------------|---------------------|
| `prompts` | `ManageStarterPrompts` |
| `templates` | `ManageTemplates` |
| `settings` | `ManageSettings` |

## Starter Prompts

Starter prompts are onboarding suggestions shown on the welcome screen as chips. They support parameterized placeholders:

- `{paramName}` — required parameter (user must fill in before sending)
- `{paramName?}` — optional parameter (can be left empty)

When a user selects a prompt with parameters, a `PromptParameterForm` renders input fields. Required fields show a red `*`, optional fields show "(optional)". The resolved prompt is sent once the user submits.

Example prompt text: `Search for credit requests for agreement {agreementId} in {region?}`

## Types

### `IStarterPrompt`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | No | Unique prompt ID. |
| `agentName` | `string` | No | Associated agent name. |
| `title` | `string` | Yes | Display title. |
| `description` | `string` | No | Short description. |
| `prompt` | `string` | No | Prompt text with optional `{param}` / `{param?}` placeholders. |
| `parameters` | `string[]` | No | Parameter names (auto-detected from prompt text). |
| `tags` | `string[]` | No | Categorisation tags. |
| `order` | `number` | No | Display order (lower = first). |

### `IChatMessage`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique message ID. |
| `role` | `'user' \| 'assistant' \| 'error'` | Message role. |
| `content` | `string` | Message text. |
| `timestamp` | `string` | ISO timestamp. |
| `data` | `Record<string, unknown>` | Optional metadata. |

### `AIAssistantPermission`

| Value | Description |
|-------|-------------|
| `View` | Basic view access. |
| `ManageTemplates` | Can create/edit/delete templates. |
| `ManageStarterPrompts` | Can create/edit/delete starter prompts. |
| `ManageSettings` | Can modify user and global settings. |

### `IAIAssistantService`

Service interface for extension data operations. Use the built-in `AIAssistantService` class or provide your own implementation:

```ts
import { AIAssistantService } from '@techtrips/ai-assistant';

const service = new AIAssistantService({
  baseUrl: 'https://api.example.com',
  getToken: () => getAccessToken(),
});
```

| Method | Description |
|--------|-------------|
| `getAgentNames()` | Fetches available agent names. |
| `getUserSettings()` | Fetches user-level settings. |
| `getGlobalSettings()` | Fetches global (admin) settings. |
| `saveUserSettings(settings)` | Saves user-level settings. |
| `saveGlobalSettings(settings)` | Saves global settings. |
| `getConversationHistory()` | Fetches all conversations for the user. |
| `getConversationMessages(threadId)` | Fetches messages for a conversation thread. |
| `deleteConversation(threadId)` | Deletes a conversation. |
| `generateDynamicUi(payload, prompt?, model?)` | Generates dynamic HTML UI from agent response data. |
| `getStarterPrompts(agentNames)` | Fetches starter prompts filtered by agent names. |
| `addStarterPrompt(prompt)` | Creates a new starter prompt. |
| `updateStarterPrompt(prompt)` | Updates an existing starter prompt. |
| `deleteStarterPrompt(promptId, agentName?)` | Deletes a starter prompt. |
| `getTemplates()` | Fetches all templates. |
| `getTemplateById(templateId)` | Fetches a template by ID. |
| `addTemplate(template)` | Creates a new template. |
| `updateTemplate(template)` | Updates an existing template. |
| `deleteTemplate(templateId)` | Deletes a template. |