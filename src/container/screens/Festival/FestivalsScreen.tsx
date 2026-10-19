import FEATURE_FLAGS from '../../../config/featureFlags';
import CatalogStatus from '../../../component/CatalogStatus';
import React from 'react';
import {
  FlatList,
  TouchableOpacity,
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import {IItem} from '../../../common/types';
import {IFestival} from '../../../services/festivals.api';
import sizes from '../../../common/sizes';
import BottomSheet from '../../../component/BottomSheet';
import colors from '../../../common/colors';
import TextBase from '../../../common/TextBase';
import {AppStyle} from '../../../common/AppStyle';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import HistoricalArtifact from '../../../component/HistoricalArtifact';
import festivalsApi from '../../../services/festivals.api';
import locationApi from '../../../services/locations.api';
import SemanticSearchBarComponent from '../../../component/SemanticSearchBarComponent';
import LargeItemFestival from '../../../component/LargeItemFestival';
import {
  withAzureTranslation,
  WithAzureTranslationProps,
} from '../../../hoc/withAzureTranslation';

// TRANG FESTIVALS - Tìm kiếm và hiển thị lễ hội

interface IFestivalsScreenProps extends WithAzureTranslationProps {
  navigation: any;
}

interface IFestivalsScreenState {
  loading: boolean;
  error: boolean;
  valueSearch: string;
  items: IItem[];
  ITEMS_POPULAR: IItem[];
  ITEMS_NEARLY: IItem[];
  festivals: IFestival[];
  FESTIVALS_POPULAR: IFestival[];
}

class FestivalsScreen extends React.PureComponent<
  IFestivalsScreenProps,
  IFestivalsScreenState
> {
  refSheet: BottomSheet | null | undefined;
  refSheetLocation: BottomSheet | null | undefined;
  searchBarRef: React.RefObject<SemanticSearchBarComponent<IFestival>>;

  constructor(props: IFestivalsScreenProps) {
    super(props);
    this.searchBarRef = React.createRef();
    this.state = {
      loading: true,
      error: false,
      valueSearch: '',
      items: [],
      ITEMS_POPULAR: [],
      ITEMS_NEARLY: [],
      festivals: [],
      FESTIVALS_POPULAR: [],
    };
  }

  componentDidMount(): void {
    this.props.navigation.addListener('focus', () => {
      this.setState({
        valueSearch: '',
      });
      // Reset search bar when screen is focused
      this.searchBarRef.current?.resetSearch();
    });

    if (FEATURE_FLAGS.ENABLE_ITEMS) {this.fetchItems();}
    this.fetchFestivals();
  }

  async fetchItems() {
    const data = await locationApi.getItems();
    if (__DEV__) {
      console.log('📦 Items loaded:', data.length);
    }
    this.setState({
      items: data,
      ITEMS_POPULAR: data.slice(10, 40),
      ITEMS_NEARLY: data.slice(0, 15),
    });
  }

  async fetchFestivals() {
    this.setState({loading: true, error: false});
    try {
      const data = await festivalsApi.getFestivals();
      this.setState({festivals: data, FESTIVALS_POPULAR: data.slice(0, 20)});
    } catch {
      this.setState({error: true});
    } finally {
      this.setState({loading: false});
    }
  }

  /* P1: Items renderer retained while Items is temporarily disabled.
  renderItemHorizontal = ({item}: {item: IItem}) => {
    return <HistoricalArtifact key={`item-${item.Id}`} item={item} />;
  };
  */

  renderFestivalItem = ({item}: {item: IFestival}) => {
    return <LargeItemFestival festival={item} />;
  };

  // Stable keyExtractor function to prevent re-creation
  keyExtractorById = (item: IFestival) => item.Id!.toString();

  handleSearch = (isViewAll: boolean, items: IItem[]) => {
    NavigationService.navigate(ScreenName.VIEW_ALL_ITEM, {
      title: isViewAll ? this.props.t('home.viewAll') : this.props.t('festivals.title'),
      items,
      valueSearch: this.state.valueSearch,
    });
  };

  // Called while typing - just update local state, don't navigate
  handleFestivalSearch = (
    filteredData: IFestival[],
    searchValue: string,
    isSemanticSearch?: boolean,
  ) => {
    this.setState({valueSearch: searchValue});
  };

  // Called when user explicitly submits search (Enter key or search button)
  handleFestivalSearchSubmit = (
    filteredData: IFestival[],
    searchValue: string,
    isSemanticSearch?: boolean,
  ) => {
    console.log('📥 [FestivalsScreen] handleFestivalSearchSubmit received:');
    console.log('  📋 filteredData.length:', filteredData?.length || 0);
    console.log('  📋 searchValue:', searchValue);
    console.log('  📋 isSemanticSearch:', isSemanticSearch);

    if (!searchValue || searchValue.trim().length === 0) {
      console.log('  ⚠️ Empty search, not navigating');
      return; // Don't navigate if search is empty
    }
    this.setState({valueSearch: searchValue}, () => {
      // ALWAYS use filteredData from the search component - it contains the semantic results
      const festivalsToShow = filteredData;
      console.log('  ➡️ Navigating with', festivalsToShow.length, 'festivals');
      NavigationService.navigate(ScreenName.VIEW_ALL_FESTIVALS, {
        title: isSemanticSearch ? `🧠 ${this.props.t('home.aiSearchResults')}` : this.props.t('home.search'),
        festivals: festivalsToShow,
        valueSearch: searchValue,
        isSemanticSearch: isSemanticSearch,
      });
    });
  };

  render(): React.ReactNode {
    const {t} = this.props;
    return (
      <Page style={{backgroundColor: colors.background}}>
        <HeaderBase hideLeftIcon title={t('festivals.title')} />
        <SemanticSearchBarComponent<IFestival>
          ref={this.searchBarRef}
          data={this.state.festivals}
          searchFields={['name', 'location', 'description']}
          onSearch={this.handleFestivalSearch}
          onSubmitSearch={this.handleFestivalSearchSubmit}
          placeholder={t('festivals.searchPlaceholder')}
          containerStyle={{marginTop: sizes._24sdp}}
          entityType="festival"
          idField="Id"
        />

        <CatalogStatus loading={this.state.loading} error={this.state.error}
          onRetry={() => this.fetchFestivals()} />
        <ScrollView>
          <View style={styles.container}>
            {/* FESTIVALS SECTION - Matching "Gần tôi" layout */}
            <View style={[styles.rowCenter]}>
              <TextBase
                style={[AppStyle.txt_20_bold, {marginBottom: sizes._16sdp}]}>
                🎉 {t('festivals.title')}
              </TextBase>
              <TouchableOpacity
                onPress={() => {
                  NavigationService.navigate(ScreenName.VIEW_ALL_FESTIVALS, {
                    title: t('festivals.allFestivals'),
                    festivals: this.state.festivals,
                    valueSearch: '',
                  });
                }}>
                <TextBase
                  style={[
                    AppStyle.txt_18_regular,
                    {marginBottom: sizes._16sdp},
                  ]}>
                  {t('home.viewAll')}
                </TextBase>
              </TouchableOpacity>
            </View>

            {/* Vertical FlatList matching "Gần tôi" section design */}
            <FlatList
              data={this.state.festivals}
              renderItem={this.renderFestivalItem}
              keyExtractor={this.keyExtractorById}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              removeClippedSubviews={true}
            />
          </View>
        </ScrollView>
      </Page>
    );
  }
}

export default withAzureTranslation(FestivalsScreen);

const styles = StyleSheet.create({
  container: {
    padding: sizes._16sdp,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
