import type { Md2EditorDocument } from './editor-document';

const STYLES = `
/*
 * The Toldby core.css theme tokens inherit through Shadow DOM. Component
 * variables provide stable host-level overrides; fallbacks keep the editor
 * autonomous when used without the Toldby theme.
 */
@layer components {
:host {
  display: block;
  min-width: 0;
  --md2-editor-gap-xs: var(--space-xs, 0.25lh);
  --md2-editor-gap: var(--space-sm, 0.5lh);
  --md2-editor-gap-md: var(--space-md, 1lh);
  --md2-editor-radius: var(--radius-md, 0.375rem);
  --md2-editor-radius-sm: var(--radius-sm, 0.25rem);
  --md2-editor-preview-min-width: clamp(20rem, 40vw, 22rem);
  --md2-editor-bg: var(--bg-primary, #fcfcfc);
  --md2-editor-surface: var(--bg-secondary, color-mix(in srgb, var(--md2-editor-bg), var(--md2-editor-text) 3%));
  --md2-editor-text: var(--text-primary, #1a1a1a);
  --md2-editor-muted: var(--text-secondary, color-mix(in srgb, var(--md2-editor-text), transparent 45%));
  --md2-editor-accent: var(--brand-color, #0070f3);
  --md2-editor-danger: var(--danger-color, #dc2626);
  --md2-editor-font: var(--font-size-body, clamp(0.9375rem, 1.25vw, 1rem));
  --md2-editor-small: var(--font-size-small, clamp(0.8125rem, 1vw, 0.875rem));
  --md2-editor-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --md2-editor-min-height: 16lh;
  --_md2-editor-border-width: calc(var(--md2-editor-gap-xs) / 4);
  --_md2-editor-border: var(--_md2-editor-border-width) solid var(--border-color, #e5e7eb);
  --_md2-editor-hover: color-mix(in srgb, var(--md2-editor-bg), var(--md2-editor-text) 8%);
  --_md2-editor-active: color-mix(in srgb, var(--md2-editor-accent), transparent 88%);
  --_md2-editor-focus: calc(var(--md2-editor-gap-xs) / 2) solid var(--md2-editor-accent);
  --_md2-editor-line-height: 1.6;
  --_md2-editor-heading-line-height: 1.2;

  color: var(--md2-editor-text);
  font-size: var(--md2-editor-font);
}

*, *::before, *::after { box-sizing: border-box; }

.editor {
  display: flex;
  flex-direction: column;
  gap: var(--md2-editor-gap);
  min-width: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md2-editor-gap);
  flex-wrap: wrap;
  padding: var(--md2-editor-gap);
  border: var(--_md2-editor-border);
  border-radius: var(--md2-editor-radius-sm);
  background: var(--md2-editor-surface);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--md2-editor-gap-xs);
  flex-wrap: wrap;
}

.toolbar-group--end {
  margin-left: auto;
}

.tool {
  padding: var(--md2-editor-gap-xs) var(--md2-editor-gap);
  border: var(--_md2-editor-border-width) solid transparent;
  border-radius: var(--md2-editor-radius-sm);
  background: transparent;
  color: var(--md2-editor-text);
  font: inherit;
  font-size: var(--md2-editor-small);
  cursor: pointer;
}

.tool:hover {
  background: var(--_md2-editor-hover);
}

.tool:focus-visible {
  outline: var(--_md2-editor-focus);
  outline-offset: var(--md2-editor-gap-xs);
}

.tool[aria-pressed="true"] {
  border-color: color-mix(in srgb, var(--md2-editor-accent), transparent 70%);
  background: var(--_md2-editor-active);
  color: var(--md2-editor-accent);
}

.word-count {
  color: var(--md2-editor-muted);
  font-size: var(--md2-editor-small);
  white-space: nowrap;
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--md2-editor-gap-md);
  align-items: stretch;
}

.grid.preview-on {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--md2-editor-preview-min-width)), 1fr));
}

.pane {
  display: flex;
  min-width: 0;
}

.input {
  width: 100%;
  min-height: var(--md2-editor-min-height);
  margin: 0;
  padding: var(--md2-editor-gap-md);
  border: var(--_md2-editor-border);
  border-radius: var(--md2-editor-radius-sm);
  background: var(--md2-editor-bg);
  color: var(--md2-editor-text);
  font-family: var(--md2-editor-mono);
  font-size: var(--md2-editor-small);
  line-height: var(--_md2-editor-line-height);
  resize: vertical;
}

.input:focus-visible {
  outline: var(--_md2-editor-focus);
  outline-offset: calc(-1 * var(--_md2-editor-border-width));
}

.preview {
  display: none;
  min-width: 0;
  min-height: var(--md2-editor-min-height);
  padding: var(--md2-editor-gap-md);
  border: var(--_md2-editor-border);
  border-radius: var(--md2-editor-radius-sm);
  background: var(--md2-editor-surface);
  overflow: auto;
}

.grid.preview-on .preview {
  display: block;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: var(--md2-editor-gap);
  overflow-wrap: anywhere;
}

.preview-content :where(h1, h2, h3, h4) {
  margin: 0;
  line-height: var(--_md2-editor-heading-line-height);
  letter-spacing: -0.02em;
}

.preview-content :where(h1) {
  font-size: var(--font-size-h1, clamp(1.625rem, 2.75vw, 2.25rem));
}

.preview-content :where(h2) {
  font-size: var(--font-size-h2, clamp(1.375rem, 2.25vw, 1.75rem));
}

.preview-content :where(h3, h4) {
  font-size: var(--font-size-h3, clamp(1.125rem, 1.75vw, 1.5rem));
}

.preview-content :where(p, ul, ol, blockquote) {
  margin: 0;
}

.preview-content :where(ul, ol) {
  padding-left: var(--md2-editor-gap-md);
}

.preview-content :where(blockquote) {
  padding-left: var(--md2-editor-gap-md);
  border-left: var(--_md2-editor-border-width) solid var(--border-color, #e5e7eb);
  color: var(--md2-editor-muted);
}

.preview-content :where(code) {
  padding: 0.1em 0.35em;
  border-radius: var(--md2-editor-radius-sm);
  background: var(--code-bg, rgba(0, 0, 0, 0.05));
  font-family: var(--md2-editor-mono);
  font-size: 0.9em;
}

.preview-content :where(pre code) {
  display: block;
  padding: var(--md2-editor-gap);
  overflow-x: auto;
}

.preview-content :where(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--md2-editor-radius-sm);
}

.preview-content :where(a) {
  color: var(--md2-editor-accent);
}

.preview-content :where(hr) {
  width: 100%;
  border: 0;
  border-top: var(--_md2-editor-border);
}

.preview-error {
  margin: 0 0 var(--md2-editor-gap);
  padding: var(--md2-editor-gap);
  border: var(--_md2-editor-border-width) solid color-mix(in srgb, var(--md2-editor-danger), transparent 60%);
  border-radius: var(--md2-editor-radius-sm);
  color: var(--md2-editor-danger);
  font-size: var(--md2-editor-small);
}

.footer {
  display: flex;
  justify-content: space-between;
  gap: var(--md2-editor-gap);
  flex-wrap: wrap;
  color: var(--md2-editor-muted);
  font-size: var(--md2-editor-small);
}

.content-form {
  display: none;
  flex-direction: column;
  gap: var(--md2-editor-gap);
  padding: var(--md2-editor-gap-md);
  border: var(--_md2-editor-border);
  border-radius: var(--md2-editor-radius-sm);
  background: var(--md2-editor-surface);
}

.editor.has-content .content-form {
  display: flex;
}

/* Structured views expose only their content fields. The raw frontmatter
 * shell is code-owned, so the source pane is removed entirely. */
.editor.has-content .pane {
  display: none;
}

.editor.has-content .grid:not(.preview-on) {
  display: none;
}

.content-field {
  display: flex;
  flex-direction: column;
  gap: var(--md2-editor-gap-xs);
}

.content-field label {
  font-size: var(--md2-editor-small);
  color: var(--md2-editor-muted);
  text-transform: capitalize;
}

.content-field input,
.content-field textarea {
  width: 100%;
  padding: var(--md2-editor-gap-xs) var(--md2-editor-gap);
  border: var(--_md2-editor-border);
  border-radius: var(--md2-editor-radius-sm);
  background: var(--md2-editor-bg);
  color: var(--md2-editor-text);
  font: inherit;
}

.content-field textarea {
  min-height: 4lh;
  resize: vertical;
}
}
`;

