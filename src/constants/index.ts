/**
 * 应用常量定义
 */

// API 端点
export const API_ENDPOINTS = {
  GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent',
} as const;

// 文件限制
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_PAGES: 100,
  ALLOWED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
} as const;

// API Key 验证
export const API_KEY_RULES = {
  MAX_LENGTH: 100,
  PREFIX: 'AIza',
  PATTERN: /^[A-Za-z0-9_-]+$/,
} as const;

// 图像分辨率
export const RESOLUTIONS = {
  '2K': { width: 2048, height: 2048, label: '2K (快速)' },
  '4K': { width: 4096, height: 4096, label: '4K (极致)' },
} as const;

export type ResolutionType = keyof typeof RESOLUTIONS;

// 存储键名
export const STORAGE_KEYS = {
  CONFIG: 'app_config',
  API_KEY: 'gemini_api_key',
  FAVORITES: 'favorites',
} as const;

// 处理状态
export const PROCESSING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const;

export type ProcessingStatus = typeof PROCESSING_STATUS[keyof typeof PROCESSING_STATUS];

// 主题
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export type ThemeType = typeof THEMES[keyof typeof THEMES];

// 语言
export const LANGUAGES = {
  CN: 'cn',
  EN: 'en',
} as const;

export type LanguageType = typeof LANGUAGES[keyof typeof LANGUAGES];

// 上传模式
export const UPLOAD_MODES = {
  PDF: 'pdf',
  IMAGE: 'image',
} as const;

export type UploadModeType = typeof UPLOAD_MODES[keyof typeof UPLOAD_MODES];

// 快捷键
export const KEYBOARD_SHORTCUTS = {
  OPEN_FILE: { key: 'o', ctrl: true, meta: true },
  EXPORT: { key: 's', ctrl: true, meta: true },
  SELECT_ALL: { key: 'a', ctrl: true, meta: true },
  SETTINGS: { key: ',', ctrl: true, meta: true },
} as const;

// 重试策略
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,
  BACKOFF_MULTIPLIER: 2,
} as const;

// 超时配置
export const TIMEOUT_CONFIG = {
  API_CALL: 180000, // 3分钟
  FILE_READ: 30000, // 30秒
} as const;
