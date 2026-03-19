import { FileImage, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import type { LanguageType } from '../constants';

interface UploadZoneProps {
  language: LanguageType;
  isExtracting: boolean;
  onFileSelect: () => void;
}

export function UploadZone({ language, isExtracting, onFileSelect }: UploadZoneProps) {
  const t = useTranslation(language);

  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <h2 className="text-3xl font-bold mb-4">{t.uploadTitle}</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-8">{t.description}</p>
      
      <button
        onClick={onFileSelect}
        disabled={isExtracting}
        className="w-full max-w-md mx-auto p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl 
                   hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
                   transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}
