import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import i18n from '../i18n';
import LocalStorageCommon from '../utils/LocalStorageCommon';
import {translationQueue} from '../services/translation';

export type Language = 'vi' | 'en';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (text: string) => Promise<string>;
  translateSync: (text: string) => string;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined,
);

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>('vi');
  const [isLoading, setIsLoading] = useState(false);
  const [translations, setTranslations] = useState<Map<string, string>>(
    new Map(),
  );

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await LocalStorageCommon.getItem('app_language');
      if (savedLanguage && (savedLanguage === 'vi' || savedLanguage === 'en')) {
        setLanguageState(savedLanguage);
       // Sync with i18n
       await i18n.changeLanguage(savedLanguage);
     } else {
       // Default to Vietnamese
       setLanguageState('vi');
       await i18n.changeLanguage('vi');
      }
    } catch (error) {
      console.log('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await LocalStorageCommon.setItem('app_language', lang);
      setLanguageState(lang);
     // Sync with i18n
     await i18n.changeLanguage(lang);
      setTranslations(new Map()); // Clear cached translations on language change
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const translate = useCallback(
    async (text: string): Promise<string> => {
      if (!text) return '';

     // 1. Check if it's an i18n key (contains ':' or '.')
     if (text.includes(':') || text.includes('.')) {
       // It's an i18n key, use i18n directly
       if (i18n.exists(text)) {
         return i18n.t(text);
       }
     }

     // 2. Try to find it in i18n common namespace
     const commonKey = `common.${text}`;
     if (i18n.exists(commonKey)) {
       return i18n.t(commonKey);
     }

      // Check local state cache
     const cached = translations.get(text);
      if (cached) return cached;

     // 3. If not in i18n and language is English, return as-is
     if (language === 'en') return text;

     // 4. Use Azure Translator for dynamic content not in i18n
      try {
        setIsLoading(true);
        const translated = await translationQueue.translate(
         text,
          language,
          'en',
        );
       setTranslations(prev => new Map(prev).set(text, translated));
        return translated;
      } catch (error) {
        console.error('Translation error:', error);
       return text;
      } finally {
        setIsLoading(false);
      }
    },
    [language, translations],
  );

  const translateSync = useCallback(
    (text: string): string => {
      if (!text) return '';

     // 1. Check if it's an i18n key (contains ':' or '.')
     if (text.includes(':') || text.includes('.')) {
       // It's an i18n key, use i18n directly
       if (i18n.exists(text)) {
         return i18n.t(text);
       }
     }

     // 2. Try to find it in i18n common namespace
     const commonKey = `common.${text}`;
     if (i18n.exists(commonKey)) {
       return i18n.t(commonKey);
     }

      // Check dynamic translations cache
     const cached = translations.get(text);
      if (cached) {
        return cached;
      }

     // Return original text if not found
     return text;
    },
    [language, translations],
  );

  return (
    <TranslationContext.Provider
      value={{language, setLanguage, translate, translateSync, isLoading}}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error(
      'useTranslationContext must be used within a TranslationProvider',
    );
  }
  return context;
};

export default TranslationProvider;
