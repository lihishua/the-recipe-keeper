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
  /** Main app text font — Chewy (EN) or Gan (HE) */
  fontHe: string | undefined;
  /** Main app text font — same as fontHe */
  fontApp: string;
  /** Recipe template font — GrandRainbow (EN) or Dybbuk-Regular (HE) */
  fontRecipe: string;
  /** Main page header font — Scripto (EN) or Gan (HE) */
  fontHeader: string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'he',
  setLang: () => {},
  t: (key) => key,
  isRTL: true,
  fontHe: 'Gan',
  fontApp: 'Gan',
  fontRecipe: 'Dybbuk-Regular',
  fontHeader: 'Scripto',
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
  const fontApp = lang === 'en' ? 'Chewy' : 'Gan';
  const fontRecipe = lang === 'en' ? 'GrandRainbow' : 'Dybbuk-Regular';
  const fontHeader = 'Scripto';
  const fontHe: string | undefined = fontApp;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL, fontHe, fontApp, fontRecipe, fontHeader }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
