import React, {useState, useCallback, memo} from 'react';
import {
  Image,
  ImageProps,
  ImageStyle,
  StyleProp,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import colors from '../common/colors';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  style?: StyleProp<ImageStyle>;
  placeholderColor?: string;
  showLoader?: boolean;
}

/**
 * CachedImage - A performance-optimized image component
 *
 * Features:
 * - Uses cache: 'force-cache' for better caching
 * - Shows loading indicator while image loads
 * - Handles errors gracefully with placeholder
 * - Memoized to prevent unnecessary re-renders
 */
const CachedImage: React.FC<CachedImageProps> = memo(({
  uri,
  style,
  placeholderColor = colors.primary_100,
  showLoader = true,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
    if (__DEV__) {console.log('CachedImage error loading:', uri);}
  }, [uri]);

  // If no URI or error, show placeholder
  if (!uri || error) {
    return (
      <View style={[style, styles.placeholder, {backgroundColor: placeholderColor}]} />
    );
  }

  return (
    <View style={style}>
      <Image
        {...props}
        source={{
          uri,
          cache: 'force-cache', // Use aggressive caching
        }}
        style={[style, styles.image]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        resizeMode={props.resizeMode || 'cover'}
      />
      {loading && showLoader && (
        <View style={[StyleSheet.absoluteFill, styles.loaderContainer]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
});

CachedImage.displayName = 'CachedImage';

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default CachedImage;

