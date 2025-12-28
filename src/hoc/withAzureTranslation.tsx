import React from 'react';
import {useTranslation} from '../hooks/useTranslation';
import {Language} from '../context/TranslationContext';

export interface WithAzureTranslationProps {
  t: (text: string) => string;
  translate: (text: string) => Promise<string>;
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
}

/**
 * HOC to inject translation functions into class components
 * Replaces the old withTranslation HOC
 */
export function withAzureTranslation<P extends WithAzureTranslationProps>(
  WrappedComponent: React.ComponentType<P>,
) {
  const WithAzureTranslationComponent = (
    props: Omit<P, keyof WithAzureTranslationProps>,
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

  WithAzureTranslationComponent.displayName = `withAzureTranslation(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WithAzureTranslationComponent;
}

export default withAzureTranslation;

