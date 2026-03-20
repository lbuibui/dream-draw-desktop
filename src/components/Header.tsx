import { useState, useEffect } from 'react';
import { FileImage, Settings, Bookmark, Minus, Square, Maximize, X } from 'lucide-react';
import { useTranslation } from '../i18n';
import type { LanguageType } from '../constants';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface HeaderProps {
  language: LanguageType;
  favoritesCount: number;
  onOpenSettings: () => void;
  onOpenFavorites: () => void;
}

export function Header({ language, favoritesCount, onOpenSettings, onOpenFavorites }: HeaderProps) {
  const t = useTranslation(language);
  const [isMaximized, setIsMaximized] = useState(false);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    // 监听窗口最大化状态
    const unlisten = appWindow.listen('tauri://resize', async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });
    return () => {
      unlisten.then(fn => fn());
    };
  }, [appWindow]);

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.close();

  return (
    <header 
      data-tauri-drag-region
      className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 sticky top-0 z-50 select-none"
    >
      <div className="w-full h-10 flex items-center">
        {/* 左侧：Logo 和标题 - 固定宽度 */}
        <div className="flex items-center gap-2 px-4 shrink-0" data-tauri-drag-region>
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
            <FileImage className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t.title}</h1>
        </div>

        {/* 中间：可拖拽区域 - 自适应幅宽 */}
        <div className="flex-1 h-full" data-tauri-drag-region />

        {/* 右侧：功能按钮和窗口控制 - 固定宽度 */}
        <div className="flex items-center gap-1 px-4 shrink-0">
          <button
            onClick={onOpenFavorites}
            className="relative p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="收藏夹"
          >
            <Bookmark className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            {favoritesCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[10px] 
                              w-3.5 h-3.5 flex items-center justify-center rounded-full">
                {favoritesCount > 9 ? '9+' : favoritesCount}
              </span>
            )}
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={t.settings}
          >
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          {/* 窗口控制按钮 */}
          <div className="flex items-center ml-2 pl-2 border-l border-gray-300 dark:border-gray-700">
            <button
              onClick={handleMinimize}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="最小化"
            >
              <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleMaximize}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={isMaximized ? "还原" : "最大化"}
            >
              {isMaximized ? (
                <Square className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Maximize className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-md hover:bg-red-500 hover:text-white transition-colors group"
              title="关闭"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
