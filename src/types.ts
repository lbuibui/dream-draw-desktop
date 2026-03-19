export interface ProcessedPage {
  id: string;
  originalUrl: string;
  originalData: string; // base64
  processedUrl: string | null;
  processedData: string | null; // base64
  pageIndex: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  width: number;
  height: number;
  aspectRatio: number;
  resolution?: '2K' | '4K';
  selected: boolean;
  error?: string;
}

export interface AppConfig {
  apiKey: string | null;
  resolution: '2K' | '4K';
  theme: 'light' | 'dark';
  language: 'cn' | 'en';
}

export type Language = 'cn' | 'en';

export type Theme = 'light' | 'dark';

export type UploadMode = 'pdf' | 'image';

export interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
  startTime: number;
}

export interface TranslationKeys {
  title: string;
  subtitle: string;
  description: string;
  uploadTitle: string;
  uploadDesc: string;
  extracting: string;
  pages: string;
  start: string;
  exportPdf: string;
  exportPptx: string;
  exportZip: string;
  restored: string;
  failed: string;
  enhancing: string;
  holdToView: string;
  clickToView: string;
  page: string;
  res2k: string;
  res4k: string;
  highCost: string;
  enhancingTo: string;
  selectAll: string;
  deselectAll: string;
  allDone: string;
  downloadNow: string;
  compareModalTitle: string;
  original: string;
  processed: string;
  close: string;
  stop: string;
  stopping: string;
  continue: string;
  stopped: string;
  uploadNew: string;
  keyModalTitle: string;
  keyModalDesc: string;
  keyInputPlaceholder: string;
  invalidKey: string;
  networkError: string;
  save: string;
  getKey: string;
  tip: string;
  copyright: string;
  builtBy: string;
  rights: string;
  privacy: string;
  terms: string;
  disclaimerTitle: string;
  disclaimerText: string;
  selectFiles: string;
  dropFilesHere: string;
  supportedFormats: string;
  processing: string;
  settings: string;
  apiSettings: string;
  generalSettings: string;
  language: string;
  theme: string;
  light: string;
  dark: string;
  system: string;
  version: string;
  pending: string;
  resolution: string;
}
