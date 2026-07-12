import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToolbarStore } from '@/store/useToolbarStore';

export interface StandardToolbarProps {
  featureId: string;
  onNew?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onPrint?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onHistory?: () => void;
  onRevision?: () => void;
  onAttachments?: () => void;
  onRefresh?: () => void;
  onSearch?: () => void;
  selection?: any[];
}

const EMPTY_SELECTION: any[] = [];

export function useStandardToolbar({
  featureId,
  onNew,
  onSave,
  onDelete,
  onDuplicate,
  onPrint,
  onImport,
  onExport,
  onHistory,
  onRevision,
  onAttachments,
  onRefresh,
  onSearch,
  selection = EMPTY_SELECTION
}: StandardToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { mountFeature, unmountFeature, setSelection } = useToolbarStore();

  const callbacksRef = useRef({ 
    onNew, onSave, onDelete, onDuplicate, 
    onPrint, onImport, onExport, onHistory, onRevision, onAttachments, onRefresh, onSearch
  });

  useEffect(() => {
    callbacksRef.current = { 
      onNew, onSave, onDelete, onDuplicate, 
      onPrint, onImport, onExport, onHistory, onRevision, onAttachments, onRefresh, onSearch
    };
  });

  useEffect(() => {
    setSelection(selection);
  }, [selection, setSelection]);

  useEffect(() => {
    mountFeature(
      featureId,
      {
        new: !!onNew,
        save: !!onSave,
        delete: !!onDelete,
        duplicate: !!onDuplicate,
        print: !!onPrint,
        import: !!onImport,
        export: !!onExport,
        history: !!onHistory,
        revision: !!onRevision,
        attachments: !!onAttachments,
        refresh: !!onRefresh,
        search: !!onSearch
      },
      {
        new: () => {
          if (callbacksRef.current.onNew) callbacksRef.current.onNew();
          else if (!pathname.endsWith('/new')) router.push(`${pathname}/new`);
        },
        save: () => callbacksRef.current.onSave?.(),
        delete: () => callbacksRef.current.onDelete?.(),
        duplicate: () => callbacksRef.current.onDuplicate?.(),
        print: () => callbacksRef.current.onPrint?.(),
        import: () => callbacksRef.current.onImport?.(),
        export: () => callbacksRef.current.onExport?.(),
        history: () => callbacksRef.current.onHistory?.(),
        revision: () => callbacksRef.current.onRevision?.(),
        attachments: () => callbacksRef.current.onAttachments?.(),
        refresh: () => callbacksRef.current.onRefresh?.(),
        search: () => callbacksRef.current.onSearch?.()
      }
    );

    return () => unmountFeature(featureId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    featureId, pathname, router, 
    !!onNew, !!onSave, !!onDelete, !!onDuplicate, 
    !!onPrint, !!onImport, !!onExport, !!onHistory, !!onRevision, 
    !!onAttachments, !!onRefresh, !!onSearch
  ]);
}
