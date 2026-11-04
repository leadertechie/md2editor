import { Md2Editor } from './md2-editor';

export { Md2Editor };
export type {
  PreviewRenderer,
  Md2EditorDocument,
  Md2EditorChangeDetail,
  Md2EditorPreviewErrorDetail,
} from './md2-editor';

if (typeof customElements !== 'undefined' && !customElements.get('md2-editor')) {
  customElements.define('md2-editor', Md2Editor);
}
