/**
 * Shared layout for Login / Sign up / Forgot password: photo header with the
 * Danavi logo, an overlapping rounded panel with title + form, keyboard-safe scroll.
 */
import React from 'react';
import {
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {Button, TextInput, TextInputProps} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import images from '../../res/images';
import {color, radius, space} from '../../theme/tokens';
import {Text} from '../../ui/Text';
import {IconButton} from '../../ui/AppHeader';
import {IconName} from '../../ui/Icon';

const HEADER_HEIGHT = 230;

interface LayoutProps {
  title: string;
  subtitle?: string;
  image?: ImageSourcePropType;
  onBack?: () => void;
  backLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthLayout = ({
  title,
  subtitle,
  image = images.cauvang,
  onBack,
  backLabel = '',
  children,
  footer,
}: LayoutProps) => {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={{paddingBottom: insets.bottom + space.xl}}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={image} style={styles.headerImage} resizeMode="cover" />
          <View style={styles.scrim} />
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Image source={images.danavi_logo} style={styles.logo} resizeMode="contain" />
            </View>
          </View>
          {onBack ? (
            <View style={styles.back}>
              <IconButton icon="arrow-left" label={backLabel} onPress={onBack} filled />
            </View>
          ) : null}
        </View>

        <View style={styles.panel}>
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodySmall" tone="textSecondary" style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
          <View style={styles.form}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

type AuthInputProps = Omit<TextInputProps, 'mode' | 'left'> & {icon: IconName};

/** Outlined field with a leading icon, tuned to the Danavi tokens. */
export const AuthInput = ({icon, style, ...rest}: AuthInputProps) => (
  <TextInput
    mode="outlined"
    left={<TextInput.Icon icon={icon} color={color.textMuted} />}
    outlineColor={color.border}
    activeOutlineColor={color.primary}
    outlineStyle={styles.outline}
    textColor={color.text}
    placeholderTextColor={color.textMuted}
    style={[styles.input, style]}
    {...rest}
  />
);

/** Password field with show/hide toggle. */
export const PasswordInput = (props: Omit<AuthInputProps, 'icon' | 'secureTextEntry' | 'right'>) => {
  const [hidden, setHidden] = React.useState(true);
  return (
    <AuthInput
      icon="lock-outline"
      secureTextEntry={hidden}
      autoCapitalize="none"
      autoCorrect={false}
      right={
        <TextInput.Icon
          icon={hidden ? 'eye-outline' : 'eye-off-outline'}
          color={color.textMuted}
          onPress={() => setHidden(h => !h)}
          forceTextInputFocus={false}
        />
      }
      {...props}
    />
  );
};

export const AuthButton = ({
  label,
  onPress,
  loading,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
}) => (
  <Button
    mode="contained"
    icon={icon}
    onPress={onPress}
    loading={loading}
    disabled={disabled || loading}
    style={styles.button}
    contentStyle={styles.buttonContent}
    labelStyle={styles.buttonLabel}>
    {label}
  </Button>
);

/** "Chưa có tài khoản? Đăng ký" style footer line. */
export const AuthSwitch = ({
  question,
  action,
  onPress,
}: {
  question: string;
  action: string;
  onPress: () => void;
}) => (
  <View style={styles.switchRow}>
    <Text variant="bodySmall" tone="textSecondary">
      {question}{' '}
    </Text>
    <Text variant="label" tone="primary" onPress={onPress} accessibilityRole="link" suppressHighlighting>
      {action}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  flex: {flex: 1},
  page: {flex: 1, backgroundColor: color.surface},
  header: {height: HEADER_HEIGHT, backgroundColor: color.primary},
  headerImage: {...StyleSheet.absoluteFillObject, width: '100%', height: HEADER_HEIGHT},
  scrim: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.25)'},
  brand: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: space.xl},
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {width: 88, height: 88},
  back: {position: 'absolute', top: space.xs, left: space.xs},
  panel: {
    marginTop: -space.xl,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: color.surface,
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
  },
  subtitle: {marginTop: space.xxs},
  form: {marginTop: space.lg},
  footer: {marginTop: space.lg},
  input: {backgroundColor: color.surface, marginBottom: space.sm},
  outline: {borderRadius: radius.md},
  button: {marginTop: space.md, borderRadius: radius.md},
  buttonContent: {height: 52},
  buttonLabel: {fontSize: 16},
  switchRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap'},
});
