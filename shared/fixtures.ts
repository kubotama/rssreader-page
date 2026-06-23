export const MOCK_FEED_DATA = {
  title: 'テストブログのフィード',
  articles: [
    {
      id: '1',
      title: 'テスト記事1',
      url: 'https://example.com/1',
      pubDate: 1718972400000,
      description: 'テスト説明',
    },
  ],
} as const

export const MOCK_FEED_URL = 'https://example.com/rss.xml'
