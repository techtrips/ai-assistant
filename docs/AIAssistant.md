# AIAssistant

A modern, adapter-driven AI chat component built with Fluent UI v9. Features streaming responses, a pluggable message-rendering pipeline (templates, Adaptive Cards, LLM-generated UI), conversation history, starter prompts with parameterized placeholders, context-aware filtering, resizable side-panel / full-screen modes, and a plug-in extension system.

## Usage

```tsx
import { AIAssistant, agUiAdapter } from '@techtrips/ai-assistant';

const adapter = agUiAdapter({
  url: 'https://agent.example.com/agui',
  getToken: () => getAccessToken(),
});

<AIAssistant
  chatAdapter={adapter}
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

<AIAssistant chatAdapter={adapter} />
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
  chatAdapter={adapter}
  service={service}
  permissions={[
    AIAssistantPermission.View,
    AIAssistantPermission.ManageTemplates,
    AIAssistantPermission.ManageStarterPrompts,
    AIAssistantPermission.ManageSettings,
  ]}
/>
```

### With custom message renderers

```tsx
import {
  AIAssistant,
  agUiAdapter,
  MessageRendererType,
  defaultMessageRenderers,
} from '@techtrips/ai-assistant';
import type { IMessageRenderer } from '@techtrips/ai-assistant';

const myCustomRenderer: IMessageRenderer = {
  type: MessageRendererType.Custom,
  async render(ctx) {
    const data = ctx.message.data;
    if (data?.templateId === 'my-special-card') {
      return `<div class="special">${data.payload}</div>`;
    }
    return undefined; // skip — let the next renderer handle it
  },
};

<AIAssistant
  chatAdapter={adapter}
  messageRenderers={[myCustomRenderer, ...defaultMessageRenderers]}
/>
```

### With context-aware starter prompts

```tsx
<AIAssistant
  chatAdapter={adapter}
  service={service}
  context={{ page: 'dashboard', tags: ['analytics', 'reports'] }}
/>
```

## Props — `IAIAssistantProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `chatAdapter` | `IChatAdapter` | Yes | — | Chat adapter that handles message transport (see Adapters below). |
| `theme` | `'light' \| 'dark'` | No | `'light'` | Color theme. |
| `greetingText` | `string` | No | — | Greeting shown when the chat is empty. |
| `headerText` | `string` | No | `'AI Assistant'` | Header title text. |
| `defaultFullScreen` | `boolean` | No | `false` | Start in full-screen mode. |
| `showFullScreenToggle` | `boolean` | No | `true` | Show the full-screen / side-panel toggle button. |
| `className` | `string` | No | — | Additional CSS class for the root element. |
| `extensions` | `AIAssistantExtension[]` | No | Built-in (ConversationHistory, StarterPrompts, TemplateRenderer, Settings) | Plug-in extensions for the sidebar. |
| `messageRenderers` | `IMessageRenderer[]` | No | `defaultMessageRenderers` | Message renderer pipeline. Pass only the renderers you want. Custom-type renderers always run first. If omitted, all defaults apply (filtered by settings). |
| `service` | `IAIAssistantService` | No | — | Service implementation for extension data (conversations, templates, prompts, settings, agent names). |
| `permissions` | `AIAssistantPermission[]` | No | `[View]` | Permissions controlling which extensions are accessible. |
| `context` | `IAIAssistantContext` | No | — | Page context for starter prompt filtering. Keys: `page`, `url`, `tags`, plus arbitrary keys. |
| `onClose` | `() => void` | No | — | Callback when the close button is clicked. |

## Adapters

Adapters are the integration point between the component and your AI backend. They handle message transport AND data transformation. Two built-in adapters are provided:

### `agUiAdapter`

