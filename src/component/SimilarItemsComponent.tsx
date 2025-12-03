/**
 * SimilarItemsComponent
 * Displays similar items based on semantic similarity from the backend API
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
  getSimilarItems,
  SimilarItem,
  EntityType,
} from '../services/semantic.api';
import locationApi from '../services/locations.api';
import festivalsApi from '../services/festivals.api';

interface SimilarItemsComponentProps {
  entityType: EntityType;
  entityId: number;
  title?: string;
  limit?: number;
}

interface EnrichedSimilarItem extends SimilarItem {
  fullData?: any;
  avatar?: string;
}

const SimilarItemsComponent: React.FC<SimilarItemsComponentProps> = ({
  entityType,
  entityId,
  title = 'Có thể bạn sẽ thích',
  limit = 5,
}) => {
  const [items, setItems] = useState<EnrichedSimilarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSimilarItems();
  }, [entityType, entityId]);

  const fetchSimilarItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getSimilarItems(entityType, entityId, limit);

      if (!response.success || response.similar_items.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Enrich items with full data for navigation
      const enrichedItems = await enrichItems(response.similar_items);
      setItems(enrichedItems);
    } catch (err: any) {
      console.error('Error fetching similar items:', err);
      setError(err.message || 'Failed to load similar items');
    } finally {
      setLoading(false);
    }
  };

  const enrichItems = async (
    similarItems: SimilarItem[],
  ): Promise<EnrichedSimilarItem[]> => {
    // Fetch full data for navigation
    const [locations, festivals] = await Promise.all([
      locationApi.getLocations(),
      festivalsApi.getFestivals(),
    ]);

    return similarItems.map(item => {
      let fullData = null;
      let avatar = item.image_url || '';

      if (item.entity_type === 'location') {
        fullData = locations.find(
          loc => loc.Id === item.entity_id || loc.id === item.entity_id,
        );
        if (fullData) {
          avatar = fullData.avatar || (fullData.images?.[0]) || avatar;
        }
      } else if (item.entity_type === 'festival') {
        fullData = festivals.find(fest => fest.Id === item.entity_id);
        if (fullData) {
          avatar = fullData.avatar || (fullData.images?.[0]) || avatar;
        }
      }

      return {...item, fullData, avatar};
    });
  };

  const handleItemPress = (item: EnrichedSimilarItem) => {
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

  const renderItem = ({item}: {item: EnrichedSimilarItem}) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.8}>
      <Image
        source={{uri: item.avatar || 'https://via.placeholder.com/100'}}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemInfo}>
        <TextBase style={styles.itemName} numberOfLines={2}>
          {item.name}
        </TextBase>
        <View style={styles.scoreContainer}>
          <TextBase style={styles.scoreText}>
            {Math.round(item.similarity_score * 100)}% tương đồng
          </TextBase>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || items.length === 0) {
    return null; // Hide component if no similar items
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <TextBase style={[AppStyle.txt_18_bold, styles.title]}>{title}</TextBase>
      </View>
      <FlatList
        data={items}
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
    marginTop: sizes._16sdp,
    marginBottom: sizes._8sdp,
  },
  title: {
    color: colors.primary_950,
  },
  loadingContainer: {
    paddingVertical: sizes._24sdp,
    alignItems: 'center',
  },
  listContent: {
    paddingRight: sizes._16sdp,
  },
  itemContainer: {
    width: sizes._140sdp,
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
    height: sizes._100sdp,
    backgroundColor: colors.primary_100,
  },
  itemInfo: {
    padding: sizes._8sdp,
  },
  itemName: {
    fontSize: sizes._12sdp,
    fontWeight: '600',
    color: colors.primary_950,
    marginBottom: sizes._4sdp,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: sizes._10sdp,
    color: colors.primary_500,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sizes._12sdp,
  },
  aiBadge: {
    marginLeft: sizes._8sdp,
    paddingHorizontal: sizes._8sdp,
    paddingVertical: sizes._4sdp,
    backgroundColor: colors.primary,
    borderRadius: sizes._12sdp,
  },
  aiBadgeText: {
    fontSize: sizes._10sdp,
    color: colors.white,
    fontWeight: '600',
  },
});

export default SimilarItemsComponent;

