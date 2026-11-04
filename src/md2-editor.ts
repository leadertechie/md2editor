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

import {
  cloneEditorDocument,
  documentsEqual,
  parseEditorDocument,
  serializeEditorDocument,
  type ParsedEditorDocument,
} from './editor-document';
import { applyFormatting, isWrapKey, type WrapKey } from './editor-formatting';
import { mountEditorView, renderContentFields, type EditorView } from './editor-view';
import { getPreviewDelay, PreviewController } from './preview-controller';
import type {
  Md2EditorChangeDetail,
  Md2EditorDocument,
  Md2EditorPreviewErrorDetail,
  PreviewRenderer,
} from './editor-types';

export type {
  Md2EditorChangeDetail,
  Md2EditorDocument,
  Md2EditorPreviewErrorDetail,
  PreviewRenderer,
} from './editor-types';

export class Md2Editor extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['placeholder', 'label', 'preview-label', 'saving', 'no-preview', 'preview-delay'];
  }

  private readonly _root: ShadowRoot;
  private _view!: EditorView;
  private _previewController!: PreviewController;
  private _rendered = false;
  private _value = '';
  private _document: Md2EditorDocument | null = null;
  private _renderPreview?: PreviewRenderer;
  private _previewOn = true;
  private _parsed: ParsedEditorDocument = { meta: {}, content: {}, body: '', hasContent: false };
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
    if (!this._rendered) return;

    if (this._view.textarea.value !== value) this._view.textarea.value = value;
    this._syncContentForm();
    this._syncMeta();
    this._schedulePreview();
  }

  get document(): Md2EditorDocument | null {
    return this._document ? cloneEditorDocument(this._document) : null;
  }

  set document(next: Md2EditorDocument | null) {
    const document = next ? cloneEditorDocument(next) : null;
    if (documentsEqual(document, this._document)) return;
    this._document = document;
    if (!this._rendered) return;

    if (this._document) {
      this._parsed = this._parseDocument(this._document);
      this._value = serializeEditorDocument(this._parsed);
      if (this._view.textarea.value !== this._value) this._view.textarea.value = this._value;
    }
    this._syncContentForm();
    this._syncMeta();
    this._schedulePreview();
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
    if (this._rendered) this._previewController.cancel();
  }

  focus(): void {
    this._view?.textarea.focus();
  }

  attributeChangedCallback(): void {
    if (!this._rendered) return;
    this._syncAll();
  }

  private _render(): void {
    this._view = mountEditorView(this._root);
    this._previewController = new PreviewController(
      this._view.previewContent,
      this._view.previewError,
      (message) => this._emitPreviewError(message),
    );

    this._view.contentForm.addEventListener('input', this._onContentInput);
    this._view.toolbar.addEventListener('click', this._onToolbarClick);
    this._view.textarea.addEventListener('input', this._onInput);
    this._view.textarea.addEventListener('keydown', this._onKeydown);

    this._rendered = true;
  }

  private _syncAll(): void {
    this._view.textarea.placeholder = this.getAttribute('placeholder') ?? '';
    this._view.textarea.setAttribute('aria-label', this.getAttribute('label') ?? 'Markdown content');
    if (this._view.textarea.value !== this._value) this._view.textarea.value = this._value;
    this._syncContentForm();
    this._syncMeta();
    this._syncPreviewButton();
    this._syncPreviewVisibility();
    this._schedulePreview();
  }

  private _syncMeta(): void {
    const trimmed = this._value.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    this._view.wordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
    this._view.footerHint.textContent = this._structuredMode
      ? 'Structured content — edit the fields above'
      : this.hasAttribute('saving')
        ? 'Saving…'
        : 'Ctrl/Cmd+S to save';
  }

  private get _canPreview(): boolean {
    return typeof this._renderPreview === 'function' && !this.hasAttribute('no-preview');
  }

  private get _showingPreview(): boolean {
    return this._previewOn && this._canPreview;
  }

  private _syncPreviewButton(): void {
    const label = this.getAttribute('preview-label') || 'Preview';
    this._view.previewButton.hidden = !this._canPreview;
    this._view.previewButton.textContent = `${label} ${this._previewOn ? 'on' : 'off'}`;
    this._view.previewButton.setAttribute('aria-pressed', String(this._previewOn));
  }

  private _syncPreviewVisibility(): void {
    this._view.grid.classList.toggle('preview-on', this._showingPreview);
  }

  private _schedulePreview(): void {
    this._previewController.schedule(
      this._value,
      this._renderPreview,
      getPreviewDelay(this.getAttribute('preview-delay')),
      this._showingPreview,
    );
  }

  private _togglePreview(): void {
    if (!this._canPreview) return;
    this._previewOn = !this._previewOn;
    this._syncPreviewButton();
    this._syncPreviewVisibility();
    this._schedulePreview();
  }

  private _apply(key: WrapKey): void {
    const selection = applyFormatting(
      this._value,
      this._view.textarea.selectionStart ?? 0,
      this._view.textarea.selectionEnd ?? 0,
      key,
    );
    this.value = selection.value;
    this._emitChange();

    window.setTimeout(() => {
      this._view.textarea.focus();
      this._view.textarea.setSelectionRange(selection.cursor, selection.cursor);
    }, 0);
  }

  private _syncContentForm(): void {
    this._parsed = this._document
      ? this._parseDocument(this._document)
      : parseEditorDocument(this._value);
    const hasContent = this._parsed.hasContent;
    this._structuredMode = hasContent;
    this._view.textarea.readOnly = hasContent;
    this._view.toolbar.hidden = hasContent;
    this._view.editor.classList.toggle('has-content', hasContent);
    this._view.contentForm.hidden = !hasContent;
    this._view.contentForm.innerHTML = hasContent
      ? renderContentFields(this._parsed.content)
      : '';
  }

  private _parseDocument(document: Md2EditorDocument): ParsedEditorDocument {
    return {
      meta: document.meta,
      content: document.content,
      body: document.body,
      hasContent: Object.keys(document.content).length > 0,
    };
  }

  private readonly _onContentInput = (event: Event): void => {
    const element = event.target as HTMLInputElement | HTMLTextAreaElement;
    const key = element.dataset.contentKey;
    if (!key) return;

    this._parsed.content[key] = element.value;
    if (this._document) this._document.content[key] = element.value;
    this._value = serializeEditorDocument(this._parsed);
    this._view.textarea.value = this._value;
    this._syncMeta();
    this._schedulePreview();
    this._emitChange();
  };

  private _onInput = (): void => {
    this._value = this._view.textarea.value;
    this._syncMeta();
    this._schedulePreview();
    this._emitChange();
  };

  private _onKeydown = (event: KeyboardEvent): void => {
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

  private _onToolbarClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    if (action === 'preview') {
      this._togglePreview();
    } else if (action && isWrapKey(action)) {
      this._apply(action);
    }
  };

  private _emitChange(): void {
    this.dispatchEvent(
      new CustomEvent<Md2EditorChangeDetail>('md2-editor-change', {
        detail: {
          value: this._value,
          ...(this._document ? { document: cloneEditorDocument(this._document) } : {}),
        },
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

  private _emitPreviewError(message: string): void {
    this.dispatchEvent(
      new CustomEvent<Md2EditorPreviewErrorDetail>('md2-editor-preview-error', {
        detail: { error: message },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'md2-editor': Md2Editor;
  }
}