const TEMPLATE = `
<div class="editor" part="editor">
  <div class="toolbar" part="toolbar" role="toolbar" aria-label="Markdown formatting">
    <div class="toolbar-group">
      <button type="button" class="tool" data-action="bold" aria-label="Bold" title="Bold (Ctrl/Cmd+B)"><strong>B</strong></button>
      <button type="button" class="tool" data-action="italic" aria-label="Italic" title="Italic (Ctrl/Cmd+I)"><em>I</em></button>
      <button type="button" class="tool" data-action="heading" aria-label="Heading">H2</button>
      <button type="button" class="tool" data-action="link" aria-label="Link">Link</button>
      <button type="button" class="tool" data-action="list" aria-label="Bullet list">List</button>
      <button type="button" class="tool" data-action="quote" aria-label="Quote">Quote</button>
      <button type="button" class="tool" data-action="code" aria-label="Inline code">Code</button>
    </div>
    <div class="toolbar-group toolbar-group--end">
      <span class="word-count" part="word-count">0 words</span>
      <button type="button" class="tool" data-action="preview" aria-label="Toggle preview" aria-pressed="true" hidden>Preview on</button>
    </div>
  </div>
  <div class="content-form" part="content-form" hidden></div>
  <div class="grid" part="grid">
    <div class="pane">
      <textarea part="textarea" class="input" spellcheck="true"></textarea>
    </div>
    <div class="preview" part="preview" aria-label="Preview">
      <div class="preview-error" part="preview-error" hidden></div>
      <div class="preview-content" part="preview-content"></div>
    </div>
  </div>
  <div class="footer" part="footer">
    <span>Markdown is the source.</span>
    <span class="footer-hint" part="footer-hint">Ctrl/Cmd+S to save</span>
  </div>
</div>
`;

