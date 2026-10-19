import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {Button} from 'react-native-paper';
import TextBase from '../common/TextBase';
import {useTranslation} from '../hooks/useTranslation';

export default function CatalogStatus({loading, error, onRetry}: {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const {t} = useTranslation();
  if (loading) {return <ActivityIndicator accessibilityLabel={t('recovery.loading')} />;}
  if (!error) {return null;}
  return (
    <View style={{padding: 16}} accessibilityRole="alert">
      <TextBase>{t('recovery.catalogUnavailable')}</TextBase>
      <Button onPress={onRetry}>{t('recovery.retry')}</Button>
    </View>
  );
}
