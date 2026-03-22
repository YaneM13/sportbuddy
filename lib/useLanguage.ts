import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Language, translations } from './translations';

export type { Language };

const DEFAULT_LANGUAGE: Language = 'en';

let currentLanguage: Language = DEFAULT_LANGUAGE;
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export async function setLanguage(lang: Language) {
  currentLanguage = lang;
  await AsyncStorage.setItem('appLanguage', lang);
  notifyListeners();
}

export async function loadLanguage() {
  try {
    const saved = await AsyncStorage.getItem('appLanguage');
    if (saved && saved in translations) {
      currentLanguage = saved as Language;
      notifyListeners();
    }
  } catch (e) {}
}

export function useLanguage() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  };

  return { t, currentLanguage };
}

export function getCurrentLanguage(): Language {
  return currentLanguage;
}