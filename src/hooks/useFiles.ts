import { useState, useCallback } from 'react';
import { ProcessedPage, UploadMode } from '../types';
import * as pdfjs from 'pdfjs-dist';

// PDF.js worker - 使用本地文件
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export function useFiles() {
  const [pages, setPages] = useState<ProcessedPage[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('pdf');

  // 生成唯一 ID
  const generateId = () => Math.random().toString(36).substring(2, 15);

  // 文件转 base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 提取 PDF 页面
  const extractPdfPages = useCallback(async (file: File): Promise<ProcessedPage[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const extractedPages: ProcessedPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;

      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.replace('data:image/png;base64,', '');

      extractedPages.push({
        id: generateId(),
        originalUrl: dataUrl,
        originalData: base64Data,
        processedUrl: null,
        processedData: null,
        pageIndex: i - 1,
        status: 'pending',
        width: viewport.width,
        height: viewport.height,
        aspectRatio: viewport.width / viewport.height,
        selected: true,
      });
    }

    return extractedPages;
  }, []);

  // 处理图片文件
  const processImageFile = useCallback(async (file: File): Promise<ProcessedPage[]> => {
    const base64Data = await fileToBase64(file);
    const dataUrl = `data:image/png;base64,${base64Data}`;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve([{
          id: generateId(),
          originalUrl: dataUrl,
          originalData: base64Data,
          processedUrl: null,
          processedData: null,
          pageIndex: 0,
          status: 'pending',
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          selected: true,
        }]);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }, []);

  // 处理文件选择
  const handleFileChange = useCallback(async (file: File) => {
    setIsExtracting(true);
    try {
      // 判断文件类型
      const isPdf = file.type === 'application/pdf';
      setUploadMode(isPdf ? 'pdf' : 'image');

      let extractedPages: ProcessedPage[];
      
      if (isPdf) {
        extractedPages = await extractPdfPages(file);
      } else {
        extractedPages = await processImageFile(file);
      }

      setPages(extractedPages);
    } catch (error) {
      console.error('Failed to process file:', error);
      alert('文件处理失败: ' + (error as Error).message);
    } finally {
      setIsExtracting(false);
    }
  }, [extractPdfPages, processImageFile]);

  // 触发文件选择
  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.png,.jpg,.jpeg,.webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileChange(file);
      }
    };
    input.click();
  }, [handleFileChange]);

  // 重置
  const reset = useCallback(() => {
    setPages([]);
    setUploadMode('pdf');
  }, []);

  // 切换选择
  const toggleSelection = useCallback((id: string) => {
    setPages(prev => prev.map(p => 
      p.id === id ? { ...p, selected: !p.selected } : p
    ));
  }, []);

  // 全选/取消全选
  const selectAll = useCallback(() => {
    setPages(prev => prev.map(p => ({ ...p, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setPages(prev => prev.map(p => ({ ...p, selected: false })));
  }, []);

  return {
    pages,
    setPages,
    isExtracting,
    uploadMode,
    handleFileSelect,
    reset,
    toggleSelection,
    selectAll,
    deselectAll,
  };
}
