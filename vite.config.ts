import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx',
    }),
  ],
  build: {
    target: 'esnext', // または 'es2022'
  },
  // esbuild自体のターゲットも統一する場合は以下も追加（念のため）
  esbuild: {
    target: 'esnext',
  },
})
