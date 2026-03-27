import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, translations } from './translations';

export type Theme = 'dark' | 'light';

interface AppContextType {
  isDark: boolean;
  colors: any;
  setTheme: (theme: Theme) => void;
  currentLanguage: Language;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    async function load() {
      try {
        const savedTheme = await AsyncStorage.getItem('appTheme');
        if (savedTheme === 'dark' || savedTheme === 'light') setThemeState(savedTheme);
        const savedLang = await AsyncStorage.getItem('appLanguage');
        if (savedLang && savedLang in translations) setLanguageState(savedLang as Language);
      } catch (e) {}
    }
    load();
  }, []);

  async function setTheme(t: Theme) {
    setThemeState(t);
    await AsyncStorage.setItem('appTheme', t);
  }

  async function setLanguage(lang: Language) {
    setLanguageState(lang);
    await AsyncStorage.setItem('appLanguage', lang);
  }

  const isDark = theme === 'dark';

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
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <AppContext.Provider value={{ isDark, colors, setTheme, currentLanguage: language, t, setLanguage }}>
      {children}
    </AppContext.Provider>
  );
}

export function useTheme() {
  const { isDark, colors, setTheme } = useContext(AppContext);
  return { isDark, colors, setTheme, currentTheme: isDark ? 'dark' : 'light' as Theme };
}

export function useLanguage() {
  const { t, currentLanguage, setLanguage } = useContext(AppContext);
  return { t, currentLanguage, setLanguage };
}