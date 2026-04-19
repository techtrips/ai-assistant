# TemplateRenderer

Renders a JSON-defined `ITemplate` against server data. Used inside AI Assistant chat messages to display structured, data-bound UI cards.

## Usage

```tsx
import { TemplateRenderer } from '@techtrips/ai-assistant';

<TemplateRenderer
  data={{
    template: myTemplate,     // ITemplate object
    serverData: responseData,  // Record<string, unknown>
  }}
  onAction={(action, payload) => {
    console.log('Button clicked:', action, payload);
  }}
/>
```

## Props — `ITemplateComponentProps`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `Record<string, unknown>` | No | Data object containing `template` (ITemplate) and `serverData` (server response data). |
| `onAction` | `(action: string, payload: IActionArgs) => void` | No | Callback when a button control is clicked. |

### `IActionArgs`

| Field | Type | Description |
|-------|------|-------------|
| `prompt` | `string` | The prompt text (with placeholders interpolated). |
| `data` | `Record<string, unknown> \| undefined` | Associated data payload. |

## Template Schema — `ITemplate`

Templates follow a Card → Section → Control hierarchy.

```json
{
  "id": "order-details",
  "name": "Order Details",
  "version": "1.0",
  "card": {
    "title": "Order #12345",
    "subtitle": { "binding": "order.status" },
    "sections": [
      {
        "id": "info",
        "label": "Order Info",
        "layout": "grid",
        "columns": 2,
        "children": [
          { "id": "f1", "type": "field", "label": "Customer", "binding": "order.customer.name" },
          { "id": "f2", "type": "field", "label": "Total", "binding": "order.total", "format": "currency" },
          { "id": "b1", "type": "badge", "binding": "order.status", "color": "success" }
        ]
      }
    ]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique template identifier. |
| `name` | `string` | Yes | Display name of the template. |
| `description` | `string` | No | Optional description. |
| `version` | `string` | Yes | Template version string. |
| `card` | `ICardControl` | Yes | Root card container. |

### `ICardControl`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `string \| IBindable<string>` | — | Card title. Supports data binding. |
| `subtitle` | `string \| IBindable<string>` | — | Card subtitle. |
| `isCollapsible` | `boolean` | `false` | Whether the card can be collapsed. |
| `defaultExpanded` | `boolean` | `true` | Initial expanded state. |
| `layout` | `SectionLayout` | `'stack'` | Layout: `'stack'`, `'row'`, or `'grid'`. |
| `columns` | `number` | — | Number of columns for grid layout. |
| `gap` | `number` | — | Gap between child elements (in px). |
| `children` | `ITemplateControl[]` | — | Direct child controls. |
| `sections` | `ISectionControl[]` | — | Named section groupings. |
| `ordering` | `string[]` | — | Interleaved render order by ID. |
| `style` | `IControlStyle` | — | Custom inline styles. |
| `height` | `string \| number` | — | Fixed height (body scrolls). |
| `footerAlignment` | `FooterAlignment` | `'end'` | Footer button alignment. |

### `ISectionControl`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | `string` | — | Unique section ID. |
| `label` | `string \| IBindable<string>` | — | Section label. |
| `isCollapsible` | `boolean` | `false` | Collapsible toggle. |
| `defaultExpanded` | `boolean` | `true` | Initial expanded state. |
| `layout` | `SectionLayout` | `'stack'` | Layout direction. |
| `columns` | `number` | — | Grid columns. |
| `gap` | `number` | — | Gap between children. |
| `children` | `ITemplateControl[]` | — | Child controls. |
| `subsections` | `ISectionControl[]` | — | Nested sections. |
| `ordering` | `string[]` | — | Interleaved render order. |
| `style` | `IControlStyle` | — | Custom styles. |
| `height` | `string \| number` | — | Fixed height (body scrolls). |
| `footerAlignment` | `FooterAlignment` | `'end'` | Footer button alignment. |

## Control Types

All controls share a base set of properties:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique control ID. |
| `type` | `ControlType` | Discriminant for the control type. |
| `label` | `string` | Display label. |
| `visible` | `boolean` | Whether the control is visible. |
| `disabled` | `boolean` | Whether the control is disabled. |
| `style` | `IControlStyle` | Custom inline styles. |

### `field`

Displays a label/value pair. Supports data binding and formatting.

| Field | Type | Description |
|-------|------|-------------|
| `value` | `ControlValue` | Static value. |
| `binding` | `string` | Dot-path to resolve from server data. |
| `format` | `'text' \| 'date' \| 'currency' \| 'number'` | Display format. |

### `badge`

Displays a colored badge/tag.

| Field | Type | Description |
|-------|------|-------------|
| `value` | `string` | Badge text. |
| `binding` | `string` | Dot-path for badge text. |
| `color` | `BadgeColor` | Color: `'brand'`, `'success'`, `'danger'`, `'warning'`, `'informative'`, etc. |
| `colorBinding` | `string` | Dot-path for dynamic color. |

### `button`

Renders a clickable button that sends a prompt to the chat.

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Button text. |
| `prompt` | `string` | Prompt template with `{key}` placeholders. |
| `data` | `Record<string, unknown>` | Static data for interpolation. |
| `dataBindings` | `Record<string, string>` | Dot-path bindings per data key. |
| `appearance` | `ButtonAppearance` | Visual style: `'primary'`, `'secondary'`, `'outline'`, `'subtle'`, `'transparent'`. |
| `validateForm` | `boolean` | Validate InputField controls before firing. |
| `placement` | `ButtonPlacement` | Where to render: `'inline'`, `'header'`, `'footer'`. |
| `iconName` | `string` | Fluent icon name (e.g. `'Edit20Regular'`). |
| `tooltip` | `string` | Hover text for icon-only buttons. |

### `table`

Renders a data table with optional sorting, searching, and summary tiles.

| Field | Type | Description |
|-------|------|-------------|
| `columns` | `ITableColumn[]` | Column definitions. |
| `rows` | `Record<string, ControlValue>[]` | Static row data. |
| `binding` | `string` | Dot-path to array in server data. |
| `onRowClickPrompt` | `string` | Prompt template on row click. |
| `sortable` | `boolean` | Enable column sorting (default: `true`). |
| `searchable` | `boolean` | Enable a search/filter bar above the table (default: `true`). |
| `searchPlaceholder` | `string` | Placeholder text for the search input (default: `"Search across all columns..."`). |
| `showRecordCount` | `boolean` | Show record count in the toolbar (default: `false`). |
| `summaryTiles` | `ITableSummaryTile[]` | Quick-filter tiles above the table. |

#### `ITableColumn`

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Unique column key. |
| `header` | `string` | Column header text. |
| `field` | `string` | Dot-path into each row item when using binding source (e.g. `"amount.value"`). |
| `minWidth` | `number` | Minimum column width in px. |
| `sortable` | `boolean` | Whether this column is sortable. |
| `format` | `'text' \| 'date' \| 'currency' \| 'number' \| 'badge' \| 'button'` | Display format. |
| `prompt` | `string` | For button columns — prompt template sent on click. Use `{field}` placeholders. |
| `buttonLabel` | `string` | For button columns — the button label. Defaults to the column header. |

#### `ITableSummaryTile`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Optional stable ID; if omitted, index-based ID is used. |
| `label` | `string` | Display label (e.g. `"Total Proposals"`, `"Draft"`). |
| `iconName` | `string` | Fluent icon name (e.g. `'ClipboardText20Regular'`). |
| `field` | `string` | Dot-path field in each row used for filtering (e.g. `"status"`). |
| `value` | `ControlValue` | Match value for the filter field. Ignored when `showAll` is `true`. |
| `showAll` | `boolean` | Marks this tile as the "show all" option. |

### `image`

Displays an image.

| Field | Type | Description |
|-------|------|-------------|
| `src` | `string` | Image source URL. |
| `binding` | `string` | Dot-path for dynamic src. |
| `alt` | `string` | Alt text. |
| `width` | `number \| string` | Width. |
| `height` | `number \| string` | Height. |

### `progressBar`

Renders a progress bar.

| Field | Type | Description |
|-------|------|-------------|
| `value` | `number` | Current progress value. |
| `binding` | `string` | Dot-path for dynamic value. |
| `max` | `number` | Maximum value. |

### `inputField`

A form input field. Use inside a section alongside a `button` with `validateForm: true`.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Key in submitted form data. |
| `inputType` | `FormInputType` | `'text'`, `'textarea'`, `'number'`, `'date'`, `'dropdown'`, `'checkbox'`, `'toggle'`, `'radio'`. |
| `placeholder` | `string` | Hint text. |
| `required` | `boolean` | Whether the field is required. |
| `defaultValue` | `IBindable` | Default value (static or bound). |
| `options` | `IFormOption[]` | Options for dropdown/radio. |
| `step` | `number` | Step for number inputs. |
| `rows` | `number` | Visible rows for textarea. |
| `validation` | `IFormValidation` | Validation constraints (`min`, `max`, `pattern`, `message`). |

#### `IFormOption`

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Display label for the option. |
| `value` | `string` | Value submitted when selected. |

#### `IFormValidation`

| Field | Type | Description |
|-------|------|-------------|
| `min` | `number \| string` | Minimum length (text/textarea) or minimum value (number/date). |
| `max` | `number \| string` | Maximum length (text/textarea) or maximum value (number/date). |
| `pattern` | `string` | Regex pattern the value must match. |
| `message` | `string` | Custom error message shown when validation fails. |

### `separator`

A horizontal divider line.

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Optional inline text on the divider. |

## Data Binding — `IBindable<T>`

Any value that supports binding can be either a literal or an `IBindable` object:

```json
// Literal
"title": "My Title"

