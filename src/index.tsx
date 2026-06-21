import { Hono } from 'hono'
import { useState } from 'hono/jsx/dom'
import { renderer } from './renderer'
import { Article } from '../shared/types'

import apiApp from '../functions/server'
import {
  API_PATHS,
  APP_ROOT_ID,
  BUTTON_TEXT,
  ERROR_MESSAGES,
  LABEL_TEXT,
  PLACEHOLDER_TEXT,
} from '../shared/constants'

// ==========================================
// 1. 共通のコンポーネント定義
// ==========================================
function RssReader() {
  const [url, setUrl] = useState('')
  const [feedTitle, setFeedTitle] = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetch = async (e: Event) => {
    e.preventDefault()
    console.log('ボタンがクリックされました！ URL:', url) // 👈 疎通確認用
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setFeedTitle('')
    setArticles([])

    try {
      console.log(url)
      const response = await fetch(
        `${API_PATHS.ROOT}${API_PATHS.FETCH_RSS}?url=${encodeURIComponent(url)}`,
      )
      if (!response.ok) {
        throw new Error(
          (await response.json())?.error ||
            `${ERROR_MESSAGES.FETCH_FAILED_STATUS(response.status)}`,
        )
      }

      const data = await response.json()

      setFeedTitle(data.title)
      setArticles(data.articles || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.UNEXPECTED_ERROR
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id={APP_ROOT_ID} style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>RSS Reader PoC</h1>

      <form onSubmit={handleFetch} style={{ marginBottom: '20px' }}>
        <input
          type="url"
          value={url}
          onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
          placeholder={PLACEHOLDER_TEXT.FEED_URL}
          required
          style={{ width: '400px', padding: '8px', marginRight: '10px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? BUTTON_TEXT.LOADING : BUTTON_TEXT.GET_FEEDS}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>⚠️ {error}</p>}
      {feedTitle && (
        <h2>
          {LABEL_TEXT.FEED_NAME} {feedTitle}
        </h2>
      )}

      <ul>
        {articles.map((article) => (
          <li key={article.id} style={{ marginBottom: '12px' }}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '16px', fontWeight: 'bold' }}
            >
              {article.title}
            </a>
            <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
              {new Date(article.pubDate).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ==========================================
// 2. 実行環境に応じた条件分岐 (ここが重要！)
// ==========================================

// ブラウザ環境（クライアントサイド）でのみ実行する処理
if (typeof window !== 'undefined') {
  const { render } = await import('hono/jsx/dom')
  const root = document.getElementById(APP_ROOT_ID)
  if (root) {
    // サーバーが作った静的なHTMLの上に、動的なイベントハンドラを乗せる（ハイドレーション）
    render(<RssReader />, root.parentElement!)
  }
}

// サーバー環境（Honoサーバー）でのみ実行する処理
const app = new Hono()
app.use(renderer)

app.route('/', apiApp)

app.get('/', (c) => {
  return c.render(<RssReader />)
})

export default app
