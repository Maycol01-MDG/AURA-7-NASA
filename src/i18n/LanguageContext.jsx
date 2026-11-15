import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import messages from './messages.tsv?raw';
import { createTranslator } from './translate';

const STORAGE_KEY = 'aura7-language';
const LanguageContext = createContext(null);

function getInitialLanguage() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') return saved;
  } catch {
    // Language switching still works when browser storage is unavailable.
  }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);
  const t = useMemo(() => createTranslator(messages, language), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === 'es'
      ? 'AURA-7 | Copiloto de salud y ritmo circadiano — Andes Space Labs'
      : 'AURA-7 | Autonomous Circadian & Health Copilot — Andes Space Labs';
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // A browser storage restriction must not prevent changing the language.
    }
  }, [language]);

  const value = useMemo(() => ({
    language,
    locale: language === 'es' ? 'es-CO' : 'en-US',
    setLanguage: (next) => {
      if (next === 'en' || next === 'es') setLanguage(next);
    },
    t,
  }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage requires LanguageProvider');
  return context;
}
