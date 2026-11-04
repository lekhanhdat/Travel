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
  // UI strings come from i18n only; there is no async translation any more.
  const isLoading = false;

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
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const translateSync = useCallback(
    (text: string): string => {
      if (!text) return '';

     // 1. Check if it's an i18n key (contains ':' or '.')
     if (text.includes(':') || text.includes('.')) {
       // It's an i18n key, use i18n directly
       if (i18n.exists(text)) {
         return i18n.t(text, {lng: language});
       }
     }

     // 2. Try to find it in i18n common namespace
     const commonKey = `common.${text}`;
     if (i18n.exists(commonKey)) {
       return i18n.t(commonKey, {lng: language});
     }

     // Return original text if not found
     return text;
    },
    [language],
  );

  const translate = useCallback(
    async (text: string): Promise<string> => translateSync(text),
    [translateSync],
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
