import { useEffect } from 'react';
import { useToolbarStore } from '@/store/useToolbarStore';

export function useUniversalKeyboard() {
  const { executeCommand, capabilities, activeFeature } = useToolbarStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Special case: Esc should blur inputs
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            if (activeFeature && capabilities.save) executeCommand('save');
            break;
          case 'p':
            e.preventDefault();
            if (activeFeature && capabilities.print) executeCommand('print');
            break;
          case 'n':
            e.preventDefault();
            if (activeFeature && capabilities.new) executeCommand('new');
            break;
          case 'd':
            e.preventDefault();
            if (activeFeature && capabilities.duplicate) executeCommand('duplicate');
            break;
          // Ctrl+Z, Ctrl+Shift+Z could map to undo/redo when grid is supported
        }
      } else {
        switch (e.key) {
          case 'Delete':
            // Only trigger if delete is enabled and we have a selection (handled by toolbar logic ideally, but we can just trigger it)
            if (activeFeature && capabilities.delete) executeCommand('delete');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeCommand, capabilities, activeFeature]);
}
