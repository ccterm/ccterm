import { useMemo } from 'react';
import { useConfigStore } from '../store/configStore';
import type { ProfileConfig, ColorScheme } from '../../shared/configTypes';

const FALLBACK_PROFILE: ProfileConfig = {
  name: 'Default', commandLine: '', icon: '', startingDirectory: '',
  colorScheme: 'One Half Dark', fontFace: 'Consolas', fontSize: 14,
  opacity: 1.0, backgroundImage: '', backgroundImageStretchMode: 'uniformToFill',
  cursorShape: 'block', cursorColor: '#ffffff', useAcrylic: false,
  bellStyle: 'audible', scrollbackLines: 5000, elevation: false,
};

export function useProfile(profileName?: string): ProfileConfig {
  const config = useConfigStore((s) => s.config);
  return useMemo(() => {
    if (!config || !config.profiles.length) return FALLBACK_PROFILE;
    const profile = profileName
      ? config.profiles.find((p) => p.name === profileName)
      : config.profiles[0];
    return profile || config.profiles[0] || FALLBACK_PROFILE;
  }, [config, profileName]);
}

export function useScheme(schemeName?: string): ColorScheme {
  const config = useConfigStore((s) => s.config);
  return useMemo(() => {
    if (!config || !config.schemes.length) {
      return { name: 'Dark', background: '#0c0c0c', foreground: '#cccccc', cursor: '#ffffff', selectionBackground: '#264f78', black: '#0c0c0c', red: '#c50f1f', green: '#13a10e', yellow: '#c19c00', blue: '#0037da', magenta: '#881798', cyan: '#3a96dd', white: '#cccccc', brightBlack: '#767676', brightRed: '#e74856', brightGreen: '#16c60c', brightYellow: '#f9f1a5', brightBlue: '#3b78ff', brightMagenta: '#b4009e', brightCyan: '#61d6d6', brightWhite: '#f2f2f2' };
    }
    const scheme = schemeName
      ? config.schemes.find((s) => s.name === schemeName)
      : config.schemes[0];
    return scheme || config.schemes[0];
  }, [config, schemeName]);
}
