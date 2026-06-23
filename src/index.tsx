import { Hono } from 'hono'
import { renderer } from './renderer'

import apiApp from '../functions/server'
import { APP_ROOT_ID } from '../shared/constants'
import { RssReader } from './components/RssReader'

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
