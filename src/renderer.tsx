import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <link href="/static/style.css" rel="stylesheet" />
        <script type="module" src="/src/index.tsx"></script>
      </head>
      <body>{children}</body>
    </html>
  )
})
