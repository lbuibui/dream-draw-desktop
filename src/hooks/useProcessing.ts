import { useState, useCallback, useRef } from 'react';
import { ProcessedPage } from '../types';
import { saveToFavorites } from '../utils/favorites';
import { processImageWithGemini } from '../services/geminiService';

export function useProcessing(
  pages: ProcessedPage[],
  setPages: React.Dispatch<React.SetStateAction<ProcessedPage[]>>,
  apiKey: string | null,
  resolution: '2K' | '4K'
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const stopRef = useRef(false);

  const processPage = useCallback(async (page: ProcessedPage): Promise<string | null> => {
    if (!apiKey) throw new Error('API Key 未配置');

    try {
      console.log(`[Page ${page.pageIndex + 1}] 开始调用 API (SDK)...`);
      
      const processedImageUrl = await processImageWithGemini(
        apiKey,
        page.originalData,
        page.width,
        page.height,
        resolution
      );

      console.log(`[Page ${page.pageIndex + 1}] 成功获取图像数据`);
      
      // 提取纯 base64 数据（去掉 data:image/png;base64, 前缀）
      const imageData = processedImageUrl.replace(/^data:image\/png;base64,/, '');
      return imageData;
    } catch (error) {
      console.error(`[Page ${page.pageIndex + 1}] 处理失败:`, error);
      throw error;
    }
  }, [apiKey, resolution]);

  const startProcessing = useCallback(async () => {
    if (!apiKey) {
      alert('请先配置 API Key');
      return;
    }

    const pendingPages = pages.filter(p => p.status === 'pending' && p.selected);
    if (pendingPages.length === 0) {
      alert('没有待处理的页面');
      return;
    }

    setIsProcessing(true);
    setIsStopping(false);
    stopRef.current = false;

    const total = pendingPages.length;
    let completed = 0;
    let shouldStop = false;

    for (const page of pendingPages) {
      // 如果之前点击了停止，在下一个页面开始前退出
      if (shouldStop) break;

      setCurrentIndex(page.pageIndex);
      
      // 更新状态为处理中
      setPages(prev => prev.map(p => 
        p.id === page.id ? { ...p, status: 'processing' } : p
      ));

      try {
        const imageData = await processPage(page);

        const processedUrl = `data:image/png;base64,${imageData}`;
        setPages(prev => prev.map(p => 
          p.id === page.id ? {
            ...p,
            status: 'completed',
            processedUrl,
            processedData: imageData,
            resolution,
          } : p
        ));
        
        // 自动保存到收藏夹
        try {
          await saveToFavorites(
            `修复页面 ${page.pageIndex + 1} - ${new Date().toLocaleString()}`,
            processedUrl,
            resolution,
            1,
            page.pageIndex
          );
          console.log(`[Page ${page.pageIndex + 1}] 已保存到收藏夹`);
        } catch (e) {
          console.error('保存到收藏夹失败:', e);
        }
      } catch (error) {
        setPages(prev => prev.map(p => 
          p.id === page.id ? {
            ...p,
            status: 'error',
            error: (error as Error).message,
          } : p
        ));
      }

      completed++;
      setProgress((completed / total) * 100);

      // 当前页面处理完成后，检查是否需要停止
      if (stopRef.current) {
        shouldStop = true;
      }
    }

    setIsProcessing(false);
    setIsStopping(false);
    setCurrentIndex(null);
    setProgress(0);
  }, [pages, apiKey, resolution, processPage, setPages]);

  const stopProcessing = useCallback(() => {
    setIsStopping(true);
    stopRef.current = true;
  }, []);

  const retryPage = useCallback(async (pageId: string) => {
    if (!apiKey) return;

    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    setPages(prev => prev.map(p => 
      p.id === pageId ? { ...p, status: 'processing', error: undefined } : p
    ));

    try {
      const imageData = await processPage(page);
      const processedUrl = `data:image/png;base64,${imageData}`;
      setPages(prev => prev.map(p => 
        p.id === pageId ? {
          ...p,
          status: 'completed',
          processedUrl,
          processedData: imageData,
          resolution,
        } : p
      ));
      
      // 自动保存到收藏夹
      try {
        const page = pages.find(p => p.id === pageId);
        if (page) {
          await saveToFavorites(
            `修复页面 ${page.pageIndex + 1} - ${new Date().toLocaleString()}`,
            processedUrl,
            resolution,
            1,
            page.pageIndex
          );
        }
      } catch (e) {
        console.error('保存到收藏夹失败:', e);
      }
    } catch (error) {
      setPages(prev => prev.map(p => 
        p.id === pageId ? {
          ...p,
          status: 'error',
          error: (error as Error).message,
        } : p
      ));
    }
  }, [pages, apiKey, resolution, processPage, setPages]);

  const completedCount = pages.filter(p => p.status === 'completed').length;
  const failedCount = pages.filter(p => p.status === 'error').length;

  return {
    isProcessing,
    isStopping,
    currentIndex,
    progress,
    completedCount,
    failedCount,
    startProcessing,
    stopProcessing,
    retryPage,
  };
}
