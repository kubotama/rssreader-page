import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import hooksPlugin from 'eslint-plugin-react-hooks'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  // 1. 対象外にするディレクトリを指定（従来の .eslintignore の役割）
  {
    ignores: ['dist/**', '.cloudflare/**', 'node_modules/**', '.wrangler/**'],
  },

  // 2. ESLint と TypeScript-ESLint の推奨設定を適用
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. フロントエンド（React）とバックエンド（Hono/functions）共通のベース設定
  {
    files: ['src/**/*.{ts,tsx}', 'functions/**/*.{ts,js}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // WebWorker環境（fetchやResponseなど）のグローバル変数を許可
        console: 'readonly',
        fetch: 'readonly',
        globalThis: 'readonly',
      },
    },
    rules: {
      // react-hooks の推奨ルールを適用
      ...hooksPlugin.configs.recommended.rules,

      // bookmark-page で目指したクリーンな開発用の個別ルール調整
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // 未使用変数は警告（ただし頭に _ がつけば無視）
      '@typescript-eslint/no-explicit-any': 'warn', // 先ほど駆逐した any は、もし使われたら警告を出す
      'react/jsx-uses-react': 'off', // React 17以降の新しいJSXトランスフォームに対応
      'react/react-in-jsx-scope': 'off', // import React from 'react' を不要にする
    },
  },

  // 4. 最後に Prettier 設定を重ねて、衝突するルールを無効化する
  eslintConfigPrettier,
)
