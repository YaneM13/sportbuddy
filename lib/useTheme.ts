import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

let currentTheme: Theme = 'dark';
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export async function setTheme(theme: Theme) {
  currentTheme = theme;
  notifyListeners();
  await AsyncStorage.setItem('appTheme', theme);
}

export async function loadTheme() {
  try {
    const saved = await AsyncStorage.getItem('appTheme');
    if (saved === 'dark' || saved === 'light') {
      currentTheme = saved;
      notifyListeners();
    }
  } catch (e) {}
}

export function getCurrentTheme(): Theme {
  return currentTheme;
}

export function useTheme() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(prev => prev + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const isDark = currentTheme === 'dark';

  const colors = {
    background: isDark ? '#0F1923' : '#ffffff',
    card: isDark ? '#1E2D3D' : '#ffffff',
    cardBorder: isDark ? '#2A3D50' : '#e0e0e0',
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#6B8FA8' : '#888888',
    accent: '#1D9E75',
    accentLight: isDark ? '#0F3D2E' : '#E1F5EE',
    accentText: isDark ? '#9FE1CB' : '#0F6E56',
    inputBg: isDark ? '#1E2D3D' : '#ffffff',
    inputBorder: isDark ? '#2A3D50' : '#e0e0e0',
    navBg: isDark ? '#0D1620' : '#ffffff',
    navBorder: isDark ? '#1E2D3D' : '#e0e0e0',
    menuBg: isDark ? '#0F1923' : '#ffffff',
    overlay: isDark ? 'rgba(10,26,18,0.78)' : 'rgba(0,0,0,0)',
  };

  return { isDark, colors, currentTheme };
}