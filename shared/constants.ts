export const USER_AGENT = 'Cloudflare-RSS-Reader-Bot/1.0'

export const INFORMATION_MESSAGES = { UNKNOWN_FEED: 'Unknown Feed', NO_TITLE: 'no title' } as const

export const ERROR_MESSAGES = {
  URL_REQUIRED: 'URL parameter is required',
  FETCH_FAILED: (status: number) => `Failed to fetch RSS: ${status}`,
  INVALID_FORMAT: 'Unsupported or invalid RSS/Atom format',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
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
