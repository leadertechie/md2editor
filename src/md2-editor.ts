/**
 * <md2-editor> — a framework-agnostic Markdown editor web component.
 *
 * The component owns editing, formatting, word count, keyboard shortcuts,
 * and preview layout. It does not parse Markdown: the host injects a
 * `renderPreview` function (for example {@link https://github.com/leadertechie/md2html}).
 *
 * The renderer is responsible for sanitising its output. The component
 * inserts the returned HTML into the preview pane verbatim.
 *
 * @example
 * const editor = document.createElement('md2-editor');
 * editor.renderPreview = (md) => md2html.render(md);
 * editor.addEventListener('md2-editor-change', (event) => {
 *   console.log(event.detail.value);
 * });
 * document.body.append(editor);
 */

export type PreviewRenderer = (markdown: string) => string | Promise<string>;

export interface Md2EditorChangeDetail {
  value: string;
}

export interface Md2EditorPreviewErrorDetail {
  error: string;
}

type WrapKey = 'bold' | 'italic' | 'heading' | 'link' | 'list' | 'quote' | 'code';

interface Wrap {
  before: string;
  after: string;
  placeholder: string;
  multiline?: boolean;
}

const WRAPS: Record<WrapKey, Wrap> = {
  bold: { before: '**', after: '**', placeholder: 'bold text' },
  italic: { before: '*', after: '*', placeholder: 'italic text' },
  heading: { before: '## ', after: '', placeholder: 'Heading' },
  link: { before: '[', after: '](https://)', placeholder: 'link text' },
  list: { before: '- ', after: '', placeholder: 'List item', multiline: true },
  quote: { before: '> ', after: '', placeholder: 'Quote', multiline: true },
  code: { before: '`', after: '`', placeholder: 'code' },
};

