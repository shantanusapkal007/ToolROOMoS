import { create } from 'zustand';

export type DensityMode = 'comfortable' | 'compact' | 'dense';

interface DensityState {
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
  cycleDensity: () => void;
}

export const useDensityStore = create<DensityState>((set) => ({
  density: 'comfortable',
  setDensity: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('toolroomos_density', mode);
      document.documentElement.setAttribute('data-density', mode);
    }
    set({ density: mode });
  },
  cycleDensity: () => set((state) => {
    const modes: DensityMode[] = ['comfortable', 'compact', 'dense'];
    const nextIdx = (modes.indexOf(state.density) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    if (typeof window !== 'undefined') {
      localStorage.setItem('toolroomos_density', nextMode);
      document.documentElement.setAttribute('data-density', nextMode);
    }
    return { density: nextMode };
  }),
}));
