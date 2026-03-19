/**
 * 错误处理工具
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 预定义错误
export const Errors = {
  API_KEY_INVALID: new AppError(
    'API Key format invalid',
    'ERR_API_KEY_INVALID',
    'API Key 格式错误，应以 AIza 开头',
    false
  ),
  API_KEY_EMPTY: new AppError(
    'API Key is empty',
    'ERR_API_KEY_EMPTY',
    'API Key 不能为空',
    false
  ),
  API_RATE_LIMIT: new AppError(
    'API rate limit exceeded',
    'ERR_RATE_LIMIT',
    '请求过于频繁，请稍后再试',
    true
  ),
  API_TIMEOUT: new AppError(
    'API request timeout',
    'ERR_TIMEOUT',
    '请求超时，请检查网络后重试',
    true
  ),
  FILE_TOO_LARGE: new AppError(
    'File too large',
    'ERR_FILE_TOO_LARGE',
    '文件过大，请上传小于 10MB 的文件',
    false
  ),
  FILE_INVALID_TYPE: new AppError(
    'Invalid file type',
    'ERR_FILE_TYPE',
    '不支持的文件格式',
    false
  ),
  PROCESSING_FAILED: new AppError(
    'Processing failed',
    'ERR_PROCESSING',
    '处理失败，请重试',
    true
  ),
  STORAGE_FULL: new AppError(
    'Storage full',
    'ERR_STORAGE',
    '存储空间不足',
    false
  ),
};

/**
 * 带重试的异步函数执行
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  initialDelay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // 如果不是可重试错误，直接抛出
      if (error instanceof AppError && !error.retryable) {
        throw error;
      }

      // 最后一次尝试，直接抛出
      if (i === retries - 1) {
        throw error;
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * 安全的输入清理
 */
export function sanitizeInput(input: string, maxLength: number = 100): string {
  return input
    .replace(/[<>"']/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * 验证 API Key
 */
export function validateApiKey(key: string): { valid: boolean; error?: AppError } {
  const trimmed = key.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: Errors.API_KEY_EMPTY };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: new AppError(
      'API Key too long',
      'ERR_API_KEY_LENGTH',
      'API Key 长度不能超过 100 字符',
      false
    )};
  }

  if (!trimmed.startsWith('AIza')) {
    return { valid: false, error: Errors.API_KEY_INVALID };
  }

  const validPattern = /^[A-Za-z0-9_-]+$/;
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: new AppError(
      'API Key contains invalid characters',
      'ERR_API_KEY_CHARS',
      'API Key 包含非法字符',
      false
    )};
  }

  return { valid: true };
}
