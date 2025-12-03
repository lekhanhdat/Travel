/**
 * RecommendationsWidget
 * Displays personalized recommendations on the HomeScreen
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import TextBase from '../common/TextBase';
import {AppStyle} from '../common/AppStyle';
import sizes from '../common/sizes';
import colors from '../common/colors';
import NavigationService from '../container/screens/NavigationService';
import {ScreenName} from '../container/AppContainer';
import {
  getRecommendations,
  Recommendation,
  EntityType,
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
  title = 'Đề xuất cho bạn',
  limit = 10,
}) => {
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
        if (fullData) {
          avatar = fullData.avatar || (fullData.images?.[0]) || avatar;
        }
      }

      return {...rec, fullData, avatar};
    });
  };

  const handleItemPress = (item: EnrichedRecommendation) => {
    if (!item.fullData) return;

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

  const getEntityLabel = (type: EntityType): string => {
    switch (type) {
      case 'location': return 'Địa điểm';
      case 'festival': return 'Lễ hội';
      case 'item': return 'Hiện vật';
      default: return '';
    }
  };

  const renderItem = ({item}: {item: EnrichedRecommendation}) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.8}>
      <Image
        source={{uri: item.avatar || 'https://via.placeholder.com/160'}}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.typeTag}>
          <TextBase style={styles.typeText}>{getEntityLabel(item.entity_type)}</TextBase>
        </View>
      </View>
      <View style={styles.itemInfo}>
        <TextBase style={styles.itemName} numberOfLines={2}>
          {item.name}
        </TextBase>
        <TextBase style={styles.reasonText} numberOfLines={1}>
          {item.reason}
        </TextBase>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <TextBase style={styles.loadingText}>Đang tải đề xuất...</TextBase>
      </View>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TextBase style={[AppStyle.txt_20_bold]}>{title}</TextBase>
        <TouchableOpacity onPress={fetchRecommendations} testID="refresh-button">
          <TextBase 
          style={[
            AppStyle.txt_18_regular, 
            {marginBottom: sizes._16sdp}
            ]}>
            Làm mới
          </TextBase>
        </TouchableOpacity>
      </View>
      <FlatList
        data={recommendations}
        renderItem={renderItem}
        keyExtractor={item => `${item.entity_type}_${item.entity_id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: sizes._24sdp,
    marginBottom: sizes._16sdp,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sizes._12sdp,
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
  },
  itemContainer: {
    width: sizes._160sdp,
    marginRight: sizes._12sdp,
    backgroundColor: colors.white,
    borderRadius: sizes._12sdp,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: sizes._120sdp,
    backgroundColor: colors.primary_100,
  },
  overlay: {
    position: 'absolute',
    top: sizes._8sdp,
    left: sizes._8sdp,
  },
  typeTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: sizes._8sdp,
    paddingVertical: sizes._4sdp,
    borderRadius: sizes._4sdp,
  },
  typeText: {
    fontSize: sizes._10sdp,
    color: colors.white,
    fontWeight: '600',
  },
  itemInfo: {
    padding: sizes._10sdp,
  },
  itemName: {
    fontSize: sizes._14sdp,
    fontWeight: '600',
    color: colors.primary_950,
    marginBottom: sizes._4sdp,
  },
  reasonText: {
    fontSize: sizes._11sdp,
    color: colors.primary_500,
    fontStyle: 'italic',
  },
});

export default RecommendationsWidget;

