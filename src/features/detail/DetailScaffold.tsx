/**
 * Layout shared by the location and festival Detail screens:
 * hero image with an overlay header, a single centered name line, then the body,
 * and an optional sticky primary action ("Chỉ đường") at the bottom.
 */
import React, {useState} from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import {Button} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ImageView from 'react-native-image-viewing';
import CachedImage from '../../component/CachedImage';
import NavigationService from '../../container/screens/NavigationService';
import {color, radius, space} from '../../theme/tokens';
import {Text} from '../../ui/Text';
import {IconButton} from '../../ui/AppHeader';

export const HERO_HEIGHT = 250;

interface Props {
  image: string;
  name: string;
  backLabel: string;
  shareLabel: string;
  shareMessage: string;
  children: React.ReactNode;
  cta?: {label: string; icon: string; onPress: () => void} | null;
}

export const DetailScaffold = ({
  image,
  name,
  backLabel,
  shareLabel,
  shareMessage,
  children,
  cta,
}: Props) => {
  const insets = useSafeAreaInsets();
  // Once the hero has scrolled away, the floating buttons get a solid bar + title.
  const [solid, setSolid] = useState(false);
  return (
    <View style={styles.page}>
      <ScrollView
        scrollEventThrottle={32}
        onScroll={e => {
          const next = e.nativeEvent.contentOffset.y > HERO_HEIGHT - 72;
          if (next !== solid) {setSolid(next);}
        }}
        contentContainerStyle={{paddingBottom: cta ? 96 + insets.bottom : space.xxxl}}
        showsVerticalScrollIndicator={false}>
        <CachedImage uri={image} style={styles.hero} showLoader={false} />
        <View style={styles.body}>
          {/* Owner request: the name stands alone on one centered line; meta goes below. */}
          <Text
            variant="title"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.name}
            accessibilityRole="header">
            {name}
          </Text>
          {children}
        </View>
      </ScrollView>

      <View style={[styles.overlay, solid && styles.overlaySolid]} pointerEvents="box-none">
        <IconButton
          icon="arrow-left"
          label={backLabel}
          onPress={() => NavigationService.pop()}
          filled
        />
        <Text variant="headline" numberOfLines={1} style={[styles.flex, styles.barTitle]}>
          {solid ? name : ''}
        </Text>
        <IconButton
          icon="share-variant-outline"
          label={shareLabel}
          onPress={() => Share.share({message: shareMessage}).catch(() => {})}
          filled
        />
      </View>

      {cta ? (
        <View style={[styles.cta, {paddingBottom: Math.max(insets.bottom, space.sm)}]}>
          <Button
            mode="contained"
            icon={cta.icon}
            onPress={cta.onPress}
            contentStyle={styles.ctaContent}
            labelStyle={styles.ctaLabel}>
            {cta.label}
          </Button>
        </View>
      ) : null}
    </View>
  );
};

/** Horizontal thumbnails + full-screen swipeable viewer. */
export const Gallery = ({images}: {images: string[]}) => {
  const [index, setIndex] = useState<number | null>(null);
  if (!images.length) {return null;}
  return (
    <>
      <FlatList
        data={images}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, i) => `${i}:${uri}`}
        renderItem={({item, index: i}) => (
          <Pressable
            onPress={() => setIndex(i)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`${i + 1}/${images.length}`}>
            <CachedImage uri={item} style={styles.thumb} showLoader={false} />
          </Pressable>
        )}
        initialNumToRender={3}
        windowSize={3}
      />
      <ImageView
        images={images.map(uri => ({uri}))}
        imageIndex={index ?? 0}
        visible={index !== null}
        onRequestClose={() => setIndex(null)}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
      />
    </>
  );
};

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: color.background},
  flex: {flex: 1},
  hero: {width: '100%', height: HERO_HEIGHT, backgroundColor: color.placeholder},
  body: {
    marginTop: -space.lg,
    borderTopLeftRadius: radius.lg + 4,
    borderTopRightRadius: radius.lg + 4,
    backgroundColor: color.background,
    paddingHorizontal: space.page,
    paddingTop: space.sm,
  },
  name: {textAlign: 'center'},
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlaySolid: {
    backgroundColor: color.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  barTitle: {marginHorizontal: space.xs},
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.page,
    paddingTop: space.sm,
    backgroundColor: color.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
  },
  ctaContent: {height: 48},
  ctaLabel: {fontSize: 16},
  thumb: {
    width: 132,
    height: 100,
    borderRadius: radius.md,
    marginRight: space.xs,
    backgroundColor: color.placeholder,
  },
});
