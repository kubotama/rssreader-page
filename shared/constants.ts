export const APP_ROOT_ID = 'app-root'

export const USER_AGENT = 'Cloudflare-RSS-Reader-Bot/1.0'

export const INFORMATION_MESSAGES = { UNKNOWN_FEED: 'Unknown Feed', NO_TITLE: 'no title' } as const

export const ERROR_MESSAGES = {
  URL_REQUIRED: 'URL parameter is required',
  FETCH_FAILED: `Failed to fetch`,
  FETCH_FAILED_STATUS: (status: number) => `Failed to fetch RSS: ${status}`,
  INVALID_FORMAT: 'Unsupported or invalid RSS/Atom format',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  UNEXPECTED_ERROR: 'Unexpected error',
} as const

export const API_PATHS = {
  ROOT: '/api',
  FETCH_RSS: '/fetch-rss',
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const

export const PLACEHOLDER_TEXT = {
  FEED_URL: 'https://example.com/rss.xml',
} as const

export const BUTTON_TEXT = {
  LOADING: '読み込み中...',
  GET_FEEDS: 'フィード取得',
} as const

export const LABEL_TEXT = {
  FEED_NAME: 'フィード名:',
} as const
