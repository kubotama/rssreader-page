import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { app } from './server'

// 1. 擬似的なテストデータ（XML）の用意
const mockRss20Xml = `
<rss version="2.0">
  <channel>
    <title>テストブログ</title>
    <item>
      <title>記事タイトル1</title>
      <link>https://example.com/1</link>
      <guid>https://example.com/1</guid>
      <pubDate>Sat, 20 Jun 2026 12:00:00 GMT</pubDate>
      <description>記事の説明文1</description>
    </item>
  </channel>
</rss>
`

const mockAtomXml = `
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>テストAtomフィード</title>
  <entry>
    <id>tag:example.com,2026:1</id>
    <title>Atom記事1</title>
    <link rel="alternate" href="https://example.com/atom1" />
    <updated>2026-06-20T12:00:00Z</updated>
  </entry>
</feed>
`

// 2. MSWによる外部API（fetch）のモック設定
const mswServer = setupServer(
  http.get('https://example.com/rss.xml', () => {
    return HttpResponse.text(mockRss20Xml, { status: 200 })
  }),
  http.get('https://example.com/atom.xml', () => {
    return HttpResponse.text(mockAtomXml, { status: 200 })
  }),
  http.get('https://example.com/error.xml', () => {
    return new HttpResponse(null, { status: 500 })
  }),
)

beforeAll(() => mswServer.listen())
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

// 3. テストケースの記述
describe('GET /api/fetch-rss', () => {
  it('正常系: RSS 2.0 が正しくパースされること', async () => {
    // Honoのインメモリリクエスト機能を使用
    const res = await app.request('/api/fetch-rss?url=https://example.com/rss.xml')

    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.title).toBe('テストブログ')
    expect(body.articles).toHaveLength(1)
    expect(body.articles[0].title).toBe('記事タイトル1')
    expect(body.articles[0].url).toBe('https://example.com/1')
    expect(typeof body.articles[0].pubDate).toBe('number')
  })

  it('正常系: Atom が正しくパースされること', async () => {
    const res = await app.request('/api/fetch-rss?url=https://example.com/atom.xml')

    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.title).toBe('テストAtomフィード')
    expect(body.articles).toHaveLength(1)
    expect(body.articles[0].title).toBe('Atom記事1')
    expect(body.articles[0].url).toBe('https://example.com/atom1')
  })

  it('異常系: url パラメータがない場合に 400 エラーになること', async () => {
    const res = await app.request('/api/fetch-rss')

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('URL parameter is required')
  })

  it('異常系: 外部サイトのフェッチに失敗した場合に 500 エラーになること', async () => {
    const res = await app.request('/api/fetch-rss?url=https://example.com/error.xml')

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('Failed to fetch RSS')
  })
})
