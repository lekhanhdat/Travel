import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {Button} from 'react-native-paper';
import {useTranslation} from '../hooks/useTranslation';
import {Text} from '../ui/Text';
import {Icon} from '../ui/Icon';
import {color, radius, space} from '../theme/tokens';

export default function CatalogStatus({loading, error, onRetry}: {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const {t} = useTranslation();
  if (loading) {
    return <ActivityIndicator style={styles.loader} color={color.primary} accessibilityLabel={t('recovery.loading')} />;
  }
  if (!error) {return null;}
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Icon name="wifi-off" size={20} color={color.warning} />
      <Text variant="bodySmall" style={styles.text}>{t('recovery.catalogUnavailable')}</Text>
      <Button compact onPress={onRetry}>{t('recovery.retry')}</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {paddingVertical: space.md},
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: space.page,
    marginVertical: space.xs,
    paddingLeft: space.sm,
    borderRadius: radius.md,
    backgroundColor: color.warningContainer,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.warning,
  },
  text: {flex: 1, marginLeft: space.xs},
});
