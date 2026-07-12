import { create } from 'zustand';

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  row: any | null;
  openContextMenu: (e: React.MouseEvent, row: any) => void;
  closeContextMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  isOpen: false,
  x: 0,
  y: 0,
  row: null,
  openContextMenu: (e, row) => {
    e.preventDefault();
    set({ isOpen: true, x: e.clientX, y: e.clientY, row });
  },
  closeContextMenu: () => set({ isOpen: false, row: null }),
}));
