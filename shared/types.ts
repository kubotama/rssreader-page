// 1. アプリケーション全体（フロント・バック共通）で扱う綺麗な記事データの型
export interface Article {
  id: string
  title: string
  url: string
  pubDate: number
  description: string
}

// 2. fast-xml-parser が出力する可能性のある生のXML構造の型定義
interface RSS20RawItem {
  guid?: string | { '#text'?: string }
  title?: string
  link?: string
  pubDate?: string
  description?: string
}

interface AtomRawEntry {
  id?: string
  title?: string | { '#text'?: string }
  link?: { '@_rel'?: string; '@_href'?: string } | { '@_rel'?: string; '@_href'?: string }[]
  updated?: string
  summary?: { '#text'?: string } | string
  content?: { '#text'?: string } | string
}

export interface RawXMLStructure {
  rss?: {
    channel?: {
      title?: string
      item?: RSS20RawItem | RSS20RawItem[]
    }
  }
  feed?: {
    title?: string | { '#text'?: string }
    entry?: AtomRawEntry | AtomRawEntry[]
  }
}
