import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  // Relative asset URLs, so the same build works at any path: a GitHub Pages
  // project site (codygargar.github.io/portfolio-town/), a user site
  // (codygargar.github.io/), or a custom domain.
  base: './',
  build: { outDir: 'dist' },
});
