// src/context/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { translations, Lang, TranslationKey } from '../i18n/translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  /** 'Noot' in Hebrew mode, undefined in English — use as fontFamily for UI text */
  fontHe: string | undefined;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'he',
  setLang: () => {},
  t: (key) => key,
  isRTL: true,
  fontHe: 'Gan',
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('he');

  useEffect(() => {
    AsyncStorage.getItem('2spoons_lang').then((saved) => {
      const l: Lang = (saved === 'en' || saved === 'he') ? saved : 'he';
      setLangState(l);
      I18nManager.forceRTL(l === 'he');
    });
  }, []);

  const setLang = async (l: Lang) => {
    setLangState(l);
    await AsyncStorage.setItem('2spoons_lang', l);
    I18nManager.forceRTL(l === 'he');
  };

  const t = (key: TranslationKey): string => translations[lang][key] ?? key;
  const isRTL = lang === 'he';
  const fontHe: string | undefined = 'Gan'; // always — all text in the app uses Gan

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL, fontHe }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
