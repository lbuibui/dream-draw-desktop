import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { validateApiKey, sanitizeInput } from '../../utils/errors';
import type { LanguageType, ThemeType } from '../../constants';
import type { AppConfig } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  config: AppConfig;
  language: LanguageType;
  onClose: () => void;
  onSaveApiKey: (key: string) => Promise<void>;
  onUpdateConfig: (config: Partial<AppConfig>) => void;
}

export function SettingsModal({
  isOpen,
  config,
  language,
  onClose,
  onSaveApiKey,
  onUpdateConfig,
}: SettingsModalProps) {
  const t = useTranslation(language);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveApiKey = async () => {
    const sanitized = sanitizeInput(apiKeyInput);
    const validation = validateApiKey(sanitized);
    
    if (!validation.valid) {
      alert(validation.error?.userMessage || 'API Key 无效');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveApiKey(sanitized);
      alert('API Key 保存成功！');
      setApiKeyInput('');
      setShowApiKey(false);
    } catch (error) {
      alert('保存失败: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setApiKeyInput('');
    setShowApiKey(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{t.apiSettings}</h3>
          <span className="text-xs text-red-500 font-medium">需要VPN</span>
        </div>
        
        <div className="relative mb-2">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={config.apiKey ? '••••••••••••••••••••••••••' : '请输入 API Key'}
            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-500 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={isSaving}
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 
                       dark:text-gray-400 dark:hover:text-gray-200"
            title={showApiKey ? '隐藏' : '显示'}
          >
            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleSaveApiKey}
          disabled={!apiKeyInput.trim() || apiKeyInput.trim().startsWith('•') || isSaving}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSaving ? '保存中...' : (config.apiKey ? '更新 API Key' : t.save)}
        </button>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium mb-3">{t.generalSettings}</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">{t.language}</span>
              <select
                value={config.language}
                onChange={(e) => onUpdateConfig({ language: e.target.value as LanguageType })}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 appearance-none cursor-pointer min-w-[100px]"
              >
                <option value="cn" className="text-gray-900 dark:text-gray-900">中文</option>
                <option value="en" className="text-gray-900 dark:text-gray-900">English</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">{t.theme}</span>
              <select
                value={config.theme}
                onChange={(e) => onUpdateConfig({ theme: e.target.value as ThemeType })}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 appearance-none cursor-pointer min-w-[100px]"
              >
                <option value="light" className="text-gray-900 dark:text-gray-900">{t.light}</option>
                <option value="dark" className="text-gray-900 dark:text-gray-900">{t.dark}</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
