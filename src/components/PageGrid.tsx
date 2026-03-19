import { CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { useTranslation } from '../i18n';
import type { ProcessedPage } from '../types';
import type { LanguageType, ProcessingStatus } from '../constants';

interface PageGridProps {
  pages: ProcessedPage[];
  language: LanguageType;
  isProcessing: boolean;
  onToggleSelection: (id: string) => void;
  onRetry: (id: string) => void;
  onPreview: (id: string) => void;
  onDownload: (page: ProcessedPage) => void;
}

export function PageGrid({
  pages,
  language,
  isProcessing,
  onToggleSelection,
  onRetry,
  onPreview,
  onDownload,
}: PageGridProps) {
  const t = useTranslation(language);

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusOverlay = (page: ProcessedPage) => {
    if (page.processedUrl) return null;

    const baseClasses = "absolute inset-0 flex items-center justify-center";
    
    switch (page.status) {
      case 'pending':
        return (
          <div className={`${baseClasses} bg-black/40`}>
            <span className="text-white text-sm font-medium">{t.pending}</span>
          </div>
        );
      case 'processing':
        return (
          <div className={`${baseClasses} bg-black/40`}>
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        );
      case 'error':
        return (
          <div className={`${baseClasses} bg-red-500/30`}>
            <span className="text-white text-xs text-center px-2">失败</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
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
            onChange={() => onToggleSelection(page.id)}
            disabled={isProcessing}
            className="absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 border-gray-400 dark:border-gray-400 bg-white dark:bg-gray-800 accent-blue-600 dark:accent-blue-500 cursor-pointer shadow-sm"
          />

          {/* Status Badge */}
          <div className="absolute top-2 right-2 z-10">
            {getStatusIcon(page.status)}
          </div>

          {/* Image */}
          <div 
            className="relative aspect-square bg-gray-100 dark:bg-gray-800 cursor-pointer"
            onClick={() => onPreview(page.id)}
          >
            <img
              src={page.processedUrl || page.originalUrl}
              alt={`Page ${page.pageIndex + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {getStatusOverlay(page)}
          </div>

          {/* Footer */}
          <div className="p-3 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.page} {page.pageIndex + 1}</span>
              {page.status === 'error' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500 truncate max-w-[100px]" title={page.error}>
                    {page.error || '处理失败'}
                  </span>
                  <button
                    onClick={() => onRetry(page.id)}
                    disabled={isProcessing}
                    className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                  >
                    重试
                  </button>
                </div>
              )}
              {page.status === 'completed' && (
                <button
                  onClick={() => onDownload(page)}
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
  );
}
