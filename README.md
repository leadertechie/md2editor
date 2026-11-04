# @leadertechie/md2editor

A framework-agnostic Markdown editor as a **web component** (`<md2-editor>`).

It owns editing, formatting, word count, keyboard shortcuts, and the editor/preview
layout. It does **not** parse Markdown — the host injects a `renderPreview` function
(for example [`@leadertechie/md2html`](https://github.com/leadertechie/md2html)).

- Zero runtime dependencies
- Works in plain HTML, React, Vue, Lit, or any framework that can render a custom element
- Theme-driven via CSS custom properties with standalone fallbacks
- Shadow DOM, so host styles do not leak in
- `::part()` hooks for host styling

## Install

```bash
npm install @leadertechie/md2editor
```

## Usage

```html
<script type="module">
  import '@leadertechie/md2editor';
</script>

<md2-editor placeholder="Write Markdown…"></md2-editor>
```

```js
import '@leadertechie/md2editor';
import { MarkdownPipeline } from '@leadertechie/md2html';

const pipeline = new MarkdownPipeline();
const editor = document.querySelector('md2-editor');

// Functions cannot be attributes — set the property.
editor.renderPreview = (markdown) => pipeline.renderMarkdown(markdown);

editor.value = '# Hello\n\nWrite something.';

editor.addEventListener('md2-editor-change', (event) => {
  console.log(event.detail.value);
});

editor.addEventListener('md2-editor-save', (event) => {
  save(event.detail.value);
});
```

### React

```tsx
import { useEffect, useRef } from 'react';
import '@leadertechie/md2editor';

export function MarkdownEditor({ value, onChange, renderPreview }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const editor = ref.current as any;
    if (!editor) return;

    editor.renderPreview = renderPreview;
    const onChangeEvent = (event: CustomEvent<{ value: string }>) => onChange(event.detail.value);
    editor.addEventListener('md2-editor-change', onChangeEvent);
    return () => editor.removeEventListener('md2-editor-change', onChangeEvent);
  }, [renderPreview, onChange]);

  useEffect(() => {
    const editor = ref.current as any;
    if (editor && editor.value !== value) editor.value = value;
  }, [value]);

  return <md2-editor ref={ref} placeholder="Write Markdown…" />;
}
```

## API

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `value` | `string` | Current Markdown. Setting it does not emit events. |
| `renderPreview` | `(markdown: string) => string \| Promise<string>` | Preview renderer. Set as a **property**, not an attribute. |

### Attributes

| Attribute | Description |
|-----------|-------------|
| `placeholder` | Textarea placeholder. |
| `label` | `aria-label` for the textarea. Default `Markdown content`. |
| `preview-label` | Label for the preview toggle. Default `Preview`. |
| `saving` | Shows “Saving…” in the footer. |
| `no-preview` | Disables the preview even when `renderPreview` is set. |
| `preview-delay` | Debounce in milliseconds for preview rendering. Default `400`. |

### Events

| Event | Detail | When |
|-------|--------|------|
| `md2-editor-change` | `{ value: string }` | User typed or used a toolbar action. |
| `md2-editor-save` | `{ value: string }` | <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>S</kbd>. |
| `md2-editor-preview-error` | `{ error: string }` | `renderPreview` rejected. |

All events bubble and are composed, so they cross the shadow boundary.

### Methods

| Method | Description |
|--------|-------------|
| `focus()` | Focus the textarea. |

### Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + S` | Emit `md2-editor-save` |

### CSS parts

`editor`, `toolbar`, `grid`, `textarea`, `preview`, `preview-content`,
`preview-error`, `content-form`, `word-count`, `footer`, `footer-hint`.

### CSS custom properties

The component includes its own styles so it remains usable on a standalone
page. Override these public variables on `<md2-editor>` to adapt its appearance:

| Property | Default |
|----------|---------|
| `--md2-editor-gap-xs` | `var(--space-xs, 0.25lh)` |
| `--md2-editor-gap` | `var(--space-sm, 0.5lh)` |
| `--md2-editor-gap-md` | `var(--space-md, 1lh)` |
| `--md2-editor-radius` | `var(--radius-md, 0.375rem)` |
| `--md2-editor-radius-sm` | `var(--radius-sm, 0.25rem)` |
| `--md2-editor-preview-min-width` | `clamp(20rem, 40vw, 22rem)` |
| `--md2-editor-bg` | `var(--bg-primary, #fcfcfc)` |
| `--md2-editor-surface` | `var(--bg-secondary, color-mix(...))` |
| `--md2-editor-text` | `var(--text-primary, #1a1a1a)` |
| `--md2-editor-muted` | `var(--text-secondary, color-mix(...))` |
| `--md2-editor-accent` | `var(--brand-color, #0070f3)` |
| `--md2-editor-danger` | `var(--danger-color, #dc2626)` |
| `--md2-editor-font` | `var(--font-size-body, clamp(...))` |
| `--md2-editor-small` | `var(--font-size-small, clamp(...))` |
| `--md2-editor-mono` | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` |
| `--md2-editor-min-height` | `16lh` |

The component reads the host's color and typography tokens through Shadow DOM.
For spacing and radius tokens that are registered as non-inheriting in Toldby's
`core.css`, map the app's local tokens directly onto the component host:

```css
@layer components {
  @scope (.admin-app) {
    .admin-editor-host md2-editor {
      --md2-editor-gap-xs: var(--admin-gap-xs, 0.25lh);
      --md2-editor-gap: var(--admin-gap-sm, 0.5lh);
      --md2-editor-gap-md: var(--admin-gap-md, 1lh);
      --md2-editor-radius: var(--admin-radius, 0.375rem);
      --md2-editor-radius-sm: var(--admin-radius-sm, 0.25rem);
    }
  }
}
```

The bridge is optional and belongs in the consuming app, not this package.
Use the listed custom properties for broad theming and `::part()` for targeted
styling; internal shadow-DOM selectors are not a styling API.

## Preview security

`renderPreview` output is inserted with `innerHTML`. **The renderer is responsible
for sanitising its output.** `md2html` sanitises by default; do not pass untrusted
Markdown through a renderer that does not.

## Browser support

Web components with Shadow DOM and `color-mix()` (current Chrome, Edge, Firefox,
Safari). The package is browser-only; importing it in a DOM-less SSR context will
fail at element registration.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```

Versioning is handled by GitVersion on `main`; the publish workflow runs
`npm version <GitVersion.fullSemVer>` and `npm stage publish --provenance`.
Do not edit `version` in `package.json` by hand.

### Releasing

Merging to `main` **stages** a version instead of publishing it directly, so
proof-of-presence (2FA) happens at approval time. Approve the staged version
from the npm package page (Staged publishes) or with:

```bash
npm stage list
npm stage approve <stage-id>
```

## License

MIT
