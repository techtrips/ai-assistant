# AIAssistant

A modern, adapter-driven AI chat component built with Fluent UI v9. Features streaming responses, conversation history, starter prompts, templates, resizable side-panel / full-screen modes, and a plug-in extension system.

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
  agents={[{ name: 'OrderAgent', description: 'Handles orders' }]}
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

### With a custom service for extensions

```tsx
import { AIAssistant, agUiAdapter, AIAssistantService } from '@techtrips/ai-assistant';

const adapter = agUiAdapter({ url: agentUrl, getToken });
const service = new AIAssistantService({ baseUrl: apiBaseUrl, getToken });

<AIAssistant
  adapter={adapter}
  service={service}
  permissions={[AIAssistantPermission.View, AIAssistantPermission.ManageTemplates]}
  extensions={[ConversationHistory, StarterPrompts, TemplateRenderer]}
/>
```

## Props — `IAIAssistantProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `adapter` | `IChatAdapter` | Yes | — | Chat adapter that handles message transport (see Adapters below). |
| `theme` | `'light' \| 'dark'` | No | — | Color theme. |
| `greetingText` | `string` | No | — | Greeting shown when the chat is empty. |
| `headerText` | `string` | No | `'AI Assistant'` | Header title text. |
| `defaultFullScreen` | `boolean` | No | `false` | Start in full-screen mode. |
| `showFullScreenToggle` | `boolean` | No | `true` | Show the full-screen / side-panel toggle button. |
| `className` | `string` | No | — | Additional CSS class for the root element. |
| `extensions` | `AIAssistantExtension[]` | No | — | Plug-in extensions (e.g. `ConversationHistory`, `StarterPrompts`, `TemplateRenderer`). |
| `renderMessage` | `(message: IChatMessage) => ReactNode` | No | — | Custom renderer for chat messages. |
| `service` | `IAIAssistantService` | No | — | Service implementation for extension data (conversations, templates, prompts). |
| `permissions` | `AIAssistantPermission[]` | No | `[View]` | Permissions controlling which extensions are accessible. |
| `agents` | `IAIAssistantAgent[]` | No | — | List of available agents. |
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

Built-in extensions: `ConversationHistory`, `StarterPrompts`, `TemplateRenderer`.

### Extension permissions

Extensions requiring elevated access are gated by `AIAssistantPermission`:

| Extension key | Required permission |
|---------------|---------------------|
| `prompts` | `ManageStarterPrompts` |
| `templates` | `ManageTemplates` |

## Types

### `IAIAssistantAgent`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Agent name. |
| `description` | `string` | No | Human-readable agent description. |

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

### `IAIAssistantService`

Service interface for extension data operations. Combines `IStarterPromptService`, `ITemplateService`, and `IConversationService`. Use the built-in `AIAssistantService` class or provide your own implementation:

```ts
import { AIAssistantService } from '@techtrips/ai-assistant';

const service = new AIAssistantService({
  baseUrl: 'https://api.example.com',
  getToken: () => getAccessToken(),
});
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `runAgent` | `(request: IRunAgentRequest) => Promise<IRunAgentResult>` | Runs an agent and returns the response. |
| `getConversationHistory` | `() => Promise<IEntity<IAIAssistantConversation[]>>` | Fetches all conversations for the user. |
| `getConversationMessages` | `(threadId: string) => Promise<IEntity<IAIAssistantMessage[]>>` | Fetches messages for a conversation thread. |
| `getAIModels` | `() => Promise<IEntity<IAIAssistantModel[]>>` | Fetches available AI model deployments. |
| `generateDynamicUi` | `(payload, customPrompt?, model?) => Promise<string \| undefined>` | Generates dynamic HTML UI from agent response data. |
| `getStarterPrompts` | `() => Promise<IEntity<IAIAssistantStarterPrompt[]>>` | Fetches starter prompts. |
| `addStarterPrompt` | `(prompt) => Promise<IEntity<IAIAssistantStarterPrompt>>` | Creates a new starter prompt. |
| `updateStarterPrompt` | `(prompt) => Promise<IEntity<IAIAssistantStarterPrompt>>` | Updates an existing starter prompt. |
| `deleteStarterPrompt` | `(promptId, agentName?) => Promise<IEntity<void>>` | Deletes a starter prompt. |
| `getTemplates` | `() => Promise<IEntity<IAIAssistantTemplate[]>>` | Fetches all templates. |
| `getTemplateById` | `(templateId) => Promise<IEntity<IAIAssistantTemplate>>` | Fetches a template by ID. |
| `addTemplate` | `(template) => Promise<IEntity<IAIAssistantTemplate>>` | Creates a new template. |
| `updateTemplate` | `(template) => Promise<IEntity<IAIAssistantTemplate>>` | Updates an existing template. |
| `deleteTemplate` | `(templateId) => Promise<IEntity<void>>` | Deletes a template. |

### `ITemplateInfo`

Passed to the `getTemplate` callback prop.

| Field | Type | Description |
|-------|------|-------------|
| `templateName` | `string` | Name of the template to resolve. |
| `error` | `string \| undefined` | Error message, if any. |