import { Hono } from 'hono'
import { XMLParser } from 'fast-xml-parser'
import { RawXMLStructure, Article } from '../shared/types'
import {
  API_PATHS,
  ERROR_MESSAGES,
  HTTP_STATUS,
  INFORMATION_MESSAGES,
  USER_AGENT,
} from '../shared/constants'

const app = new Hono().basePath(API_PATHS.ROOT)

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

app.get(API_PATHS.FETCH_RSS, async (c) => {
  const feedUrl = c.req.query('url')
  if (!feedUrl) {
    return c.json({ error: ERROR_MESSAGES.URL_REQUIRED }, HTTP_STATUS.BAD_REQUEST)
  }

  try {
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (!response.ok) {
      return c.json(
        { error: ERROR_MESSAGES.FETCH_FAILED_STATUS(response.status) },
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      )
    }

    const xmlText = await response.text()

    // パース結果を型アサーション（as）で明示し、any を排除
    const jsonObj = parser.parse(xmlText) as RawXMLStructure

    let articles: Article[] = []
    let feedTitle: string = INFORMATION_MESSAGES.UNKNOWN_FEED

    if (jsonObj.rss?.channel) {
      // --- RSS 2.0 の処理 ---
      const channel = jsonObj.rss.channel
      feedTitle = channel.title || feedTitle

      const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : []

      articles = items.map((item) => {
        // guid がオブジェクトの場合と文字列の場合を安全に処理
        const guidText = typeof item.guid === 'object' ? item.guid?.['#text'] : item.guid
        return {
          id: guidText || item.link || '',
          title: item.title || INFORMATION_MESSAGES.NO_TITLE,
          url: item.link || '',
          pubDate: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
          description: item.description || '',
        }
      })
    } else if (jsonObj.feed) {
      // --- Atom の処理 ---
      const feed = jsonObj.feed
      feedTitle =
        typeof feed.title === 'object'
          ? feed.title?.['#text'] || feedTitle
          : feed.title || feedTitle

      const entries = Array.isArray(feed.entry) ? feed.entry : feed.entry ? [feed.entry] : []

      articles = entries.map((entry) => {
        // Atomの複雑なリンク属性を安全に抽出
        let linkHref = ''
        if (Array.isArray(entry.link)) {
          linkHref =
            entry.link.find((l) => l['@_rel'] === 'alternate')?.['@_href'] ||
            entry.link[0]?.['@_href'] ||
            ''
        } else if (entry.link) {
          linkHref = entry.link['@_href'] || ''
        }

        const titleText = typeof entry.title === 'object' ? entry.title?.['#text'] : entry.title

        return {
          id: entry.id || linkHref,
          title: titleText || INFORMATION_MESSAGES.NO_TITLE,
          url: linkHref,
          pubDate: entry.updated ? new Date(entry.updated).getTime() : Date.now(),
          description: '', // 簡略化のため空
        }
      })
    } else {
      return c.json({ error: ERROR_MESSAGES.INVALID_FORMAT }, HTTP_STATUS.BAD_REQUEST)
    }

    // 型安全なオブジェクトを返す
    return c.json({
      title: feedTitle,
      articles: articles,
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    return c.json({ error: errorMessage }, 500)
  }
})

export default app
