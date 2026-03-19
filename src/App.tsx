import { useState, useCallback } from 'react';
import { useTranslation } from './i18n';
import { useConfig } from './hooks/useConfig';
import { useFiles } from './hooks/useFiles';
import { useProcessing } from './hooks/useProcessing';
import { exportToPdf, exportToPptx, exportToZip, downloadSingleImage, exportFavoritesToPdf, exportFavoritesToPptx, exportFavoritesToZip } from './utils/export';
import { Settings, FileImage, Play, Square, Download, FileText, Presentation, FolderArchive, CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Trash2, Image, Bookmark, CheckSquare, Square as SquareIcon } from 'lucide-react';
import { FavoriteItem, getAllFavorites, deleteFavorite, getFavoritesCount } from './utils/favorites';

function App() {
  const { config, loading: configLoading, updateConfig, setApiKey } = useConfig();
  const t = useTranslation(config.language);
  
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
  } = useProcessing(pages, setPages, config.apiKey, config.resolution as '2K' | '4K');

  const [showSettings, setShowSettings] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  
  // 收藏夹状态
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [selectedFavorite, setSelectedFavorite] = useState<FavoriteItem | null>(null);
  const [selectedFavorites, setSelectedFavorites] = useState<Set<number>>(new Set());

  const hasPages = pages.length > 0;
  const allCompleted = pages.length > 0 && pages.every(p => p.status === 'completed' || p.status === 'error');

  // API Key 安全验证
  const validateApiKey = (key: string): { valid: boolean; error?: string } => {
    const trimmed = key.trim();
    
    // 长度检查
    if (trimmed.length === 0) {
      return { valid: false, error: 'API Key 不能为空' };
    }
    if (trimmed.length > 100) {
      return { valid: false, error: 'API Key 长度不能超过 100 字符' };
    }
    
    // 格式检查：必须以 AIza 开头
    if (!trimmed.startsWith('AIza')) {
      return { valid: false, error: 'API Key 格式错误，应以 AIza 开头' };
    }
    
    // 字符白名单：只允许字母、数字、下划线、连字符
    const validPattern = /^[A-Za-z0-9_-]+$/;
    if (!validPattern.test(trimmed)) {
      return { valid: false, error: 'API Key 包含非法字符' };
    }
    
    return { valid: true };
  };

  // 安全过滤输入
  const sanitizeInput = (input: string): string => {
    // 移除 HTML 标签
    return input.replace(/<[^>]*>/g, '').trim();
  };

  const handleSaveApiKey = async () => {
    console.log('[handleSaveApiKey] 开始保存...');
    const sanitized = sanitizeInput(apiKeyInput);
    console.log('[handleSaveApiKey] 输入清理后长度:', sanitized.length);
    
    const validation = validateApiKey(sanitized);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    try {
      console.log('[handleSaveApiKey] 调用 setApiKey...');
      await setApiKey(sanitized);
      console.log('[handleSaveApiKey] setApiKey 完成');
      alert('API Key 保存成功！');
      setApiKeyInput('');
      setShowApiKey(false);
    } catch (error) {
      console.error('[handleSaveApiKey] 保存失败:', error);
      alert('保存失败: ' + (error as Error).message);
    }
  };

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
    } catch (e) {
      console.error('删除收藏失败:', e);
    }
  };

  // 打开设置
  const handleOpenSettings = () => {
    setShowSettings(true);
    setApiKeyInput('');
  };

  // 关闭设置时清空输入
  const handleCloseSettings = () => {
    setShowSettings(false);
    setApiKeyInput('');
    setShowApiKey(false);
  };

  // 打开收藏夹
  const handleOpenFavorites = () => {
    setShowFavorites(true);
    loadFavorites();
  };

  // 关闭收藏夹
  const handleCloseFavorites = () => {
    setShowFavorites(false);
    setSelectedFavorite(null);
    setSelectedFavorites(new Set());
  };

  // 收藏夹全选
  const handleSelectAllFavorites = () => {
    if (selectedFavorites.size === favorites.length) {
      setSelectedFavorites(new Set());
    } else {
      setSelectedFavorites(new Set(favorites.map(f => f.id!).filter(Boolean)));
    }
  };

  // 切换单个收藏选中状态
  const toggleFavoriteSelection = (id: number) => {
    const newSet = new Set(selectedFavorites);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedFavorites(newSet);
  };

  // 批量导出收藏为 PDF
  const handleExportFavoritesToPdf = async () => {
    const items = favorites.filter(f => selectedFavorites.has(f.id!));
    await exportFavoritesToPdf(items);
  };

  // 批量导出收藏为 PPTX
  const handleExportFavoritesToPptx = async () => {
    const items = favorites.filter(f => selectedFavorites.has(f.id!));
    await exportFavoritesToPptx(items);
  };

  // 批量导出收藏为 ZIP
  const handleExportFavoritesToZip = async () => {
    const items = favorites.filter(f => selectedFavorites.has(f.id!));
    await exportFavoritesToZip(items);
  };

  const handleExportPdf = () => {
    const completed = pages.filter(p => p.status === 'completed');
    exportToPdf(completed);
  };

  const handleExportPptx = () => {
    const completed = pages.filter(p => p.status === 'completed');
    exportToPptx(completed);
  };

  const handleExportZip = () => {
    const completed = pages.filter(p => p.status === 'completed');
    exportToZip(completed, uploadMode);
  };

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileImage className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">{t.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenFavorites}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="收藏夹"
            >
              <Bookmark className="w-5 h-5" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs 
                                w-4 h-4 flex items-center justify-center rounded-full">
                  {favoritesCount > 9 ? '9+' : favoritesCount}
                </span>
              )}
            </button>
            <button
              onClick={handleOpenSettings}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t.settings}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!hasPages ? (
          /* Upload Zone */
          <div className="max-w-2xl mx-auto text-center py-16">
            <h2 className="text-3xl font-bold mb-4">{t.uploadTitle}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">{t.description}</p>
            
            <button
              onClick={handleFileSelect}
              disabled={isExtracting}
              className="w-full max-w-md mx-auto p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl 
                         hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
                         transition-all group"
            >
              {isExtracting ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                  <p>{t.extracting}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <FileImage className="w-12 h-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <div>
                    <p className="font-medium">{t.selectFiles}</p>
                    <p className="text-sm text-gray-500">{t.supportedFormats}</p>
                  </div>
                </div>
              )}
            </button>
          </div>
        ) : (
          /* Editor View */
          <div>
            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t.resolution}:</span>
                <select
                  value={config.resolution}
                  onChange={(e) => updateConfig({ resolution: e.target.value as '2K' | '4K' })}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="2K">{t.res2k}</option>
                  <option value="4K">{t.res4k}</option>
                </select>
              </div>

              <div className="flex-1" />

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {completedCount}/{pages.length} {t.restored}
                </span>
                {isProcessing && (
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isProcessing ? (
                  <button
                    onClick={startProcessing}
                    disabled={!config.apiKey}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                               text-white rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    {t.start}
                  </button>
                ) : (
                  <button
                    onClick={stopProcessing}
                    disabled={isStopping}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    {isStopping ? '正在停止...' : '停止'}
                  </button>
                )}

                {allCompleted && (
                  <>
                    <button
                      onClick={handleExportPdf}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      {t.exportPdf}
                    </button>
                    <button
                      onClick={handleExportPptx}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <Presentation className="w-4 h-4" />
                      {t.exportPptx}
                    </button>
                    {uploadMode === 'image' && (
                      <button
                        onClick={handleExportZip}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                      >
                        <FolderArchive className="w-4 h-4" />
                        {t.exportZip}
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={reset}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t.uploadNew}
                </button>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={selectAll}
                disabled={isProcessing}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              >
                {t.selectAll}
              </button>
              <button
                onClick={deselectAll}
                disabled={isProcessing}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              >
                {t.deselectAll}
              </button>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all
                    ${page.selected ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'}
                    ${page.status === 'processing' ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                  `}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={page.selected}
                    onChange={() => toggleSelection(page.id)}
                    disabled={isProcessing}
                    className="absolute top-2 left-2 z-10 w-5 h-5 rounded border-gray-300"
                  />

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    {page.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {page.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  </div>

                  {/* Image */}
                  <div 
                    className="relative aspect-square bg-gray-100 dark:bg-gray-800 cursor-pointer"
                    onClick={() => setSelectedPageId(page.id)}
                  >
                    <img
                      src={page.processedUrl || page.originalUrl}
                      alt={`Page ${page.pageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* 待处理/处理中/错误遮罩层 */}
                    {!page.processedUrl && (
                      <div className={`absolute inset-0 flex items-center justify-center
                        ${page.status === 'error' ? 'bg-red-500/30' : 'bg-black/40'}
                      `}>
                        {page.status === 'pending' && (
                          <span className="text-white text-sm font-medium">{t.pending}</span>
                        )}
                        {page.status === 'processing' && (
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        )}
                        {page.status === 'error' && (
                          <span className="text-white text-xs text-center px-2">失败</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t.page} {page.pageIndex + 1}</span>
                      {page.status === 'error' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-500 truncate max-w-[100px]" title={page.error}>
                            {page.error || '处理失败'}
                          </span>
                          <button
                            onClick={() => retryPage(page.id)}
                            disabled={isProcessing}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            重试
                          </button>
                        </div>
                      )}
                      {page.status === 'completed' && (
                        <button
                          onClick={() => downloadSingleImage(page)}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          下载
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
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
                placeholder={config.apiKey ? '••••••••••••••••••••••••••' : t.keyInputPlaceholder}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700"
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
              disabled={!apiKeyInput.trim() || apiKeyInput.trim().startsWith('•')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {config.apiKey ? '更新 API Key' : t.save}
            </button>

            <button
              onClick={handleCloseSettings}
              className="w-full mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* Favorites Modal */}
      {showFavorites && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-6 max-h-[85vh] flex flex-col">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              收藏夹
              {favoritesCount > 0 && (
                <span className="text-sm font-normal text-gray-500">({favoritesCount})</span>
              )}
            </h3>
            
            {/* 批量操作栏 */}
            {favorites.length > 0 && (
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAllFavorites}
                    className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600"
                  >
                    {selectedFavorites.size === favorites.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <SquareIcon className="w-4 h-4" />
                    )}
                    {selectedFavorites.size === favorites.length ? '取消全选' : '全选'}
                    {selectedFavorites.size > 0 && (
                      <span className="text-xs text-gray-500">({selectedFavorites.size})</span>
                    )}
                  </button>
                </div>
                
                {selectedFavorites.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportFavoritesToPdf}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                      title="导出为 PDF"
                    >
                      <FileText className="w-4 h-4" />
                      PDF
                    </button>
                    <button
                      onClick={handleExportFavoritesToPptx}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      title="导出为 PPTX"
                    >
                      <Presentation className="w-4 h-4" />
                      PPTX
                    </button>
                    <button
                      onClick={handleExportFavoritesToZip}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      title="导出为 ZIP 图片"
                    >
                      <FolderArchive className="w-4 h-4" />
                      图片
                    </button>
                    <button
                      onClick={async () => {
                        for (const id of selectedFavorites) {
                          await deleteFavorite(id);
                        }
                        setSelectedFavorites(new Set());
                        await loadFavorites();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      title="删除选中"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto">
              {favorites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无收藏</p>
                  <p className="text-sm">修复完成的图片会自动保存到这里</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {favorites.map((item) => (
                    <div
                      key={item.id}
                      className={`relative group rounded-lg overflow-hidden border-2 transition-all
                        ${selectedFavorites.has(item.id!) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 dark:border-gray-700'}
                        cursor-pointer hover:border-blue-400`}
                      onClick={() => setSelectedFavorite(item)}
                    >
                      {/* 复选框 */}
                      <div
                        className="absolute top-2 left-2 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => item.id && toggleFavoriteSelection(item.id)}
                          className={`p-1 rounded ${selectedFavorites.has(item.id!) ? 'bg-blue-500 text-white' : 'bg-white/80 text-gray-600'}`}
                        >
                          {selectedFavorites.has(item.id!) ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <SquareIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      
                      <img
                        src={item.thumbnailData}
                        alt={item.name}
                        className="w-full aspect-square object-cover image-rendering-crisp"
                        style={{ imageRendering: 'crisp-edges' }}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
                                      transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.id) handleDeleteFavorite(item.id);
                          }}
                          className="p-2 bg-red-500 rounded-full hover:bg-red-600"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 
                                      truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleCloseFavorites}
              className="w-full mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* Favorite Preview Modal */}
      {selectedFavorite && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setSelectedFavorite(null)}
        >
          <div className="max-w-4xl max-h-[90vh] overflow-auto">
            <img 
              src={selectedFavorite.imageData} 
              alt={selectedFavorite.name}
              className="max-w-full max-h-[80vh] rounded-lg"
            />
            <p className="text-white text-center mt-2">{selectedFavorite.name}</p>
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement('a');
                  link.href = selectedFavorite.imageData;
                  link.download = `${selectedFavorite.name}.png`;
                  link.click();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFavorite(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedPageId && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-2 sm:p-4 lg:p-6"
          onClick={() => setSelectedPageId(null)}
        >
          <div className="w-full h-full max-w-[95vw] max-h-[95vh] overflow-auto flex flex-col">
            {(() => {
              const page = pages.find(p => p.id === selectedPageId);
              if (!page) return null;
              return (
                <div className="flex flex-col gap-2 sm:gap-4 lg:gap-6 flex-1">
                  {/* 原图 */}
                  <div className="flex-1 flex flex-col bg-gray-800/50 rounded-xl p-2 sm:p-3 lg:p-4 min-h-0">
                    <p className="text-white text-center mb-1 sm:mb-2 text-sm sm:text-base font-medium flex-shrink-0">{t.original}</p>
                    <div className="flex-1 flex items-center justify-center min-h-0">
                      <img 
                        src={page.originalUrl} 
                        alt="Original" 
                        className="max-w-[90%] max-h-[90%] w-auto h-auto object-contain rounded-lg"
                      />
                    </div>
                  </div>
                  {/* 修复后 */}
                  <div className="flex-1 flex flex-col bg-gray-800/50 rounded-xl p-2 sm:p-3 lg:p-4 min-h-0">
                    <p className="text-white text-center mb-1 sm:mb-2 text-sm sm:text-base font-medium flex-shrink-0">{t.processed}</p>
                    <div className="flex-1 flex items-center justify-center min-h-0">
                      {page.processedUrl ? (
                        <img 
                          src={page.processedUrl} 
                          alt="Processed" 
                          className="max-w-[90%] max-h-[90%] w-auto h-auto object-contain rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center text-white/50">
                          {page.status === 'processing' ? t.enhancing : t.pending}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>{t.disclaimerText}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