Streams messages via the [AG-UI protocol](https://docs.ag-ui.com).

```ts
import { agUiAdapter } from '@techtrips/ai-assistant';

const adapter = agUiAdapter({
  url: 'https://agent.example.com/agui',
  getToken: () => getAccessToken(),
  mapData: (toolCalls) => {
    // Custom transform from agent tool results to IChatMessageData
    const result = toolCalls.find(t => t.name === 'my_tool')?.result;
    return result ? { payload: result, templateId: 'my-template' } : undefined;
  },
});
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `url` | `string` | Yes | AG-UI agent endpoint URL. |
| `getToken` | `() => Promise<string>` | Yes | Async function returning an access token. |
| `mapData` | `MapDataFn` | No | Transform tool call results into `IChatMessageData`. Default: tool results → `payload`, first tool name → `templateId`. |

### `restAdapter`

Non-streaming adapter for simple REST POST endpoints.

```ts
import { restAdapter } from '@techtrips/ai-assistant';

const adapter = restAdapter({
  url: '/api/chat',
  getToken: () => getAccessToken(),
  extractText: (json) => json.answer,
  mapData: (json) => ({
    payload: JSON.stringify(json.data),
    templateId: json.template,
  }),
});
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `url` | `string` | Yes | REST endpoint URL. |
| `getToken` | `() => Promise<string>` | No | Async function returning an access token. |
| `extractText` | `(json: unknown) => string` | No | Custom extractor for the response text. Defaults to `json.text ?? json.message ?? JSON.stringify(json)`. |
| `mapData` | `(json: unknown) => IChatMessageData \| undefined` | No | Custom transform from raw JSON to `IChatMessageData`. Default: looks for `data`/`payload` and `templateId`/`template` fields. |

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
| `text-done` | `content?: string, data?: IChatMessageData` | Final complete message with optional structured data. |
| `error` | `message: string` | Error event. |

## Message Rendering Pipeline

The rendering pipeline transforms `IChatMessageData` (attached to assistant messages) into rich visual output. Messages with `data.payload` or `data.templateId` are automatically routed through the pipeline.

### How it works

1. `buildRendererChain()` assembles the active renderer list from props and settings.
2. Custom-type renderers (`MessageRendererType.Custom`) always run first, regardless of array position.
3. Built-in renderers are filtered by `IAIAssistantSettings.enabledRenderers` — disabled renderers are skipped.
4. The chain executes in order — the first renderer to return a non-`undefined` result wins.
5. Results are cached per message ID with LRU eviction (max 200 entries).

### Built-in renderers

| Renderer | Type key | Behaviour | Default enabled |
|----------|----------|-----------|-----------------|
| `templateRenderer` | `template` | Fetches a template by `templateId` from the DB via `IAIAssistantService` | Yes |
| `adaptiveCardRenderer` | `adaptiveCard` | Renders `payload` using the Adaptive Card SDK — deterministic, zero LLM cost | Yes |
| `dynamicUiRenderer` | `dynamicUi` | Sends `payload` to the LLM to generate HTML UI | No |

### Pipeline configuration

```tsx
// Use only defaults (template → adaptive card → dynamic UI, filtered by settings)
<AIAssistant chatAdapter={adapter} />

// Use custom + defaults
<AIAssistant
  chatAdapter={adapter}
  messageRenderers={[myRenderer, ...defaultMessageRenderers]}
/>

// Use only specific renderers
<AIAssistant
  chatAdapter={adapter}
  messageRenderers={[templateRenderer, adaptiveCardRenderer]}
/>
```

### Custom renderers

```ts
const myRenderer: IMessageRenderer = {
  type: MessageRendererType.Custom,
  async render(ctx) {
    // ctx.message, ctx.service, ctx.theme, ctx.settings, ctx.model
    if (ctx.message.data?.templateId === 'weather') {
      return <WeatherCard data={ctx.message.data.payload} />;
    }
    return undefined; // skip
  },
};
```

### Adaptive Card adapter

Override the built-in Adaptive Card rendering with a custom adapter:

```ts
import { createAdaptiveCardRenderer } from '@techtrips/ai-assistant';
import type { IAdaptiveCardAdapter } from '@techtrips/ai-assistant';

const myAdapter: IAdaptiveCardAdapter = {
  buildHostConfig(theme) { return { /* AC host config */ }; },
  dataToCardBody(data) { return [ /* AC body elements */ ]; },
  postProcess(root, cardJson) { /* DOM manipulation */ },
};

const myACRenderer = createAdaptiveCardRenderer(myAdapter);

<AIAssistant
  chatAdapter={adapter}
  messageRenderers={[myACRenderer, dynamicUiRenderer]}
/>
```

## Extensions

Extensions add sidebar navigation items (e.g. conversation history, templates). Define an extension with `defineExtension`:

```ts
import { defineExtension } from '@techtrips/ai-assistant';

const MyExtension = defineExtension(MyExtensionComponent, {
  key: 'my-extension',
  label: 'My Extension',
  icon: MyIcon,
});

<AIAssistant chatAdapter={adapter} extensions={[MyExtension]} />
```

Built-in extensions: `ConversationHistory`, `StarterPrompts`, `TemplateRenderer`, `Settings`.

### Extension permissions

Extensions requiring elevated access are gated by `AIAssistantPermission`:

| Extension key | Required permission |
|---------------|---------------------|
| `prompts` | `ManageStarterPrompts` |
| `templates` | `ManageTemplates` |
| `settings` | `ManageSettings` |

## Settings

`IAIAssistantSettings` controls runtime behaviour. The Settings extension provides a UI for managing these:

```ts
interface IAIAssistantSettings {
  enabledRenderers: Record<string, boolean>;  // keyed by MessageRendererType
  showAgentActivity: boolean;                 // developer mode
  visibleAgents: string[];                    // empty = all agents
}
```

`DEFAULT_ENABLED_RENDERERS`: `{ template: true, adaptiveCard: true, dynamicUi: false }`.

Settings are split into user-level and global-level. Global settings propagate as defaults for all users. User settings override per-user. The Settings extension renders per-renderer toggles for Template, Adaptive Card, and Dynamic UI.

## Starter Prompts

Starter prompts are onboarding suggestions shown on the welcome screen as chips. They support parameterized placeholders:

- `{paramName}` — required parameter (user must fill in before sending)
- `{paramName?}` — optional parameter (can be left empty)

When a user selects a prompt with parameters, a `PromptParameterForm` renders input fields. Required fields show a red `*`, optional fields show "(optional)". The resolved prompt is sent once the user submits.

Example prompt text: `Search for credit requests for agreement {agreementId} in {region?}`

### Context-aware filtering

When the `context` prop is provided, starter prompt chips are filtered by matching context keywords (`page`, `url`, `tags`, etc.) against each prompt's tags, title, description, and agent name. Falls back to showing all prompts when no context matches.

## Types

### `IChatMessageData`

| Field | Type | Description |
|-------|------|-------------|
| `payload` | `string` | Serialized data string for rendering (from tool results or agent response). |
| `templateId` | `string` | Template identifier for DB-based rendering. |

### `IStarterPrompt`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | No | Unique prompt ID. |
| `agentName` | `string` | No | Associated agent name. |
| `title` | `string` | Yes | Display title. |
| `description` | `string` | No | Short description. |
| `prompt` | `string` | No | Prompt text with optional `{param}` / `{param?}` placeholders. |
| `parameters` | `string[]` | No | Parameter names (auto-detected from prompt text). |
| `tags` | `string[]` | No | Categorisation tags (used for context filtering). |
| `templates` | `string[]` | No | Associated template IDs. |
| `order` | `number` | No | Display order (lower = first). |

### `IChatMessage`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique message ID (`msg-{timestamp}-{random}`). |
| `role` | `'user' \| 'assistant' \| 'error'` | Message role. |
| `content` | `string \| undefined` | Message text. Optional — tool-only messages may not have text. |
| `timestamp` | `string` | ISO timestamp. |
| `data` | `IChatMessageData \| undefined` | Structured data for the rendering pipeline. |

### `IAIAssistantContext`

| Field | Type | Description |
|-------|------|-------------|
| `page` | `string` | Current page identifier. |
| `url` | `string` | Current URL. |
| `tags` | `string[]` | Context tags for prompt filtering. |
| `[key]` | `unknown` | Arbitrary additional context keys. |

### `AIAssistantPermission`

| Value | Description |
|-------|-------------|
| `View` | Basic view access. |
| `ManageTemplates` | Can create/edit/delete templates. |
| `ManageStarterPrompts` | Can create/edit/delete starter prompts. |
| `ManageSettings` | Can modify user and global settings. |

### `MessageRendererType`

| Value | Description |
|-------|-------------|
| `Template` (`"template"`) | DB template lookup by `templateId`. |
| `AdaptiveCard` (`"adaptiveCard"`) | Adaptive Card SDK rendering. |
| `DynamicUi` (`"dynamicUi"`) | LLM-generated HTML. |
| `Custom` (`"custom"`) | Consumer-provided renderer (always runs first). |

### `IMessageRenderer`

| Field | Type | Description |
|-------|------|-------------|
| `type` | `MessageRendererType` | Renderer type identifier. |
| `render` | `(ctx: IRenderContext) => Promise<RenderResult>` | Render function. Return `undefined` to skip. |

### `IRenderContext`

| Field | Type | Description |
|-------|------|-------------|
| `message` | `IChatMessage` | The message being rendered. |
| `service` | `IAIAssistantService \| undefined` | Service for DB lookups. |
| `theme` | `'light' \| 'dark'` | Current theme. |
| `settings` | `IAIAssistantSettings` | Current settings (including `enabledRenderers`). |
| `model` | `string \| undefined` | LLM model name (for dynamic UI). |

### `IAdaptiveCardAdapter`

| Method | Description |
|--------|-------------|
| `buildHostConfig(theme)` | Build the host config JSON passed to the Adaptive Card SDK. |
| `dataToCardBody(data)` | Convert parsed data into Adaptive Card body elements. |
| `postProcess(root, cardJson)` | Post-process the rendered DOM before HTML serialisation. |

### `ISendMessageRequest`

| Field | Type | Description |
|-------|------|-------------|
| `threadId` | `string` | Conversation thread ID. |
| `messageId` | `string` | Unique message ID. |
| `message` | `string` | User's message text. |
| `model` | `string \| undefined` | Optional LLM model override. |
| `abortSignal` | `AbortSignal \| undefined` | Signal for cancelling the request. |

### `IToolCallInfo`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Tool call ID. |
| `name` | `string` | Tool name. |
| `args` | `string \| undefined` | Serialized arguments. |
| `result` | `string \| undefined` | Serialized result. |

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

### `useAIAssistantContext`

Hook for accessing the assistant context from within extensions or child components:

```ts
import { useAIAssistantContext } from '@techtrips/ai-assistant';

const {
  sendMessage,
  selectPrompt,
  newChat,
  selectConversation,
  messages,
  threadId,
  service,
  permissions,
  agentNames,
  starterPrompts,
  theme,
  settings,
  messageRenderers,
  updateSettings,
} = useAIAssistantContext();
```