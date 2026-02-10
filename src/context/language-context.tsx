
'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { translations, type Language } from '@/config/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  getTranslation: (key: string, substitutions?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const getTranslation = useCallback((key: string, substitutions: Record<string, string> = {}): string => {
    let text = translations[key]?.[language] || key;
    // Use a loop with a regex to replace all occurrences, preventing infinite loops.
    for (const subKey in substitutions) {
        // Create a global regex to replace all instances of `{subKey}`
        const regex = new RegExp(`\\{${subKey}\\}`, 'g');
        text = text.replace(regex, substitutions[subKey]);
    }
    return text;
  }, [language]);


  return (
    <LanguageContext.Provider value={{ language, setLanguage, getTranslation }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
