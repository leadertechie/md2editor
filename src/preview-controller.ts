import type { PreviewRenderer } from './editor-types';

const DEFAULT_PREVIEW_DELAY = 400;

export class PreviewController {
  private timer: number | undefined;
  private token = 0;

  constructor(
    private readonly content: HTMLElement,
    private readonly error: HTMLElement,
    private readonly onError: (message: string) => void,
  ) {}

  schedule(
    value: string,
    renderer: PreviewRenderer | undefined,
    delay: number,
    enabled: boolean,
  ): void {
    this.cancel();
    if (!enabled || !renderer) return;

    if (!value.trim()) {
      this.clear();
      return;
    }

    const token = this.token;
    this.timer = window.setTimeout(() => {
      void this.render(value, renderer, token);
    }, delay);
  }

  cancel(): void {
    if (this.timer !== undefined) {
      window.clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.token += 1;
  }

  private async render(value: string, renderer: PreviewRenderer, token: number): Promise<void> {
    try {
      const html = await renderer(value);
      if (token !== this.token) return;
      this.content.innerHTML = html;
      this.clearError();
    } catch (error) {
      if (token !== this.token) return;
      const message = error instanceof Error ? error.message : String(error);
      this.content.innerHTML = '';
      this.error.textContent = message;
      this.error.hidden = false;
      this.onError(message);
    }
  }

  private clear(): void {
    this.content.innerHTML = '';
    this.clearError();
  }

  private clearError(): void {
    this.error.hidden = true;
    this.error.textContent = '';
  }
}

export function getPreviewDelay(attribute: string | null): number {
  if (attribute === null) return DEFAULT_PREVIEW_DELAY;
  const delay = Number.parseInt(attribute, 10);
  return Number.isFinite(delay) && delay >= 0 ? delay : DEFAULT_PREVIEW_DELAY;
}
