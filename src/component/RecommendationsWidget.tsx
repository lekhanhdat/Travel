/**
 * RecommendationsWidget
 * Displays personalized recommendations on the HomeScreen
 */

import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import TextBase from '../common/TextBase';
import {AppStyle} from '../common/AppStyle';
import sizes from '../common/sizes';
import colors from '../common/colors';
import NavigationService from '../container/screens/NavigationService';
import {ScreenName} from '../container/AppContainer';
import BigItemLocation from './BigItemLocation';
import {
  getRecommendations,
  Recommendation,
} from '../services/semantic.api';
import locationApi from '../services/locations.api';
import festivalsApi from '../services/festivals.api';

interface RecommendationsWidgetProps {
  userId: number;
  title?: string;
  limit?: number;
}

interface EnrichedRecommendation extends Recommendation {
  fullData?: any;
  avatar?: string;
}

const RecommendationsWidget: React.FC<RecommendationsWidgetProps> = ({
  userId,
  title,
  limit = 10,
}) => {
  const {t} = useTranslation(['common', 'locations']);
  const [recommendations, setRecommendations] = useState<EnrichedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getRecommendations(userId, limit);

      if (!response.success || response.recommendations.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      // Enrich recommendations with full data
      const enriched = await enrichRecommendations(response.recommendations);
      setRecommendations(enriched);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const enrichRecommendations = async (
    recs: Recommendation[],
  ): Promise<EnrichedRecommendation[]> => {
    const [locations, festivals] = await Promise.all([
      locationApi.getLocations(),
      festivalsApi.getFestivals(),
    ]);

    return recs.map(rec => {
      let fullData = null;
      let avatar = rec.images?.[0] || '';

      if (rec.entity_type === 'location') {
        fullData = locations.find(
          loc => loc.Id === rec.entity_id || loc.id === rec.entity_id,
        );
        if (fullData) {
          avatar = fullData.avatar || (fullData.images?.[0]) || avatar;
        }
      } else if (rec.entity_type === 'festival') {
        fullData = festivals.find(fest => fest.Id === rec.entity_id);
        // Festival hiện chưa dùng UI BigItem, giữ avatar gốc nếu có
        if (fullData && (fullData as any)?.images?.length) {
          avatar = (fullData as any).images?.[0] || avatar;
        }
      }

      return {...rec, fullData, avatar};
    });
  };

  const handleItemPress = (item: EnrichedRecommendation) => {
    if (!item.fullData) {return;}

    if (item.entity_type === 'location') {
      NavigationService.navigate(ScreenName.DETAIL_LOCATION_SCREEN, {
        location: item.fullData,
      });
    } else if (item.entity_type === 'festival') {
      NavigationService.navigate(ScreenName.DETAIL_FESTIVAL_SCREEN, {
        festival: item.fullData,
      });
    }
  };

  // IMPORTANT: useMemo must be called before any early returns to follow Rules of Hooks
  const locationRecommendations = useMemo(
    () => recommendations.filter(rec => rec.entity_type === 'location'),
    [recommendations],
  );

  const renderItem = ({item}: {item: EnrichedRecommendation}) => (
    <BigItemLocation
      location={
        item.fullData || {
          name: item.name,
          description: item.reason,
          avatar: item.avatar || 'https://via.placeholder.com/200',
        }
      }
      onPress={() => handleItemPress(item)}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <TextBase style={styles.loadingText}>{t('common:recommendations.loading')}</TextBase>
      </View>
    );
  }

  if (error || locationRecommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TextBase style={[AppStyle.txt_20_bold]}>{title || t('common:recommendations.title')}</TextBase>
        <TouchableOpacity onPress={fetchRecommendations} testID="refresh-button">
          <TextBase style={[AppStyle.txt_18_regular]}>
            {t('common:buttons.refresh')}
          </TextBase>
        </TouchableOpacity>
      </View>
      <FlatList
        data={locationRecommendations}
        renderItem={renderItem}
        keyExtractor={item => `${item.entity_type}_${item.entity_id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: sizes._8sdp,
    // paddingBottom: sizes._8sdp, // tạo khoảng trống để bóng không bị cắt ở đáy
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshText: {
    fontSize: sizes._14sdp,
    color: colors.primary,
  },
  loadingContainer: {
    paddingVertical: sizes._32sdp,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: sizes._8sdp,
    fontSize: sizes._14sdp,
    color: colors.primary_400,
  },
  listContent: {
    paddingRight: sizes._16sdp,
    paddingVertical: sizes._14sdp, // thêm đệm để shadow item có khoảng hiển thị
  },
});

export default RecommendationsWidget;

