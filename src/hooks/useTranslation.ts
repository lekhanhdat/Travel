import {useState, useEffect, useCallback} from 'react';
import {useTranslationContext, Language} from '../context/TranslationContext';

interface UseTranslationReturn {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (text: string) => string;
  translate: (text: string) => Promise<string>;
  isLoading: boolean;
}

/**
 * Hook for accessing translation functionality
 * Replaces the old useLanguage hook
 */
export function useTranslation(): UseTranslationReturn {
  const {language, setLanguage, translate, translateSync, isLoading} =
    useTranslationContext();

  // t() function for synchronous access (returns cached or original text)
  const t = useCallback(
    (text: string): string => {
      return translateSync(text);
    },
    [translateSync],
  );

  return {
    language,
    setLanguage,
    t,
    translate,
    isLoading,
  };
}

/**
 * Hook for translating a single text with auto-fetch
 */
export function useTranslatedText(text: string): {
  translatedText: string;
  isLoading: boolean;
} {
  const {translate, language} = useTranslationContext();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchTranslation = async () => {
      if (!text) {
        setTranslatedText('');
        return;
      }

      setIsLoading(true);
      try {
        const result = await translate(text);
        if (mounted) {
          setTranslatedText(result);
        }
      } catch {
        if (mounted) {
          setTranslatedText(text);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTranslation();

    return () => {
      mounted = false;
    };
  }, [text, language, translate]);

  return {translatedText, isLoading};
}

export default useTranslation;

