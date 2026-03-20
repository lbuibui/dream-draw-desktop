import { Play, Square, FileText, Presentation, FolderArchive } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { PageGrid } from './PageGrid';
import { useTranslation } from '../i18n';
import type { ProcessedPage } from '../types';
import type { AppConfig } from '../types';
import type { ResolutionType, LanguageType } from '../constants';

interface EditorViewProps {
  pages: ProcessedPage[];
  config: AppConfig;
  language: LanguageType;
  isProcessing: boolean;
  isStopping: boolean;
  progress: number;
  completedCount: number;
  uploadMode: string | null;
  onResolutionChange: (resolution: ResolutionType) => void;
  onStartProcessing: () => void;
  onStopProcessing: () => void;
  onExportPdf: () => void;
  onExportPptx: () => void;
  onExportZip: () => void;
  onReset: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleSelection: (id: string) => void;
  onRetry: (id: string) => void;
  onPreview: (id: string) => void;
  onDownload: (page: ProcessedPage) => void;
}

export function EditorView({
  pages,
  config,
  language,
  isProcessing,
  isStopping,
  progress,
  completedCount,
  uploadMode,
  onResolutionChange,
  onStartProcessing,
  onStopProcessing,
  onExportPdf,
  onExportPptx,
  onExportZip,
  onReset,
  onSelectAll,
  onDeselectAll,
  onToggleSelection,
  onRetry,
  onPreview,
  onDownload,
}: EditorViewProps) {
  const t = useTranslation(language);

  const allCompleted = pages.length > 0 && pages.every(p => p.status === 'completed' || p.status === 'error');

  return (
    <div>
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">{t.resolution}:</span>
          <CustomSelect
            value={config.resolution}
            options={[
              { value: '2K', label: t.res2k },
              { value: '4K', label: t.res4k },
            ]}
            onChange={(value) => onResolutionChange(value as ResolutionType)}
            disabled={isProcessing}
          />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">
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
              onClick={onStartProcessing}
              disabled={!config.apiKey}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                         text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              {t.start}
            </button>
          ) : (
            <button
              onClick={onStopProcessing}
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
                onClick={onExportPdf}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                {t.exportPdf}
              </button>
              <button
                onClick={onExportPptx}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Presentation className="w-4 h-4" />
                {t.exportPptx}
              </button>
              {uploadMode === 'image' && (
                <button
                  onClick={onExportZip}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  <FolderArchive className="w-4 h-4" />
                  {t.exportZip}
                </button>
              )}
            </>
          )}

          <button
            onClick={onReset}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {t.uploadNew}
          </button>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={onSelectAll}
          disabled={isProcessing}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:text-gray-400"
        >
          {t.selectAll}
        </button>
        <button
          onClick={onDeselectAll}
          disabled={isProcessing}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:text-gray-400"
        >
          {t.deselectAll}
        </button>
      </div>

      {/* Page Grid */}
      <PageGrid
        pages={pages}
        language={language}
        isProcessing={isProcessing}
        onToggleSelection={onToggleSelection}
        onRetry={onRetry}
        onPreview={onPreview}
        onDownload={onDownload}
      />
    </div>
  );
}
