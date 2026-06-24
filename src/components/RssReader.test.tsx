import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'hono/jsx/dom'
import { screen } from '@testing-library/dom'
import '@testing-library/jest-dom'
import userEvent, { UserEvent } from '@testing-library/user-event'
import { RssReader } from './RssReader'
import {
  API_PATHS,
  BUTTON_TEXT,
  ERROR_MESSAGES,
  HEADER_TEXT,
  HTTP_STATUS,
  LABEL_TEXT,
  PLACEHOLDER_TEXT,
} from '../../shared/constants'
import { MOCK_FEED_DATA, MOCK_FEED_URL } from '../../shared/fixtures'

describe('RssReader Component', () => {
  let container: HTMLDivElement
  let user: UserEvent

  beforeEach(() => {
    // 各テストの前にDOMをリセットし、テスト用の器（container）を用意する
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)

    user = userEvent.setup()

    // グローバルな fetch のモックをリセット
    vi.restoreAllMocks()
    vi.unstubAllGlobals()

    // user-event 内部でディスパッチされる Event オブジェクトが Hono の処理でエラーにならないよう、
    // Event.prototype に空オブジェクトを返す detail プロパティを設定する
    if (!('detail' in window.Event.prototype)) {
      Object.defineProperty(window.Event.prototype, 'detail', {
        get() {
          return {}
        },
        configurable: true,
      })
    }
  })

  it('初期状態のレンダリングが正しく行われること', () => {
    render(<RssReader />, container)

    // タイトルが表示されているか確認
    expect(screen.getByText(HEADER_TEXT.LABEL1)).toBeInTheDocument()

    // 入力フォームが存在するか確認
    expect(screen.getByPlaceholderText(PLACEHOLDER_TEXT.FEED_URL)).toBeInTheDocument()

    // ボタンが存在するか確認
    expect(screen.getByRole('button', { name: BUTTON_TEXT.GET_FEEDS })).toBeInTheDocument()
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

    const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT.FEED_URL)
    const button = screen.getByRole('button', { name: BUTTON_TEXT.GET_FEEDS })

    // 3. フォームへの入力と送信をシミュレート
    await user.type(input, MOCK_FEED_URL)

    // submit イベントを発生させる
    await user.click(button)

    // 4. 非同期処理（fetchと状態更新）の完了を待つ
    // 💡 waitFor の中で、毎回最新のDOM要素を取得するように関数形式にする
    // フィード名が表示されることを確認する
    await vi.waitFor(() => {
      expect(
        screen.getByText(`${LABEL_TEXT.FEED_NAME} ${MOCK_FEED_DATA.title}`),
      ).toBeInTheDocument()
    })

    // 5. 記事が正しくリスト表示されているか検証
    const articleLink = screen.getByRole('link', { name: MOCK_FEED_DATA.articles[0].title })
    expect(articleLink).toBeInTheDocument()
    expect(articleLink).toHaveAttribute('href', MOCK_FEED_DATA.articles[0].url)

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

    const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT.FEED_URL)
    const button = screen.getByRole('button', { name: BUTTON_TEXT.GET_FEEDS })

    await user.type(input, MOCK_FEED_URL)

    await user.click(button)

    await vi.waitFor(() => {
      expect(screen.getByText(ERROR_MESSAGES.FETCH_FAILED, { exact: false })).toBeInTheDocument()
    })
  })
})
