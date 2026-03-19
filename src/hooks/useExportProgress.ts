import { useState, useCallback } from 'react';

interface ExportProgress {
  isExporting: boolean;
  current: number;
  total: number;
  message: string;
}

export function useExportProgress() {
  const [progress, setProgress] = useState<ExportProgress>({
    isExporting: false,
    current: 0,
    total: 0,
    message: '',
  });

  const startExport = useCallback((total: number, message: string = '正在导出...') => {
    setProgress({
      isExporting: true,
      current: 0,
      total,
      message,
    });
  }, []);

  const updateProgress = useCallback((current: number, message?: string) => {
    setProgress(prev => ({
      ...prev,
      current,
      message: message || prev.message,
    }));
  }, []);

  const endExport = useCallback(() => {
    setProgress({
      isExporting: false,
      current: 0,
      total: 0,
      message: '',
    });
  }, []);

  return {
    progress,
    startExport,
    updateProgress,
    endExport,
  };
}
