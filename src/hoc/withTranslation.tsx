import React from 'react';
import {useTranslation} from '../hooks/useTranslation';
import {Language} from '../context/TranslationContext';

export interface WithTranslationProps {
  t: (text: string) => string;
  translate: (text: string) => Promise<string>;
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
}

/**
 * HOC to inject translation functions into class components
 * (class screens cannot call the useTranslation hook)
 */
export function withTranslation<P extends WithTranslationProps>(
  WrappedComponent: React.ComponentType<P>,
) {
  const WithTranslationComponent = (
    props: Omit<P, keyof WithTranslationProps>,
  ) => {
    const {t, translate, language, setLanguage, isLoading} = useTranslation();

    return (
      <WrappedComponent
        {...(props as P)}
        t={t}
        translate={translate}
        language={language}
        setLanguage={setLanguage}
        isLoading={isLoading}
      />
    );
  };

  WithTranslationComponent.displayName = `withTranslation(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WithTranslationComponent;
}

export default withTranslation;

