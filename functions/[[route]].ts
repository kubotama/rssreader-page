// functions/[[route]].ts
import { handle } from 'hono/cloudflare-pages'
import { app } from './server' // 上で作ったHono本体を読み込む

// Cloudflare Pagesがリクエストを受け取ったとき、このonRequestが起動します。
// それをそのままHonoのhandleに丸投げします。
export const onRequest = handle(app)
