import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'md2editor',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
    minify: false,
    sourcemap: true,
    target: 'es2020',
  },
});
