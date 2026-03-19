import { useTranslation } from '../../i18n';
import type { ProcessedPage } from '../../types';
import type { LanguageType } from '../../constants';

interface ImagePreviewModalProps {
  pageId: string | null;
  pages: ProcessedPage[];
  language: LanguageType;
  onClose: () => void;
}

export function ImagePreviewModal({ pageId, pages, language, onClose }: ImagePreviewModalProps) {
  const t = useTranslation(language);

  if (!pageId) return null;

  const page = pages.find(p => p.id === pageId);
  if (!page) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-2 sm:p-4 lg:p-6"
      onClick={onClose}
    >
      <div className="w-full h-full max-w-[95vw] max-h-[95vh] overflow-auto flex flex-col">
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
      </div>
    </div>
  );
}
