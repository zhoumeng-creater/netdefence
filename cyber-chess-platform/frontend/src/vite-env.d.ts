/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL: string
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
  // 添加其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}