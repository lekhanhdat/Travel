import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {space} from '../theme/tokens';
import {Text} from './Text';

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeader = ({title, actionLabel, onAction}: Props) => (
  <View style={styles.row}>
    <Text variant="headline" style={styles.title} accessibilityRole="header">
      {title}
    </Text>
    {actionLabel && onAction ? (
      <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
        <Text variant="label" tone="textLink">
          {actionLabel}
        </Text>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.page,
    marginBottom: space.sm,
  },
  title: {flex: 1, marginRight: space.xs},
});

export default SectionHeader;