const STYLES = `
:host {
  display: block;
  min-width: 0;
  --md2-editor-gap: var(--space-sm, 0.5lh);
  --md2-editor-gap-md: var(--space-md, 1lh);
  --md2-editor-radius: var(--radius-md, 0.375rem);
  --md2-editor-radius-sm: var(--radius-sm, 0.25rem);
  --md2-editor-border-width: 0.0625rem;
  --md2-editor-border: var(--md2-editor-border-width) solid var(--border-color, #e5e7eb);
  --md2-editor-bg: var(--bg-primary, #fcfcfc);
  --md2-editor-surface: color-mix(in srgb, var(--bg-primary, #fcfcfc), var(--text-primary, #1a1a1a) 3%);
  --md2-editor-hover: color-mix(in srgb, var(--bg-primary, #fcfcfc), var(--text-primary, #1a1a1a) 8%);
  --md2-editor-active: color-mix(in srgb, var(--brand-color, #0070f3), transparent 88%);
  --md2-editor-text: var(--text-primary, #1a1a1a);
  --md2-editor-muted: color-mix(in srgb, var(--text-primary, #1a1a1a), transparent 45%);
  --md2-editor-accent: var(--brand-color, #0070f3);
  --md2-editor-danger: var(--danger-color, #dc2626);
  --md2-editor-focus: 0.125rem solid var(--brand-color, #0070f3);
  --md2-editor-font: var(--font-size-body, clamp(0.9375rem, 1.25vw, 1rem));
  --md2-editor-small: var(--font-size-small, clamp(0.8125rem, 1vw, 0.875rem));
  --md2-editor-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --md2-editor-min-height: 16lh;

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
  border: var(--md2-editor-border);
  border-radius: var(--md2-editor-radius-sm);
  background: var(--md2-editor-surface);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--space-xs, 0.25lh);
  flex-wrap: wrap;
}

.toolbar-group--end {
  margin-left: auto;
}

.tool {
  padding: var(--space-xs, 0.25lh) var(--md2-editor-gap);
  border: var(--md2-editor-border-width) solid transparent;
  border-radius: var(--md2-editor-radius-sm);
  background: transparent;
  color: var(--md2-editor-text);
  font: inherit;
  font-size: var(--md2-editor-small);
  cursor: pointer;
}

.tool:hover {
  background: var(--md2-editor-hover);
}

.tool:focus-visible {
  outline: var(--md2-editor-focus);
  outline-offset: var(--space-xs, 0.25lh);
}

.tool[aria-pressed="true"] {
  border-color: color-mix(in srgb, var(--md2-editor-accent), transparent 70%);
  background: var(--md2-editor-active);
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
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
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
  border: var(--md2-editor-border);
  border-radius: var(--md2-editor-radius-sm);
  background: var(--md2-editor-bg);
  color: var(--md2-editor-text);
  font-family: var(--md2-editor-mono);
  font-size: var(--md2-editor-small);
  line-height: 1.6;
  resize: vertical;
}

.input:focus-visible {
  outline: var(--md2-editor-focus);
  outline-offset: calc(-1 * var(--md2-editor-border-width));
}

.preview {
  display: none;
  min-width: 0;
  min-height: var(--md2-editor-min-height);
  padding: var(--md2-editor-gap-md);
  border: var(--md2-editor-border);
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
  line-height: 1.2;
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
  border-left: var(--md2-editor-border-width) solid var(--border-color, #e5e7eb);
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
  border-top: var(--md2-editor-border);
}

.preview-error {
  margin: 0 0 var(--md2-editor-gap);
  padding: var(--md2-editor-gap);
  border: var(--md2-editor-border-width) solid color-mix(in srgb, var(--md2-editor-danger), transparent 60%);
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
  border: var(--md2-editor-border);
  border-radius: var(--md2-editor-radius-sm);
  background: var(--md2-editor-surface);
}

.editor.has-content .content-form {
  display: flex;
}

.content-field {
  display: flex;
  flex-direction: column;
  gap: 0.25lh;
}

.content-field label {
  font-size: var(--md2-editor-small);
  color: var(--md2-editor-muted);
  text-transform: capitalize;
}

.content-field input,
.content-field textarea {
  width: 100%;
  padding: var(--space-xs, 0.25lh) var(--md2-editor-gap);
  border: var(--md2-editor-border);
  border-radius: var(--md2-editor-radius-sm);
  background: var(--md2-editor-bg);
  color: var(--md2-editor-text);
  font: inherit;
}

.content-field textarea {
  min-height: 4lh;
  resize: vertical;
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

const DEFAULT_PREVIEW_DELAY = 400;

interface Md2EditorParsed {
  meta: Record<string, string>;
  content: Record<string, string>;
  body: string;
  hasContent: boolean;
}

function unquoteEditor(value: string): string {
  const t = value.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseEditorDocument(raw: string): Md2EditorParsed {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) return { meta: {}, content: {}, body: raw, hasContent: false };

  const meta: Record<string, string> = {};
  const content: Record<string, string> = {};
  let inContent = false;

  for (const line of m[1].split('\n')) {
    if (!line.trim()) continue;
    if (inContent && !/^\s/.test(line)) inContent = false;
    const t = line.trim();
    if (!inContent && /^content\s*:\s*$/.test(t)) {
      inContent = true;
      continue;
    }
    const kv = t.match(/^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    (inContent ? content : meta)[kv[1]] = unquoteEditor(kv[2]);
  }

  return { meta, content, body: raw.slice(m[0].length), hasContent: Object.keys(content).length > 0 };
}

function serializeEditorDocument(doc: Md2EditorParsed): string {
  const quote = (v: string) => (/[:#\n"]/.test(v) ? JSON.stringify(v) : v);
  const lines = ['---'];
  for (const [k, v] of Object.entries(doc.meta)) {
    if (k === 'content') continue;
    lines.push(`${k}: ${quote(v)}`);
  }
  if (doc.hasContent) {
    lines.push('content:');
    for (const [k, v] of Object.entries(doc.content)) {
      lines.push(`  ${k}: ${quote(v)}`);
    }
  }
  lines.push('---');
  return `${lines.join('\n')}\n${doc.body}`;
}

export class Md2Editor extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['placeholder', 'label', 'preview-label', 'saving', 'no-preview', 'preview-delay'];
  }

  private readonly _root: ShadowRoot;
  private _rendered = false;
  private _value = '';
  private _renderPreview?: PreviewRenderer;
  private _previewOn = true;
  private _previewTimer: number | undefined;
  private _previewToken = 0;

  private _toolbar!: HTMLElement;
  private _textarea!: HTMLTextAreaElement;
  private _grid!: HTMLElement;
  private _previewButton!: HTMLButtonElement;
  private _previewContent!: HTMLElement;
  private _previewError!: HTMLElement;
  private _wordCount!: HTMLElement;
  private _footerHint!: HTMLElement;
  private _contentForm!: HTMLElement;
  private _parsed: Md2EditorParsed = { meta: {}, content: {}, body: '', hasContent: false };
  private _structuredMode = false;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  get value(): string {
    return this._value;
  }

  set value(next: string) {
    const value = next ?? '';
    if (value === this._value) return;
    this._value = value;
    if (this._rendered && this._textarea.value !== value) {
      this._textarea.value = value;
    }
    if (this._rendered) {
      this._syncContentForm();
      this._syncMeta();
      this._schedulePreview();
    }
  }

  get renderPreview(): PreviewRenderer | undefined {
    return this._renderPreview;
  }

  set renderPreview(renderer: PreviewRenderer | undefined) {
    this._renderPreview = renderer;
    if (!this._rendered) return;
    this._syncPreviewButton();
    this._syncPreviewVisibility();
    this._schedulePreview();
  }

  connectedCallback(): void {
    if (!this._rendered) this._render();
    this._syncAll();
  }

  disconnectedCallback(): void {
    this._cancelPreview();
  }

  focus(): void {
    this._textarea?.focus();
  }

  attributeChangedCallback(): void {
    if (!this._rendered) return;
    this._syncAll();
  }

  private _render(): void {
    this._root.innerHTML = `<style>${STYLES}</style>${TEMPLATE}`;

    this._toolbar = this._root.querySelector('.toolbar') as HTMLElement;
    this._textarea = this._root.querySelector('textarea') as HTMLTextAreaElement;
    this._grid = this._root.querySelector('.grid') as HTMLElement;
    this._previewButton = this._root.querySelector('[data-action="preview"]') as HTMLButtonElement;
    this._previewContent = this._root.querySelector('.preview-content') as HTMLElement;
    this._previewError = this._root.querySelector('.preview-error') as HTMLElement;
    this._wordCount = this._root.querySelector('.word-count') as HTMLElement;
    this._footerHint = this._root.querySelector('.footer-hint') as HTMLElement;
    this._contentForm = this._root.querySelector('.content-form') as HTMLElement;
    this._contentForm.addEventListener('input', this._onContentInput);

    this._toolbar.addEventListener('click', this._onToolbarClick);
    this._textarea.addEventListener('input', this._onInput);
    this._textarea.addEventListener('keydown', this._onKeydown);

    this._rendered = true;
  }

  private _syncAll(): void {
    this._textarea.placeholder = this.getAttribute('placeholder') ?? '';
    this._textarea.setAttribute('aria-label', this.getAttribute('label') ?? 'Markdown content');
    if (this._textarea.value !== this._value) this._textarea.value = this._value;
    this._syncContentForm();
    this._syncMeta();
    this._syncPreviewButton();
    this._syncPreviewVisibility();
    this._schedulePreview();
  }

  private _syncMeta(): void {
    const trimmed = this._value.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    this._wordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
    this._footerHint.textContent = this._structuredMode ? 'Structured content — edit the fields above' : (this.hasAttribute('saving') ? 'Saving…' : 'Ctrl/Cmd+S to save');
  }

  private get _canPreview(): boolean {
    return typeof this._renderPreview === 'function' && !this.hasAttribute('no-preview');
  }

  private get _showingPreview(): boolean {
    return this._previewOn && this._canPreview;
  }

  private _syncPreviewButton(): void {
    const label = this.getAttribute('preview-label') || 'Preview';
    this._previewButton.hidden = !this._canPreview;
    this._previewButton.textContent = `${label} ${this._previewOn ? 'on' : 'off'}`;
    this._previewButton.setAttribute('aria-pressed', String(this._previewOn));
  }

  private _syncPreviewVisibility(): void {
    this._grid.classList.toggle('preview-on', this._showingPreview);
  }

  private _previewDelay(): number {
    const raw = this.getAttribute('preview-delay');
    if (raw === null) return DEFAULT_PREVIEW_DELAY;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_PREVIEW_DELAY;
  }

  private _cancelPreview(): void {
    if (this._previewTimer !== undefined) {
      window.clearTimeout(this._previewTimer);
      this._previewTimer = undefined;
    }
    this._previewToken += 1;
  }

  private _schedulePreview(): void {
    this._cancelPreview();
    if (!this._showingPreview) return;

    const value = this._value;
    if (!value.trim()) {
      this._previewContent.innerHTML = '';
      this._previewError.hidden = true;
      this._previewError.textContent = '';
      return;
    }

    const token = this._previewToken;
    this._previewTimer = window.setTimeout(() => {
      void this._runPreview(value, token);
    }, this._previewDelay());
  }

  private async _runPreview(value: string, token: number): Promise<void> {
    const renderer = this._renderPreview;
    if (!renderer) return;

    try {
      const html = await renderer(value);
      if (token !== this._previewToken) return;
      this._previewContent.innerHTML = html;
      this._previewError.hidden = true;
      this._previewError.textContent = '';
    } catch (error) {
      if (token !== this._previewToken) return;
      const message = error instanceof Error ? error.message : String(error);
      this._previewContent.innerHTML = '';
      this._previewError.textContent = message;
      this._previewError.hidden = false;
      this.dispatchEvent(
        new CustomEvent<Md2EditorPreviewErrorDetail>('md2-editor-preview-error', {
          detail: { error: message },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private _togglePreview(): void {
    if (!this._canPreview) return;
    this._previewOn = !this._previewOn;
    this._syncPreviewButton();
    this._syncPreviewVisibility();
    this._schedulePreview();
  }

  private _apply(key: WrapKey): void {
    const wrap = WRAPS[key];
    const element = this._textarea;
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    const selected = this._value.slice(start, end) || wrap.placeholder;

    const inserted = wrap.multiline
      ? selected.split('\n').map((line) => `${wrap.before}${line}`).join('\n')
      : `${wrap.before}${selected}${wrap.after}`;

    const next = `${this._value.slice(0, start)}${inserted}${this._value.slice(end)}`;
    this.value = next;
    this._emitChange();

    window.setTimeout(() => {
      element.focus();
      const cursor = start + inserted.length;
      element.setSelectionRange(cursor, cursor);
    }, 0);
  }


  private _syncContentForm(): void {
    this._parsed = parseEditorDocument(this._value);
    const hasContent = this._parsed.hasContent;
    this._structuredMode = hasContent;
    this._textarea.readOnly = hasContent;
    this._toolbar.hidden = hasContent;
    const editor = this._root.querySelector('.editor');
    editor?.classList.toggle('has-content', hasContent);
    this._contentForm.hidden = !hasContent;
    if (!hasContent) {
      this._contentForm.innerHTML = '';
      return;
    }

    this._contentForm.innerHTML = Object.entries(this._parsed.content)
      .map(([key, value]) => {
        const id = `md2-editor-content-${key}`;
        const isLong = value.length > 40 || value.includes('\n');
        const escaped = this._escapeHtml(value);
        return isLong
          ? `<div class="content-field"><label for="${id}">${key}</label><textarea id="${id}" data-content-key="${key}">${escaped}</textarea></div>`
          : `<div class="content-field"><label for="${id}">${key}</label><input id="${id}" data-content-key="${key}" value="${this._escapeAttr(value)}"></div>`;
      })
      .join('');
  }

  private _escapeHtml(value: string): string {
    return value.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
  }

  private _escapeAttr(value: string): string {
    return value.replace(/[&"<>]/g, (c) => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }[c] as string));
  }

  private readonly _onContentInput = (event: Event): void => {
    const el = event.target as HTMLInputElement | HTMLTextAreaElement;
    const key = el.dataset.contentKey;
    if (!key) return;
    this._parsed.content[key] = el.value;
    this._value = serializeEditorDocument(this._parsed);
    this._textarea.value = this._value;
    this._syncMeta();
    this._schedulePreview();
    this._emitChange();
  };

  private _emitChange(): void {
    this.dispatchEvent(
      new CustomEvent<Md2EditorChangeDetail>('md2-editor-change', {
        detail: { value: this._value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _emitSave(): void {
    this.dispatchEvent(
      new CustomEvent<Md2EditorChangeDetail>('md2-editor-save', {
        detail: { value: this._value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private readonly _onInput = (): void => {
    this._value = this._textarea.value;
    this._syncMeta();
    this._schedulePreview();
    this._emitChange();
  };

  private readonly _onKeydown = (event: KeyboardEvent): void => {
    if (!(event.metaKey || event.ctrlKey)) return;

    const key = event.key.toLowerCase();
    if (key === 'b') {
      event.preventDefault();
      this._apply('bold');
    } else if (key === 'i') {
      event.preventDefault();
      this._apply('italic');
    } else if (key === 's') {
      event.preventDefault();
      this._emitSave();
    }
  };

  private readonly _onToolbarClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest('button[data-action]') as HTMLButtonElement | null;
    if (!button) return;

    const action = button.dataset.action;
    if (action === 'preview') {
      this._togglePreview();
      return;
    }
    if (action && action in WRAPS) {
      this._apply(action as WrapKey);
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'md2-editor': Md2Editor;
  }
}
