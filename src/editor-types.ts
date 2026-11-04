export type PreviewRenderer = (markdown: string) => string | Promise<string>;

export interface Md2EditorDocument {
  meta: Record<string, string>;
  content: Record<string, string>;
  body: string;
}

export interface Md2EditorChangeDetail {
  value: string;
  document?: Md2EditorDocument;
}

export interface Md2EditorPreviewErrorDetail {
  error: string;
}
