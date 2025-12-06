import { defineConfig } from 'tsup';

export default defineConfig([
  // Main bundle - components, hooks, lib
  {
    entry: {
      index: 'src/index.ts',
      'components/index': 'src/components/index.ts',
      'components/ui/index': 'src/components/ui/index.ts',
      'hooks/index': 'src/hooks/index.ts',
      'lib/index': 'src/lib/index.ts',
      'tailwind.preset': 'src/tailwind.preset.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: true,
    treeshake: true,
    clean: true,
    sourcemap: true,
    minify: false,
    external: ['react', 'react-dom', 'tailwindcss'],
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";',
      };
    },
  },
]);
