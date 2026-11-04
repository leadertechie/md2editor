export type WrapKey = 'bold' | 'italic' | 'heading' | 'link' | 'list' | 'quote' | 'code';

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

export function isWrapKey(value: string): value is WrapKey {
  return Object.prototype.hasOwnProperty.call(WRAPS, value);
}

export interface FormattedText {
  value: string;
  cursor: number;
}

export function applyFormatting(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  key: WrapKey,
): FormattedText {
  const wrap = WRAPS[key];
  const selected = value.slice(selectionStart, selectionEnd) || wrap.placeholder;
  const inserted = wrap.multiline
    ? selected.split('\n').map((line) => `${wrap.before}${line}`).join('\n')
    : `${wrap.before}${selected}${wrap.after}`;

  return {
    value: `${value.slice(0, selectionStart)}${inserted}${value.slice(selectionEnd)}`,
    cursor: selectionStart + inserted.length,
  };
}
