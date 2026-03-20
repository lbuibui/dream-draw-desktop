import { useState, useCallback, useEffect } from 'react';
import './App.css';
import { Loader2 } from 'lucide-react';
import { 
  Header, 
  UploadZone, 
  EditorView, 
  SettingsModal, 
  FavoritesModal, 
  ImagePreviewModal 
} from './components';
import { useConfig } from './hooks/useConfig';
import { useFiles } from './hooks/useFiles';
import { useProcessing } from './hooks/useProcessing';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useExportProgress } from './hooks/useExportProgress';
import { exportToPdf, exportToPptx, exportToZip, downloadSingleImage, exportFavoritesToPdf, exportFavoritesToPptx, exportFavoritesToZip } from './utils/export';
import { FavoriteItem, getAllFavorites, deleteFavorite, getFavoritesCount } from './utils/favorites';
import { validateApiKey, sanitizeInput } from './utils/errors';
import { saveApiKeySecure } from './tauri-api';
import type { ResolutionType } from './constants';


function App() {
  const { config, loading: configLoading, updateConfig, setApiKey } = useConfig();
  
  const {
    pages,
    setPages,
    isExtracting,
    uploadMode,
    handleFileSelect,
    reset,
    toggleSelection,
    selectAll,
    deselectAll,
  } = useFiles();

  const {
    isProcessing,
    isStopping,
    progress,
    completedCount,
    startProcessing,
    stopProcessing,
    retryPage,
  } = useProcessing(pages, setPages, config.apiKey, config.resolution as ResolutionType);

  const { progress: exportProgress, startExport, updateProgress, endExport } = useExportProgress();

  // UI 状态
  const [showSettings, setShowSettings] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  
  // 收藏夹状态
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);

  const hasPages = pages.length > 0;

  // 加载收藏夹数量
  useEffect(() => {
    getFavoritesCount().then(setFavoritesCount).catch(console.error);
  }, []);

  // 键盘快捷键
  useKeyboardShortcuts([
    { key: 'o', ctrl: true, handler: () => !hasPages && !isExtracting && handleFileSelect() },
    { key: 'a', ctrl: true, handler: () => hasPages && !isProcessing && selectAll() },
    { key: ',', ctrl: true, handler: () => setShowSettings(true) },
  ]);

  // 加载收藏夹
  const loadFavorites = useCallback(async () => {
    try {
      const items = await getAllFavorites();
      setFavorites(items);
      const count = await getFavoritesCount();
      setFavoritesCount(count);
    } catch (e) {
      console.error('加载收藏夹失败:', e);
    }
  }, []);

  // 删除收藏
  const handleDeleteFavorite = async (id: number) => {
    try {
      await deleteFavorite(id);
      await loadFavorites();
      const count = await getFavoritesCount();
      setFavoritesCount(count);
    } catch (e) {
      console.error('删除收藏失败:', e);
    }
  };

  // 保存 API Key (使用安全存储)
  const handleSaveApiKey = async (key: string) => {
    const sanitized = sanitizeInput(key);
    const validation = validateApiKey(sanitized);
    
    if (!validation.valid) {
      throw new Error(validation.error?.userMessage || 'API Key 无效');
    }
    
    // 使用新版安全存储
    await saveApiKeySecure(sanitized);
    // 同时更新前端状态
    await setApiKey(sanitized);
  };

  // 导出处理函数
  const handleExportPdf = async () => {
    const completed = pages.filter(p => p.status === 'completed');
    startExport(completed.length, '正在准备导出 PDF...');
    try {
      await exportToPdf(completed, {
        onProgress: (current, _total, message) => updateProgress(current, message),
      });
    } finally {
      endExport();
    }
  };

  const handleExportPptx = async () => {
    const completed = pages.filter(p => p.status === 'completed');
    startExport(completed.length, '正在准备导出 PPTX...');
    try {
      await exportToPptx(completed, {
        onProgress: (current, _total, message) => updateProgress(current, message),
      });
    } finally {
      endExport();
    }
  };

  const handleExportZip = async () => {
    const completed = pages.filter(p => p.status === 'completed');
    startExport(completed.length, '正在准备导出 ZIP...');
    try {
      await exportToZip(completed, uploadMode, {
        onProgress: (current, _total, message) => updateProgress(current, message),
      });
    } finally {
      endExport();
    }
  };

  // 收藏夹导出
  const handleExportFavoritesToPdf = async (items: FavoriteItem[]) => {
    startExport(items.length, '正在准备导出收藏...');
    try {
      await exportFavoritesToPdf(items, {
        onProgress: (current, _total, message) => updateProgress(current, message),
      });
    } finally {
      endExport();
    }
  };

  const handleExportFavoritesToPptx = async (items: FavoriteItem[]) => {
    startExport(items.length, '正在准备导出收藏...');
    try {
      await exportFavoritesToPptx(items, {
        onProgress: (current, _total, message) => updateProgress(current, message),
      });
    } finally {
      endExport();
    }
  };

  const handleExportFavoritesToZip = async (items: FavoriteItem[]) => {
    startExport(items.length, '正在准备导出收藏...');
    try {
      await exportFavoritesToZip(items, {
        onProgress: (current, _total, message) => updateProgress(current, message),
      });
    } finally {
      endExport();
    }
  };

  // 打开收藏夹
  const handleOpenFavorites = () => {
    setShowFavorites(true);
    loadFavorites();
  };

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors overflow-hidden">
      <Header
        language={config.language}
        favoritesCount={favoritesCount}
        onOpenSettings={() => setShowSettings(true)}
        onOpenFavorites={handleOpenFavorites}
      />

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-8 min-h-full">
          {!hasPages ? (
            <UploadZone
              language={config.language}
              isExtracting={isExtracting}
              onFileSelect={handleFileSelect}
            />
          ) : (
            <EditorView
              pages={pages}
              config={config}
              language={config.language}
              isProcessing={isProcessing}
              isStopping={isStopping}
              progress={progress}
              completedCount={completedCount}
              uploadMode={uploadMode}
              onResolutionChange={(resolution) => updateConfig({ resolution })}
              onStartProcessing={startProcessing}
              onStopProcessing={stopProcessing}
              onExportPdf={handleExportPdf}
              onExportPptx={handleExportPptx}
              onExportZip={handleExportZip}
              onReset={reset}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              onToggleSelection={toggleSelection}
              onRetry={retryPage}
              onPreview={setSelectedPageId}
              onDownload={downloadSingleImage}
            />
          )}
          <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-8">
            <div className="max-w-7xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
              <p>
                免责声明：本工具仅供学习和个人使用。使用 AI 生成内容时请遵守相关法律法规和平台政策。
              </p>
            </div>
          </footer>
        </div>
      </main>

      <SettingsModal
        isOpen={showSettings}
        config={config}
        language={config.language}
        onClose={() => setShowSettings(false)}
        onSaveApiKey={handleSaveApiKey}
        onUpdateConfig={updateConfig}
      />

      <FavoritesModal
        isOpen={showFavorites}
        favorites={favorites}
        onClose={() => setShowFavorites(false)}
        onDelete={handleDeleteFavorite}
        onExportPdf={handleExportFavoritesToPdf}
        onExportPptx={handleExportFavoritesToPptx}
        onExportZip={handleExportFavoritesToZip}
      />

      <ImagePreviewModal
        pageId={selectedPageId}
        pages={pages}
        language={config.language}
        onClose={() => setSelectedPageId(null)}
      />

      {/* 导出进度弹窗 */}
      {exportProgress.isExporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-4">导出中...</h3>
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span>{exportProgress.message}</span>
                <span>{exportProgress.current}/{exportProgress.total}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ 
                    width: `${exportProgress.total > 0 
                      ? (exportProgress.current / exportProgress.total) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
