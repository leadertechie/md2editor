import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Md2Editor } from '../index';

function mount(): Md2Editor {
  const editor = document.createElement('md2-editor') as Md2Editor;
  document.body.append(editor);
  return editor;
}

function part(editor: Md2Editor, selector: string): HTMLElement {
  return editor.shadowRoot!.querySelector(selector) as HTMLElement;
}

function textarea(editor: Md2Editor): HTMLTextAreaElement {
  return part(editor, 'textarea') as HTMLTextAreaElement;
}

describe('<md2-editor>', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('registers the custom element and keeps a value', () => {
    const editor = mount();
    expect(customElements.get('md2-editor')).toBe(Md2Editor);
    expect(editor).toBeInstanceOf(Md2Editor);

    editor.value = 'hello';
    expect(editor.value).toBe('hello');
    expect(textarea(editor).value).toBe('hello');
  });

  it('does not emit change for programmatic value updates', () => {
    const editor = mount();
    const onChange = vi.fn();
    editor.addEventListener('md2-editor-change', onChange);

    editor.value = 'programmatic';
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emits change and updates the word count on input', () => {
    const editor = mount();
    const onChange = vi.fn();
    editor.addEventListener('md2-editor-change', onChange);

    const input = textarea(editor);
    input.value = 'one two three';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(editor.value).toBe('one two three');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0][0] as CustomEvent).detail).toEqual({ value: 'one two three' });
    expect(part(editor, '.word-count').textContent).toBe('3 words');
  });

  it('wraps the selection with the bold toolbar button', () => {
    const editor = mount();
    editor.value = 'hello';
    textarea(editor).setSelectionRange(0, 5);

    (part(editor, '[data-action="bold"]') as HTMLButtonElement).click();

    expect(editor.value).toBe('**hello**');
  });

  it('inserts a heading placeholder when there is no selection', () => {
    const editor = mount();
    (part(editor, '[data-action="heading"]') as HTMLButtonElement).click();
    expect(editor.value).toBe('## Heading');
  });

  it('prefixes every line for multiline list formatting', () => {
    const editor = mount();
    editor.value = 'a\nb';
    textarea(editor).setSelectionRange(0, 3);

    (part(editor, '[data-action="list"]') as HTMLButtonElement).click();

    expect(editor.value).toBe('- a\n- b');
  });

  it('supports Ctrl/Cmd+B and Ctrl/Cmd+S shortcuts', () => {
    const editor = mount();
    const onSave = vi.fn();
    editor.addEventListener('md2-editor-save', onSave);

    editor.value = 'hello';
    const input = textarea(editor);
    input.setSelectionRange(0, 5);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }));
    expect(editor.value).toBe('**hello**');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('renders the preview through the injected renderer', async () => {
    const editor = mount();
    editor.setAttribute('preview-delay', '0');
    editor.renderPreview = (markdown) => `<h1>${markdown}</h1>`;
    editor.value = '# Hi';

    await vi.advanceTimersByTimeAsync(0);

    expect(part(editor, '.grid').classList.contains('preview-on')).toBe(true);
    expect(part(editor, '.preview-content').innerHTML).toBe('<h1># Hi</h1>');
  });

  it('toggles the preview off and on', async () => {
    const editor = mount();
    editor.setAttribute('preview-delay', '0');
    editor.renderPreview = (markdown) => markdown;
    editor.value = 'body';
    await vi.advanceTimersByTimeAsync(0);

    const toggle = part(editor, '[data-action="preview"]') as HTMLButtonElement;
    expect(part(editor, '.grid').classList.contains('preview-on')).toBe(true);

    toggle.click();
    expect(part(editor, '.grid').classList.contains('preview-on')).toBe(false);

    toggle.click();
    expect(part(editor, '.grid').classList.contains('preview-on')).toBe(true);
  });

  it('shows renderer errors and emits a preview-error event', async () => {
    const editor = mount();
    const onError = vi.fn();
    editor.addEventListener('md2-editor-preview-error', onError);
    editor.setAttribute('preview-delay', '0');
    editor.renderPreview = async () => {
      throw new Error('bad markdown');
    };
    editor.value = 'body';

    await vi.advanceTimersByTimeAsync(0);

    const error = part(editor, '.preview-error');
    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe('bad markdown');
    expect((onError.mock.calls[0][0] as CustomEvent).detail).toEqual({ error: 'bad markdown' });
  });

  it('hides the preview controls when no renderer is provided', () => {
    const editor = mount();
    expect((part(editor, '[data-action="preview"]') as HTMLButtonElement).hidden).toBe(true);
    expect(part(editor, '.grid').classList.contains('preview-on')).toBe(false);
  });

  it('honours no-preview even when a renderer exists', () => {
    const editor = mount();
    editor.setAttribute('no-preview', '');
    editor.renderPreview = (markdown) => markdown;
    editor.value = 'body';

    expect((part(editor, '[data-action="preview"]') as HTMLButtonElement).hidden).toBe(true);
    expect(part(editor, '.grid').classList.contains('preview-on')).toBe(false);
  });

  it('reflects placeholder, label, preview label, and saving state', () => {
    const editor = mount();
    editor.setAttribute('placeholder', 'Write something…');
    editor.setAttribute('label', 'Body markdown');
    editor.setAttribute('preview-label', 'Live');
    editor.setAttribute('saving', '');
    editor.renderPreview = (markdown) => markdown;

    expect(textarea(editor).placeholder).toBe('Write something…');
    expect(textarea(editor).getAttribute('aria-label')).toBe('Body markdown');
    expect(part(editor, '[data-action="preview"]').textContent).toContain('Live');
    expect(part(editor, '.footer-hint').textContent).toBe('Saving…');
  });
  it("renders a structured form for content frontmatter and re-serializes on edit", () => {
    const editor = mount();
    editor.value = '---\nparent: "__sys_/base.md"\nlayout: "__sys_/layouts/register.md"\ncontent:\n  headline: "Hello"\n  cta: "Go"\n---\n';

    const form = part(editor, '.content-form');
    expect(form.hidden).toBe(false);

    const headline = form.querySelector('input[data-content-key="headline"]') as HTMLInputElement;
    const cta = form.querySelector('input[data-content-key="cta"]') as HTMLInputElement;
    expect(headline.value).toBe('Hello');
    expect(cta.value).toBe('Go');

    headline.value = 'Updated headline';
    headline.dispatchEvent(new Event('input', { bubbles: true }));

    expect(editor.value).toContain('headline: Updated headline');
    expect(editor.value).toContain('cta: Go');
  });

  it("keeps the raw textarea when there is no content frontmatter", () => {
    const editor = mount();
    editor.value = '# plain markdown';
    expect(part(editor, '.content-form').hidden).toBe(true);
  });

  it("locks the raw source and hides the toolbar for structured content", () => {
    const editor = mount();
    editor.value = '---\ncontent:\n  headline: "Hello"\n---\n';
    expect(textarea(editor).readOnly).toBe(true);
    expect(part(editor, '.toolbar').hidden).toBe(true);
  });

});
