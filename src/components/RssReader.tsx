import { useState } from 'hono/jsx'
import {
  API_PATHS,
  APP_ROOT_ID,
  PLACEHOLDER_TEXT,
  BUTTON_TEXT,
  LABEL_TEXT,
  HEADER_TEXT,
  ERROR_MESSAGES,
} from '../../shared/constants'
import { Article } from '../../shared/types'

export const RssReader = () => {
  const [url, setUrl] = useState('')
  const [feedTitle, setFeedTitle] = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetch = async (e: Event) => {
    e.preventDefault()

    const formElement = e.currentTarget as HTMLFormElement
    const inputElement = formElement.querySelector('input[type="url"]') as HTMLInputElement
    const currentUrl = inputElement?.value || url

    if (!currentUrl.trim()) return

    setLoading(true)
    setError(null)
    setFeedTitle('')
    setArticles([])

    try {
      const response = await fetch(`${API_PATHS.FETCH_RSS}?url=${encodeURIComponent(currentUrl)}`)

      if (!response.ok) {
        let errorMessage = ERROR_MESSAGES.FETCH_FAILED_STATUS(response.status)
        try {
          const errorData = await response.json()
          if (errorData?.error) {
            errorMessage = errorData.error
          }
        } catch {
          // JSONのパースに失敗した場合はデフォルトのエラーメッセージを使用
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data && typeof data === 'object') {
        setFeedTitle(data.title || '')
        setArticles(Array.isArray(data.articles) ? data.articles : [])
      } else {
        throw new Error(ERROR_MESSAGES.INVALID_FORMAT)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.UNEXPECTED_ERROR
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id={APP_ROOT_ID} style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>{HEADER_TEXT.LABEL1}</h1>

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
