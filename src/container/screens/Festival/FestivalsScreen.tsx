import CatalogStatus from '../../../component/CatalogStatus';
import React from 'react';
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import {IFestival} from '../../../services/festivals.api';
import sizes from '../../../common/sizes';
import BottomSheet from '../../../component/BottomSheet';
import colors from '../../../common/colors';
import TextBase from '../../../common/TextBase';
import {AppStyle} from '../../../common/AppStyle';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import catalogRepository from '../../../services/catalogRepository';
import SemanticSearchBarComponent from '../../../component/SemanticSearchBarComponent';
import LargeItemFestival from '../../../component/LargeItemFestival';
import {FESTIVAL_SEARCH_FIELDS} from '../../../utils/catalogSearch';
import {
  withTranslation,
  WithTranslationProps,
} from '../../../hoc/withTranslation';

// TRANG FESTIVALS - Tìm kiếm và hiển thị lễ hội

interface IFestivalsScreenProps extends WithTranslationProps {
  navigation: any;
}

interface IFestivalsScreenState {
  loading: boolean;
  refreshing: boolean;
  error: boolean;
  valueSearch: string;
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
      refreshing: false,
      error: false,
      valueSearch: '',
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

    this.fetchFestivals();
  }

  async fetchFestivals(forceRefresh = false, pullToRefresh = false) {
    this.setState({loading: !pullToRefresh, refreshing: pullToRefresh, error: false});
    try {
      const {festivals: data} = await catalogRepository.get(forceRefresh);
      this.setState({festivals: data, FESTIVALS_POPULAR: data.slice(0, 20)});
    } catch {
      // A failed refresh keeps the list already shown; CatalogStatus offers Retry.
      this.setState({error: true});
    } finally {
      this.setState({loading: false, refreshing: false});
    }
  }

  renderFestivalItem = ({item}: {item: IFestival}) => {
    return <LargeItemFestival festival={item} />;
  };

  // Stable keyExtractor function to prevent re-creation
  keyExtractorById = (item: IFestival) => item.id.toString();

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
          searchFields={[...FESTIVAL_SEARCH_FIELDS]}
          onSearch={this.handleFestivalSearch}
          onSubmitSearch={this.handleFestivalSearchSubmit}
          placeholder={t('festivals.searchPlaceholder')}
          containerStyle={{marginTop: sizes._24sdp}}
          entityType="festival"
          idField="id"
        />

        <CatalogStatus loading={this.state.loading} error={this.state.error}
          onRetry={() => this.fetchFestivals(true)} />
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={this.state.refreshing} onRefresh={() => this.fetchFestivals(true, true)} />
          }>
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

export default withTranslation(FestivalsScreen);

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
