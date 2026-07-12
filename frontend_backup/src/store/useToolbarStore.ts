import { create } from 'zustand';

export type ToolbarCommand = 
  | 'new' | 'save' | 'delete' | 'duplicate' 
  | 'import' | 'export' | 'print' | 'refresh' 
  | 'attachments' | 'history' | 'revision' | 'more' | 'search';

export interface CapabilityOptions {
  enabled: boolean;
  label?: string;
}

export type ToolbarCapabilities = Partial<Record<ToolbarCommand, boolean | CapabilityOptions>>;

interface ToolbarState {
  activeFeature: string | null;
  capabilities: ToolbarCapabilities;
  isDirty: boolean;
  isBusy: boolean;
  selection: any[];
  commands: Partial<Record<ToolbarCommand, () => void | Promise<void>>>;
  
  // Modal States
  isHistoryOpen: boolean;
  isAttachmentsOpen: boolean;
  isImportOpen: boolean;

  // Actions
  mountFeature: (featureId: string, caps: ToolbarCapabilities, commands: Partial<Record<ToolbarCommand, () => void | Promise<void>>>) => void;
  unmountFeature: (featureId: string) => void;
  setDirty: (isDirty: boolean) => void;
  setBusy: (isBusy: boolean) => void;
  setSelection: (selection: any[]) => void;
  updateCapabilities: (caps: ToolbarCapabilities) => void;
  executeCommand: (cmd: ToolbarCommand) => Promise<void>;
  setHistoryOpen: (isOpen: boolean) => void;
  setAttachmentsOpen: (isOpen: boolean) => void;
  setImportOpen: (isOpen: boolean) => void;
}

export const useToolbarStore = create<ToolbarState>((set, get) => ({
  activeFeature: null,
  capabilities: {},
  isDirty: false,
  isBusy: false,
  selection: [],
  commands: {},
  isHistoryOpen: false,
  isAttachmentsOpen: false,
  isImportOpen: false,

  setHistoryOpen: (isOpen) => set({ isHistoryOpen: isOpen }),
  setAttachmentsOpen: (isOpen) => set({ isAttachmentsOpen: isOpen }),
  setImportOpen: (isOpen) => set({ isImportOpen: isOpen }),

  mountFeature: (featureId, caps, commands) => set({
    activeFeature: featureId,
    capabilities: caps,
    commands,
    isDirty: false,
    isBusy: false,
    selection: []
  }),

  unmountFeature: (featureId) => set((state) => {
    if (state.activeFeature === featureId) {
      return {
        activeFeature: null,
        capabilities: {},
        commands: {},
        isDirty: false,
        isBusy: false,
        selection: []
      };
    }
    return state;
  }),

  setDirty: (isDirty) => set({ isDirty }),
  setBusy: (isBusy) => set({ isBusy }),
  setSelection: (selection) => set({ selection }),
  
  updateCapabilities: (caps) => set((state) => ({
    capabilities: { ...state.capabilities, ...caps }
  })),

  executeCommand: async (cmd) => {
    const { commands, isBusy, setBusy } = get();
    const handler = commands[cmd];
    
    if (!handler || isBusy) return;

    // If it's a save command, we automatically manage busy state
    if (cmd === 'save') {
      setBusy(true);
    }
    
    try {
      await handler();
    } catch (err) {
      console.error(`Error executing toolbar command ${cmd}:`, err);
    } finally {
      if (cmd === 'save') {
        setBusy(false);
      }
    }
  }
}));
