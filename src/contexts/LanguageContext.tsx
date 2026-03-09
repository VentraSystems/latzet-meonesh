import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import en, { Translations } from '../i18n/en';
import he from '../i18n/he';

export type Language = 'en' | 'he';

interface LanguageContextType {
  language: Language;
  t: Translations;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
}

const translations: Record<Language, Translations> = { en, he };
const STORAGE_KEY = '@escape_challenge_language';

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  t: en,
  isRTL: false,
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'he') {
        setLanguageState(stored);
      } else {
        // Auto-detect from device locale
        const locale = Localization.getLocales()[0]?.languageCode || 'en';
        setLanguageState(locale === 'he' ? 'he' : 'en');
      }
    } catch {
      setLanguageState('en');
    } finally {
      setLoaded(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  };

  if (!loaded) return null;

  return (
    <LanguageContext.Provider
      value={{
        language,
        t: translations[language],
        isRTL: language === 'he',
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
