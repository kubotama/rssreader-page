import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'hono/jsx/dom'
import { RssReader } from './RssReader'
import {
  API_PATHS,
  BUTTON_TEXT,
  ERROR_MESSAGES,
  HEADER_TEXT,
  HTTP_STATUS,
  LABEL_TEXT,
} from '../../shared/constants'
import { MOCK_FEED_DATA, MOCK_FEED_URL } from '../../shared/fixtures'

describe('RssReader Component', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    // 各テストの前にDOMをリセットし、テスト用の器（container）を用意する
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)

    // グローバルな fetch のモックをリセット
    vi.restoreAllMocks()
  })

  it('初期状態のレンダリングが正しく行われること', () => {
    render(<RssReader />, container)

    // タイトルが表示されているか確認
    expect(container.querySelector('h1')?.textContent).toBe(HEADER_TEXT.LABEL1)

    // 入力フォームとボタンが存在するか確認
    const input = container.querySelector('input[type="url"]') as HTMLInputElement
    const button = container.querySelector('button[type="submit"]')
    expect(input).toBeTruthy()
    expect(button?.textContent).toBe(BUTTON_TEXT.GET_FEEDS)
  })

  it('URLを入力して送信した際、APIが叩かれて記事一覧が描写されること', async () => {
    // 1. 疑似的なAPIレスポンスのモックを作成
    const mockFeedData = MOCK_FEED_DATA

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockFeedData,
    })
    vi.stubGlobal('fetch', fetchMock)

    // 2. コンポーネントをレンダリング
    render(<RssReader />, container)

    const input = container.querySelector('input[type="url"]') as HTMLInputElement
    const form = container.querySelector('form') as HTMLFormElement

    // 3. フォームへの入力と送信をシミュレート
    input.value = MOCK_FEED_URL
    // inputイベントを発生させて要素に値を定着させる
    input.dispatchEvent(new Event('input', { bubbles: true }))

    // submit イベントを発生させる
    const submitEvent = new CustomEvent('submit', {
      cancelable: true,
      bubbles: true,
      detail: {},
    })
    form.dispatchEvent(submitEvent)

    // 4. 非同期処理（fetchと状態更新）の完了を待つ
    // 💡 waitFor の中で、毎回最新のDOM要素を取得するように関数形式にする
    await vi.waitFor(() => {
      const feedTitle = container.querySelector('h2')
      // undefined ではなく、要素が生成されてテキストが一致するまで何度も再試行してくれます
      expect(feedTitle?.textContent).toBe(`${LABEL_TEXT.FEED_NAME} ${MOCK_FEED_DATA.title}`)
    })

    // 5. 記事が正しくリスト表示されているか検証
    const articleLink = container.querySelector('ul li a') as HTMLAnchorElement
    expect(articleLink).toBeTruthy()
    expect(articleLink.textContent).toBe(MOCK_FEED_DATA.articles[0].title)
    expect(articleLink.href).toBe(MOCK_FEED_DATA.articles[0].url)

    // APIが正しいURLで叩かれたかも検証
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_PATHS.FETCH_RSS}?url=${encodeURIComponent(MOCK_FEED_URL)}`,
    )
  })

  it('APIエラー時にエラーメッセージが表示されること', async () => {
    // エラーレスポンスを返すモック
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        json: async () => ({ error: ERROR_MESSAGES.FETCH_FAILED }),
      }),
    )

    render(<RssReader />, container)

    const input = container.querySelector('input[type="url"]') as HTMLInputElement
    const form = container.querySelector('form') as HTMLFormElement

    input.value = MOCK_FEED_URL
    input.dispatchEvent(new Event('input', { bubbles: true }))

    const submitEvent = new CustomEvent('submit', {
      cancelable: true,
      bubbles: true,
      detail: {},
    })
    form.dispatchEvent(submitEvent)

    // 💡 最新の HTML 構造を waitFor の中で取得してチェック
    await vi.waitFor(() => {
      const currentHtml = container.innerHTML
      expect(currentHtml).toContain(ERROR_MESSAGES.FETCH_FAILED)
    })
  })
})
