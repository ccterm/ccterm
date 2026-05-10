import { create } from 'zustand';
import type { AppConfig, ProfileConfig, ColorScheme, Keybinding } from '../../shared/configTypes';

interface ConfigState {
  config: AppConfig | null;
  loading: boolean;
  loaded: boolean;

  load: () => Promise<void>;
  save: () => Promise<void>;
  updateGlobal: (patch: Partial<AppConfig['global']>) => void;
  updateProfile: (index: number, patch: Partial<ProfileConfig>) => void;
  addProfile: (profile: ProfileConfig) => void;
  removeProfile: (index: number) => void;
  updateScheme: (index: number, patch: Partial<ColorScheme>) => void;
  addScheme: (scheme: ColorScheme) => void;
  updateKeybinding: (index: number, patch: Partial<Keybinding>) => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  loading: false,
  loaded: false,

  load: async () => {
    set({ loading: true });
    const config = await window.configAPI.get();
    set({ config, loading: false, loaded: true });
  },

  save: async () => {
    const { config } = get();
    if (config) {
      await window.configAPI.save(config);
    }
  },

  updateGlobal: (patch) => {
    set((state) => {
      if (!state.config) return state;
      return {
        config: {
          ...state.config,
          global: { ...state.config.global, ...patch },
        },
      };
    });
  },

  updateProfile: (index, patch) => {
    set((state) => {
      if (!state.config) return state;
      const profiles = [...state.config.profiles];
      profiles[index] = { ...profiles[index], ...patch };
      return { config: { ...state.config, profiles } };
    });
  },

  addProfile: (profile) => {
    set((state) => {
      if (!state.config) return state;
      return { config: { ...state.config, profiles: [...state.config.profiles, profile] } };
    });
  },

  removeProfile: (index) => {
    set((state) => {
      if (!state.config) return state;
      const profiles = state.config.profiles.filter((_, i) => i !== index);
      return { config: { ...state.config, profiles } };
    });
  },

  updateScheme: (index, patch) => {
    set((state) => {
      if (!state.config) return state;
      const schemes = [...state.config.schemes];
      schemes[index] = { ...schemes[index], ...patch };
      return { config: { ...state.config, schemes } };
    });
  },

  addScheme: (scheme) => {
    set((state) => {
      if (!state.config) return state;
      return { config: { ...state.config, schemes: [...state.config.schemes, scheme] } };
    });
  },

  updateKeybinding: (index, patch) => {
    set((state) => {
      if (!state.config) return state;
      const keybindings = [...state.config.keybindings];
      keybindings[index] = { ...keybindings[index], ...patch };
      return { config: { ...state.config, keybindings } };
    });
  },
}));
