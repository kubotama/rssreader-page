// functions/server.ts
import { Hono } from "hono";

// Honoのインスタンスを作成。ベースURLを /api に統一するのが一般的です
const app = new Hono().basePath("/api");

// ここにAPIをガシガシ追加していく
app.get("/hello", (c) => c.text("Hello from Hono!"));
app.get("/fetch-rss", (c) => {
  /* RSSパース処理 */
});

// 型共有などのために、appをエクスポートしておく
export type AppType = typeof app;
export { app };
