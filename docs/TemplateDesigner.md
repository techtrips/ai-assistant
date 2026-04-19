# TemplateDesigner

A visual editor for creating and editing `ITemplate` JSON definitions. Supports drag-and-drop, a property panel, live preview, JSON editing, and data source binding.

## Usage

```tsx
import { TemplateDesigner } from '@techtrips/ai-assistant';

// Create a new template
<TemplateDesigner
  onSave={(template, dataSource) => {
    console.log('Saved:', template);
  }}
  onClose={() => setOpen(false)}
/>

// Edit an existing template
<TemplateDesigner
  template={existingTemplate}
  dataSource={sampleData}
  onSave={(template, dataSource) => saveTemplate(template)}
  onClose={() => setOpen(false)}
/>

// Read-only preview
<TemplateDesigner
  template={existingTemplate}
  dataSource={sampleData}
  isReadOnly
/>
```

## Props — `ITemplateDesignerProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `template` | `ITemplate \| Record<string, unknown> \| string` | No | Empty template | Template to edit. Accepts an `ITemplate` object, a plain object, or a JSON string. See [TemplateRenderer](./TemplateRenderer.md) for the `ITemplate` schema. |
| `dataSource` | `Record<string, unknown> \| string` | No | `{}` | Sample data for binding preview. Can be an object or JSON string. |
| `isReadOnly` | `boolean` | No | `false` | When `true`, opens in Preview mode with editing disabled. |
| `onSave` | `(template: ITemplate, dataSource?: Record<string, unknown> \| string) => void` | No | — | Callback when the user saves the template. |
| `onClose` | `() => void` | No | — | Callback when the Close button is clicked. |