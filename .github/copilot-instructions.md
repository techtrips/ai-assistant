Read the `AGENTS.md` at the repo root before making changes. It has commands, conventions, architecture, and DAG doc links.

This is an npm component library (`@techtrips/ai-assistant`). The published package is built with `tsc` to `lib/`. The dev app (Rspack) is for local testing only and is NOT published.

## Conventions

- **TypeScript**: Biome (tabs, double quotes). No Prettier or ESLint.
- **Package manager**: npm only.
- **Component style**: Fluent UI v9 `makeStyles` (Griffel). No inline styles.
- **File structure**: Co-located `*.styles.ts`, `*.types.ts` (pure types) or `*.models.ts` (has runtime code) per component.
- **CSS custom properties**: Child components use `var(--agent-chat-*)` variables, NOT Fluent tokens directly.
- **Plain inputs**: Use plain `<input>` / `<textarea>` (not Fluent `<Input>`) when CSS custom properties need to apply.

## Key Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Version | `npm run versionupdate` |
| Publish | `npm publish --access public` |

## Architecture

The `AIAssistant` component uses an **adapter pattern** — all AI backends are pluggable via `IChatAdapter`. Built-in adapters: `agUiAdapter` (AG-UI streaming), `restAdapter` (REST POST).

`AIAssistant.tsx` is **JSX-only** — all state and logic lives in the `useAIAssistant` hook.

Extensions (ConversationHistory, StarterPrompts, TemplateRenderer, Settings) self-register into the sidebar via `extensionMeta`. Gated by `AIAssistantPermission`.

`IAIAssistantService` provides CRUD for conversations, prompts, templates, settings, and agent names.

Starter prompts support parameterized placeholders: `{param}` (required) and `{param?}` (optional).

## Documentation

Component docs are in `docs/` — AIAssistant.md, TemplateRenderer.md, TemplateDesigner.md, ChangeLog.md.
