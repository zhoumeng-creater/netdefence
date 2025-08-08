// shared/constants/api.constants.ts
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh-token',
    VERIFY_EMAIL: '/api/auth/verify-email',
    CHANGE_PASSWORD: '/api/auth/change-password',
    ME: '/api/auth/me'
  },
  CHESS: {
    LIST: '/api/chess',
    DETAIL: '/api/chess/:id',
    UPLOAD: '/api/chess/upload',
    UPDATE: '/api/chess/:id',
    DELETE: '/api/chess/:id',
    REPLAY: '/api/chess/:id/replay',
    ANALYSIS: '/api/chess/:id/analysis',
    FAVORITE: '/api/chess/:id/favorite',
    RATE: '/api/chess/:id/rate',
    COMMENT: '/api/chess/:id/comment',
    COMMENTS: '/api/chess/:id/comments'
  },
  COURSES: {
    LIST: '/api/courses',
    DETAIL: '/api/courses/:id',
    CREATE: '/api/courses',
    UPDATE: '/api/courses/:id',
    DELETE: '/api/courses/:id',
    ENROLL: '/api/courses/:id/enroll',
    PROGRESS: '/api/courses/:id/progress',
    LESSONS: '/api/courses/:id/lessons'
  },
  EVENTS: {
    LIST: '/api/events',
    DETAIL: '/api/events/:id',
    CREATE: '/api/events',
    UPDATE: '/api/events/:id',
    DELETE: '/api/events/:id',
    LINK_CHESS: '/api/events/:id/link-chess',
    LINK_COURSE: '/api/events/:id/link-course'
  },
  GAME: {
    INIT: '/api/game/init',
    STATE: '/api/game/state/:sessionId',
    ACTION: '/api/game/action',
    SAVE: '/api/game/save',
    HISTORY: '/api/game/history',
    RECORD: '/api/game/record/:id',
    STATS: '/api/game/stats',
    LEADERBOARD: '/api/game/leaderboard'
  },
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',
    ANALYTICS: '/api/admin/analytics',
    USERS: '/api/admin/users',
    LOGS: '/api/admin/logs',
    SETTINGS: '/api/admin/settings'
  }
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH001',
  AUTH_TOKEN_EXPIRED: 'AUTH002',
  AUTH_TOKEN_INVALID: 'AUTH003',
  AUTH_UNAUTHORIZED: 'AUTH004',
  AUTH_USER_INACTIVE: 'AUTH005',
  
  // Validation errors
  VALIDATION_FAILED: 'VAL001',
  INVALID_INPUT: 'VAL002',
  MISSING_REQUIRED_FIELD: 'VAL003',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RES001',
  RESOURCE_ALREADY_EXISTS: 'RES002',
  RESOURCE_ACCESS_DENIED: 'RES003',
  
  // Game errors
  GAME_ROOM_FULL: 'GAME001',
  GAME_INVALID_ACTION: 'GAME002',
  GAME_NOT_YOUR_TURN: 'GAME003',
  GAME_ALREADY_ENDED: 'GAME004',
  
  // System errors
  INTERNAL_ERROR: 'SYS001',
  DATABASE_ERROR: 'SYS002',
  SERVICE_UNAVAILABLE: 'SYS003',
  RATE_LIMIT_EXCEEDED: 'SYS004'
};