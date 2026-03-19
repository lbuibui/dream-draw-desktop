import { useEffect, useCallback } from 'react';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: (e: KeyboardEvent) => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    shortcuts.forEach(shortcut => {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
      const shiftMatch = shortcut.shift ? e.shiftKey : true;

      if (keyMatch && ctrlMatch && shiftMatch) {
        e.preventDefault();
        shortcut.handler(e);
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// 便捷 hook：通用快捷键
export function useAppShortcuts({
  onOpenFile,
  onExport,
  onSelectAll,
  onSettings,
  enabled = true,
}: {
  onOpenFile?: () => void;
  onExport?: () => void;
  onSelectAll?: () => void;
  onSettings?: () => void;
  enabled?: boolean;
}) {
  useKeyboardShortcuts([
    { key: 'o', ctrl: true, handler: () => enabled && onOpenFile?.() },
    { key: 's', ctrl: true, handler: () => enabled && onExport?.() },
    { key: 'a', ctrl: true, handler: () => enabled && onSelectAll?.() },
    { key: ',', ctrl: true, handler: () => enabled && onSettings?.() },
  ]);
}
