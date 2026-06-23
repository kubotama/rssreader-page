import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true, // describe や it を明示的にインポートせずに使えるようにする
    environment: 'happy-dom',
  },
})
