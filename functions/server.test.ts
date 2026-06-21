import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { app } from './server'
import { API_PATHS, ERROR_MESSAGES, HTTP_STATUS } from '../shared/constants'

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
// 1. 擬似的な複数リンク付きAtomのXMLを用意
const mockAtomMultiLinkXml = `
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>複数リンクテスト</title>
  <entry>
    <id>tag:example.com,2026:2</id>
    <title>複数リンクの記事</title>
    <link rel="self" href="https://example.com/atom/self" />
    <link rel="alternate" href="https://example.com/target-url" />
    <link rel="replies" href="https://example.com/comments" />
    <updated>2026-06-21T00:00:00Z</updated>
  </entry>
</feed>
`

const RSS_URL = 'https://example.com/rss.xml'
const ATOM_URL = 'https://example.com/atom.xml'
const ATOM_MULTILINT_URL = 'https://example.com/atom-multilink.xml'
const ERROR_URL = 'https://example.com/error.xml'

// 2. MSWによる外部API（fetch）のモック設定
const mswServer = setupServer(
  http.get(RSS_URL, () => {
    return HttpResponse.text(mockRss20Xml, { status: HTTP_STATUS.OK })
  }),
  http.get(ATOM_URL, () => {
    return HttpResponse.text(mockAtomXml, { status: HTTP_STATUS.OK })
  }),
  http.get(ATOM_MULTILINT_URL, () => {
    return HttpResponse.text(mockAtomMultiLinkXml, { status: HTTP_STATUS.OK })
  }),
  http.get(ERROR_URL, () => {
    return new HttpResponse(null, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR })
  }),
)

beforeAll(() => mswServer.listen())
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

const FETCH_RSS_URL = `${API_PATHS.ROOT}${API_PATHS.FETCH_RSS}`

// 3. テストケースの記述
describe(`GET ${FETCH_RSS_URL}`, () => {
  it('正常系: RSS 2.0 が正しくパースされること', async () => {
    // Honoのインメモリリクエスト機能を使用
    const res = await app.request(`${FETCH_RSS_URL}?url=${RSS_URL}`)

    expect(res.status).toBe(HTTP_STATUS.OK)

    const body = await res.json()
    expect(body.title).toBe('テストブログ')
    expect(body.articles).toHaveLength(1)
    expect(body.articles[0].title).toBe('記事タイトル1')
    expect(body.articles[0].url).toBe('https://example.com/1')
    expect(typeof body.articles[0].pubDate).toBe('number')
    expect(Number.isNaN(body.articles[0].pubDate)).toBe(false)
  })

  it('正常系: Atom が正しくパースされること', async () => {
    const res = await app.request(`${FETCH_RSS_URL}?url=${ATOM_URL}`)

    expect(res.status).toBe(HTTP_STATUS.OK)

    const body = await res.json()
    expect(body.title).toBe('テストAtomフィード')
    expect(body.articles).toHaveLength(1)
    expect(body.articles[0].title).toBe('Atom記事1')
    expect(body.articles[0].url).toBe('https://example.com/atom1')
  })

  it('正常系: Atom形式でlinkが配列の場合、適切なURLが抽出されること', async () => {
    const res = await app.request(`${FETCH_RSS_URL}?url=${ATOM_MULTILINT_URL}`)
    expect(res.status).toBe(200)

    const body = await res.json()
    // rel="alternate" の href が優先して抽出されているか検証
    expect(body.articles[0].url).toBe('https://example.com/target-url')
  })

  it('異常系: url パラメータがない場合に 400 エラーになること', async () => {
    const res = await app.request(`${FETCH_RSS_URL}`)

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    const body = await res.json()
    expect(body.error).toBe(ERROR_MESSAGES.URL_REQUIRED)
  })

  it('異常系: 外部サイトのフェッチに失敗した場合に 500 エラーになること', async () => {
    const res = await app.request(`${FETCH_RSS_URL}?url=${ERROR_URL}`)

    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    const body = await res.json()
    expect(body.error).toBe(ERROR_MESSAGES.FETCH_FAILED(HTTP_STATUS.INTERNAL_SERVER_ERROR))
  })
})