export interface EditorView {
  editor: HTMLElement;
  toolbar: HTMLElement;
  textarea: HTMLTextAreaElement;
  grid: HTMLElement;
  previewButton: HTMLButtonElement;
  previewContent: HTMLElement;
  previewError: HTMLElement;
  wordCount: HTMLElement;
  footerHint: HTMLElement;
  contentForm: HTMLElement;
}

function requireElement<T extends Element>(root: ShadowRoot, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Editor template is missing required element: ${selector}`);
  return element;
}

export function mountEditorView(root: ShadowRoot): EditorView {
  root.innerHTML = `<style>${STYLES}</style>${TEMPLATE}`;
  return {
    editor: requireElement(root, '.editor'),
    toolbar: requireElement(root, '.toolbar'),
    textarea: requireElement(root, 'textarea'),
    grid: requireElement(root, '.grid'),
    previewButton: requireElement(root, '[data-action="preview"]'),
    previewContent: requireElement(root, '.preview-content'),
    previewError: requireElement(root, '.preview-error'),
    wordCount: requireElement(root, '.word-count'),
    footerHint: requireElement(root, '.footer-hint'),
    contentForm: requireElement(root, '.content-form'),
  };
}

export function renderContentFields(content: Md2EditorDocument['content']): string {
  return Object.entries(content)
    .map(([key, value]) => {
      const id = `md2-editor-content-${key}`;
      const escapedId = escapeAttribute(id);
      const escapedKey = escapeHtml(key);
      const escapedValue = escapeHtml(value);
      const isLong = value.length > 40 || value.includes('\n');
      return isLong
        ? `<div class="content-field"><label for="${escapedId}">${escapedKey}</label><textarea id="${escapedId}" data-content-key="${escapedKey}">${escapedValue}</textarea></div>`
        : `<div class="content-field"><label for="${escapedId}">${escapedKey}</label><input id="${escapedId}" data-content-key="${escapedKey}" value="${escapeAttribute(value)}"></div>`;
    })
    .join('');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}
