import React from 'react';
import {useLanguage, Language} from './index';

// HOC to inject translation functions into class components
export interface WithTranslationProps {
  t: (key: string, params?: Record<string, string>) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export function withTranslation<P extends WithTranslationProps>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithTranslationComponent = (props: Omit<P, keyof WithTranslationProps>) => {
    const {t, language, setLanguage} = useLanguage();
    
    return (
      <WrappedComponent
        {...(props as P)}
        t={t}
        language={language}
        setLanguage={setLanguage}
      />
    );
  };

  WithTranslationComponent.displayName = `withTranslation(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithTranslationComponent;
}
