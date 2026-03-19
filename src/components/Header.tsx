import { FileImage, Settings, Bookmark } from 'lucide-react';
import { useTranslation } from '../i18n';
import type { LanguageType } from '../constants';

interface HeaderProps {
  language: LanguageType;
  favoritesCount: number;
  onOpenSettings: () => void;
  onOpenFavorites: () => void;
}

export function Header({ language, favoritesCount, onOpenSettings, onOpenFavorites }: HeaderProps) {
  const t = useTranslation(language);

  return (
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
            onClick={onOpenFavorites}
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
            onClick={onOpenSettings}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={t.settings}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
