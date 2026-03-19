import { useState } from 'react';
import { Bookmark, Trash2, FileText, Presentation, FolderArchive, CheckSquare, Square, Image, Download, X } from 'lucide-react';

import type { FavoriteItem } from '../../utils/favorites';


interface FavoritesModalProps {
  isOpen: boolean;
  favorites: FavoriteItem[];

  onClose: () => void;
  onDelete: (id: number) => Promise<void>;
  onExportPdf: (items: FavoriteItem[]) => Promise<void>;
  onExportPptx: (items: FavoriteItem[]) => Promise<void>;
  onExportZip: (items: FavoriteItem[]) => Promise<void>;
}

export function FavoritesModal({
  isOpen,
  favorites,
  onClose,
  onDelete,
  onExportPdf,
  onExportPptx,
  onExportZip,
}: FavoritesModalProps) {
  // const t = useTranslation(language);
  const [selectedFavorites, setSelectedFavorites] = useState<Set<number>>(new Set());
  const [previewItem, setPreviewItem] = useState<FavoriteItem | null>(null);

  const handleSelectAll = () => {
    if (selectedFavorites.size === favorites.length) {
      setSelectedFavorites(new Set());
    } else {
      setSelectedFavorites(new Set(favorites.map(f => f.id!).filter(Boolean)));
    }
  };

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedFavorites);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedFavorites(newSet);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedFavorites) {
      await onDelete(id);
    }
    setSelectedFavorites(new Set());
  };

  const selectedItems = favorites.filter(f => selectedFavorites.has(f.id!));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Bookmark className="w-5 h-5" />
            收藏夹
            {favorites.length > 0 && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({favorites.length})</span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {favorites.length > 0 && (
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600"
              >
                {selectedFavorites.size === favorites.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selectedFavorites.size === favorites.length ? '取消全选' : '全选'}
                {selectedFavorites.size > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">({selectedFavorites.size})</span>
                )}
              </button>
            </div>
            
            {selectedFavorites.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onExportPdf(selectedItems)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  title="导出为 PDF"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => onExportPptx(selectedItems)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  title="导出为 PPTX"
                >
                  <Presentation className="w-4 h-4" />
                  PPTX
                </button>
                <button
                  onClick={() => onExportZip(selectedItems)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  title="导出为 ZIP 图片"
                >
                  <FolderArchive className="w-4 h-4" />
                  图片
                </button>
                <button
                  onClick={handleBulkDelete}
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
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无收藏</p>
              <p className="text-sm">修复完成的图片会自动保存到这里</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all
                    ${selectedFavorites.has(item.id!) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 dark:border-gray-700'}
                    cursor-pointer hover:border-blue-400`}
                  onClick={() => setPreviewItem(item)}
                >
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => item.id && toggleSelection(item.id)}
                      className={`p-1 rounded shadow-sm border-2 ${selectedFavorites.has(item.id!) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-200 border-gray-400 dark:border-gray-400'}`}
                    >
                      {selectedFavorites.has(item.id!) ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  <img
                    src={item.thumbnailData}
                    alt={item.name}
                    className="w-full aspect-square object-cover"
                    style={{ imageRendering: 'crisp-edges' }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
                                  transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.id) onDelete(item.id);
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

        {/* Preview Modal */}
        {previewItem && (
          <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
            onClick={() => setPreviewItem(null)}
          >
            <div className="max-w-4xl max-h-[90vh] overflow-auto">
              <img 
                src={previewItem.imageData} 
                alt={previewItem.name}
                className="max-w-full max-h-[80vh] rounded-lg"
              />
              <p className="text-white text-center mt-2">{previewItem.name}</p>
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = document.createElement('a');
                    link.href = previewItem.imageData;
                    link.download = `${previewItem.name}.png`;
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
                    setPreviewItem(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
