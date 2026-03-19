import { invoke } from '@tauri-apps/api/core';

// ==================== 文件操作 ====================

export async function selectSaveDirectory(): Promise<string | null> {
  return await invoke('select_save_directory');
}

export async function selectSavePath(
  defaultName: string,
  extension: string
): Promise<string | null> {
  return await invoke('select_save_path', { defaultName, extension });
}

export async function saveFileBytes(
  filePath: string,
  data: Uint8Array
): Promise<void> {
  return await invoke('save_file_bytes', { filePath, data: Array.from(data) });
}

// ==================== 配置管理 ====================

export interface AppConfig {
  apiKey: string | null;
  resolution: string;
  theme: string;
  language: string;
}

export async function loadConfig(): Promise<AppConfig> {
  return await invoke('load_config');
}

export async function saveConfig(config: AppConfig): Promise<void> {
  return await invoke('save_config', { config });
}

export async function saveApiKey(apiKey: string): Promise<void> {
  console.log('[tauri-api] 调用 save_api_key, key长度:', apiKey.length);
  try {
    await invoke('save_api_key', { apiKey });
    console.log('[tauri-api] save_api_key 成功');
  } catch (error) {
    console.error('[tauri-api] save_api_key 失败:', error);
    throw error;
  }
}

export async function getApiKey(): Promise<string | null> {
  return await invoke('getApiKey');
}

export async function clearApiKey(): Promise<void> {
  return await invoke('clearApiKey');
}

// ==================== HTTP 请求 ====================

export async function callGeminiApi(
  apiKey: string,
  base64Image: string,
  prompt: string,
  imageSize: string = '2K',
  aspectRatio: string = '16:9'
): Promise<string> {
  return await invoke('call_gemini_api', {
    apiKey,
    base64Image,
    prompt,
    imageSize,
    aspectRatio,
  });
}

// ==================== 应用信息 ====================

export function getAppVersion(): Promise<string> {
  return invoke('get_app_version');
}

export function getAppName(): Promise<string> {
  return invoke('get_app_name');
}

export function isDev(): Promise<boolean> {
  return invoke('is_dev');
}
