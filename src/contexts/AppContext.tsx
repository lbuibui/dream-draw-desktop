/**
 * 全局应用状态管理
 */
import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type { AppConfig, ProcessedPage } from '../types';
import type { UploadModeType } from '../constants';

// 状态类型
interface AppState {
  config: AppConfig;
  pages: ProcessedPage[];
  uploadMode: UploadModeType | null;
  isExtracting: boolean;
  isProcessing: boolean;
  isStopping: boolean;
  progress: number;
  completedCount: number;
}

// Action 类型
type AppAction =
  | { type: 'SET_CONFIG'; payload: Partial<AppConfig> }
  | { type: 'SET_PAGES'; payload: ProcessedPage[] }
  | { type: 'ADD_PAGES'; payload: ProcessedPage[] }
  | { type: 'UPDATE_PAGE'; payload: { id: string; updates: Partial<ProcessedPage> } }
  | { type: 'SET_UPLOAD_MODE'; payload: UploadModeType | null }
  | { type: 'SET_EXTRACTING'; payload: boolean }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_STOPPING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_COMPLETED_COUNT'; payload: number }
  | { type: 'RESET' };

// 初始状态
const initialState: AppState = {
  config: {
    apiKey: null,
    resolution: '2K',
    theme: 'light',
    language: 'cn',
  },
  pages: [],
  uploadMode: null,
  isExtracting: false,
  isProcessing: false,
  isStopping: false,
  progress: 0,
  completedCount: 0,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    
    case 'SET_PAGES':
      return { ...state, pages: action.payload };
    
    case 'ADD_PAGES':
      return { ...state, pages: [...state.pages, ...action.payload] };
    
    case 'UPDATE_PAGE': {
      const { id, updates } = action.payload;
      return {
        ...state,
        pages: state.pages.map(page =>
          page.id === id ? { ...page, ...updates } : page
        ),
      };
    }
    
    case 'SET_UPLOAD_MODE':
      return { ...state, uploadMode: action.payload };
    
    case 'SET_EXTRACTING':
      return { ...state, isExtracting: action.payload };
    
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    
    case 'SET_STOPPING':
      return { ...state, isStopping: action.payload };
    
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    
    case 'SET_COMPLETED_COUNT':
      return { ...state, completedCount: action.payload };
    
    case 'RESET':
      return {
        ...initialState,
        config: state.config, // 保留配置
      };
    
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // 便捷方法
  setConfig: (config: Partial<AppConfig>) => void;
  updatePage: (id: string, updates: Partial<ProcessedPage>) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// Provider
interface AppProviderProps {
  children: ReactNode;
  initialConfig?: Partial<AppConfig>;
}

export function AppProvider({ children, initialConfig }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    config: { ...initialState.config, ...initialConfig },
  });

  const setConfig = useCallback((config: Partial<AppConfig>) => {
    dispatch({ type: 'SET_CONFIG', payload: config });
  }, []);

  const updatePage = useCallback((id: string, updates: Partial<ProcessedPage>) => {
    dispatch({ type: 'UPDATE_PAGE', payload: { id, updates } });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value: AppContextType = {
    state,
    dispatch,
    setConfig,
    updatePage,
    reset,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
