import { useState, useEffect, useCallback } from 'react';
import type { AppConfig, Language, Theme } from '../types';
import { loadConfig, saveConfig, getApiKeySecure, saveApiKeySecure, clearApiKeySecure } from '../tauri-api';

const DEFAULT_CONFIG: AppConfig = {
  apiKey: null,
  resolution: '2K',
  theme: 'light',
  language: 'cn',
};

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  // 加载配置
  useEffect(() => {
    const init = async () => {
      try {
        const savedConfig = await loadConfig();
        // 使用安全的 API Key 获取方式
        const savedApiKey = await getApiKeySecure();
        const mergedConfig: AppConfig = {
          apiKey: savedApiKey,
          resolution: (savedConfig.resolution as '2K' | '4K') || DEFAULT_CONFIG.resolution,
          theme: (savedConfig.theme as 'light' | 'dark') || DEFAULT_CONFIG.theme,
          language: (savedConfig.language as 'cn' | 'en') || DEFAULT_CONFIG.language,
        };
        setConfig(mergedConfig);
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // 保存配置
  const updateConfig = useCallback(async (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    try {
      // 只保存非敏感配置
      await saveConfig({
        resolution: newConfig.resolution,
        theme: newConfig.theme,
        language: newConfig.language,
      });
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }, [config]);

  // 设置 API Key (使用安全存储)
  const setApiKey = useCallback(async (apiKey: string | null) => {
    console.log('[useConfig] setApiKey 被调用');
    if (apiKey) {
      console.log('[useConfig] 正在保存 API Key 到安全存储...');
      await saveApiKeySecure(apiKey);
      console.log('[useConfig] API Key 保存完成');
    } else {
      console.log('[useConfig] 正在清除 API Key...');
      await clearApiKeySecure();
      console.log('[useConfig] API Key 清除完成');
    }
    setConfig(prev => ({ ...prev, apiKey }));
    console.log('[useConfig] 配置已更新');
  }, []);

  // 切换语言
  const toggleLanguage = useCallback(() => {
    const newLang: Language = config.language === 'cn' ? 'en' : 'cn';
    updateConfig({ language: newLang });
  }, [config.language, updateConfig]);

  // 切换主题
  const toggleTheme = useCallback(() => {
    const newTheme: Theme = config.theme === 'dark' ? 'light' : 'dark';
    updateConfig({ theme: newTheme });
    // 应用到 DOM
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.theme, updateConfig]);

  // 应用主题到 DOM
  useEffect(() => {
    if (config.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.theme]);

  return {
    config,
    loading,
    updateConfig,
    setApiKey,
    toggleLanguage,
    toggleTheme,
  };
}
