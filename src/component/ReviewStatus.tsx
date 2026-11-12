import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {Button} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {Text} from '../ui/Text';
import {Icon} from '../ui/Icon';
import {color, space} from '../theme/tokens';

/** R-FIX4: reviews list placeholder — loading, error with retry, or truly empty. */
export default function ReviewStatus({status, onRetry}: {
  status: 'loading' | 'error' | 'ready';
  onRetry: () => void;
}) {
  const {t} = useTranslation('common');
  if (status === 'loading') {
    return <ActivityIndicator style={styles.box} color={color.primary} accessibilityLabel={t('reviews.loading')} />;
  }
  if (status === 'error') {
    return (
      <View style={styles.box} accessibilityRole="alert">
        <Icon name="cloud-off-outline" size={32} color={color.textMuted} />
        <Text variant="bodySmall" tone="textSecondary" style={styles.text}>{t('reviews.loadError')}</Text>
        <Button mode="outlined" onPress={onRetry}>{t('reviews.retry')}</Button>
      </View>
    );
  }
  return (
    <View style={styles.box}>
      <Icon name="comment-text-outline" size={32} color={color.textMuted} />
      <Text variant="bodySmall" tone="textSecondary" style={styles.text}>{t('detail.noReviews')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {alignItems: 'center', paddingVertical: space.lg},
  text: {marginVertical: space.xs, textAlign: 'center'},
});