// Binding
"title": { "binding": "request.title", "value": "Fallback Title" }
```

| Field | Type | Description |
|-------|------|-------------|
| `value` | `T` | Static fallback value. |
| `binding` | `string` | Dot-path into server data (e.g. `"order.customer.name"`). Supports bracket notation: `"items[0].name"`. |

## Shared Types

### `IControlStyle`

A portable style object applied to any element (card, section, or control). Properties mirror a safe subset of CSS.

| Field | Type | Description |
|-------|------|-------------|
| `width` | `string \| number` | Element width. |
| `height` | `string \| number` | Element height. |
| `minWidth` | `string \| number` | Minimum width. |
| `maxWidth` | `string \| number` | Maximum width. |
| `minHeight` | `string \| number` | Minimum height. |
| `maxHeight` | `string \| number` | Maximum height. |
| `margin` | `string \| number` | Margin (all sides). |
| `marginTop` | `string \| number` | Top margin. |
| `marginRight` | `string \| number` | Right margin. |
| `marginBottom` | `string \| number` | Bottom margin. |
| `marginLeft` | `string \| number` | Left margin. |
| `padding` | `string \| number` | Padding (all sides). |
| `paddingTop` | `string \| number` | Top padding. |
| `paddingRight` | `string \| number` | Right padding. |
| `paddingBottom` | `string \| number` | Bottom padding. |
| `paddingLeft` | `string \| number` | Left padding. |
| `fontSize` | `string \| number` | Font size. |
| `fontWeight` | `string \| number` | Font weight. |
| `textAlign` | `'left' \| 'center' \| 'right'` | Text alignment. |
| `color` | `string` | Text color. |
| `backgroundColor` | `string` | Background color. |
| `borderRadius` | `string \| number` | Border radius. |
| `borderWidth` | `string \| number` | Border width. |
| `borderColor` | `string` | Border color. |
| `borderStyle` | `'solid' \| 'dashed' \| 'dotted' \| 'none'` | Border style. |
| `alignSelf` | `'auto' \| 'flex-start' \| 'flex-end' \| 'center' \| 'stretch'` | Flex align-self. |
| `flex` | `string \| number` | Flex shorthand. |
| `opacity` | `number` | Element opacity (0–1). |
| `overflow` | `'visible' \| 'hidden' \| 'scroll' \| 'auto'` | Overflow behavior. |

### `ControlValue`

```ts
type ControlValue = string | number | boolean | null | undefined;
```

### `ControlType` (enum)

| Value | Description |
|-------|-------------|
| `'field'` | Label/value display. |
| `'button'` | Clickable button. |
| `'table'` | Data table. |
| `'badge'` | Colored badge/tag. |
| `'image'` | Image display. |
| `'progressBar'` | Progress bar. |
| `'inputField'` | Form input. |
| `'separator'` | Horizontal divider. |

### `SectionLayout`

```ts
type SectionLayout = 'stack' | 'row' | 'grid';
```

### `FooterAlignment`

```ts
type FooterAlignment = 'start' | 'center' | 'end' | 'space-between';
```

### `BadgeColor`

```ts
type BadgeColor = 'brand' | 'danger' | 'important' | 'informative' | 'severe' | 'subtle' | 'success' | 'warning';
```

### `ButtonAppearance`

```ts
type ButtonAppearance = 'primary' | 'secondary' | 'outline' | 'subtle' | 'transparent';
```

### `ButtonPlacement`

```ts
type ButtonPlacement = 'inline' | 'header' | 'footer';
```

### `FormInputType`

```ts
type FormInputType = 'text' | 'textarea' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'toggle' | 'radio';
```

