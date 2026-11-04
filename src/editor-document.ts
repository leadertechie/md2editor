import type { Md2EditorDocument } from './editor-types';

export type { Md2EditorDocument } from './editor-types';

export interface ParsedEditorDocument extends Md2EditorDocument {
  hasContent: boolean;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseEditorDocument(raw: string): ParsedEditorDocument {
  const frontmatter = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!frontmatter) return { meta: {}, content: {}, body: raw, hasContent: false };

  const meta: Record<string, string> = {};
  const content: Record<string, string> = {};
  let inContent = false;

  for (const line of frontmatter[1].split('\n')) {
    if (!line.trim()) continue;
    if (inContent && !/^\s/.test(line)) inContent = false;
    const trimmed = line.trim();
    if (!inContent && /^content\s*:\s*$/.test(trimmed)) {
      inContent = true;
      continue;
    }
    const entry = trimmed.match(/^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/);
    if (!entry) continue;
    (inContent ? content : meta)[entry[1]] = unquote(entry[2]);
  }

  return {
    meta,
    content,
    body: raw.slice(frontmatter[0].length),
    hasContent: Object.keys(content).length > 0,
  };
}

export function serializeEditorDocument(document: ParsedEditorDocument): string {
  const quote = (value: string) => (/[:#\n"]/.test(value) ? JSON.stringify(value) : value);
  const lines = ['---'];

  for (const [key, value] of Object.entries(document.meta)) {
    if (key !== 'content') lines.push(`${key}: ${quote(value)}`);
  }
  if (document.hasContent) {
    lines.push('content:');
    for (const [key, value] of Object.entries(document.content)) {
      lines.push(`  ${key}: ${quote(value)}`);
    }
  }
  lines.push('---');
  return `${lines.join('\n')}\n${document.body}`;
}

export function cloneEditorDocument(document: Md2EditorDocument): Md2EditorDocument {
  return {
    meta: { ...document.meta },
    content: { ...document.content },
    body: document.body,
  };
}

export function documentsEqual(
  first: Md2EditorDocument | null,
  second: Md2EditorDocument | null,
): boolean {
  if (first === second) return true;
  if (!first || !second) return false;
  return JSON.stringify(first) === JSON.stringify(second);
}
