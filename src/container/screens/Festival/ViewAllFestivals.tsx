import React from 'react';
import {FlatList, View, TouchableOpacity, Modal, StyleSheet} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import {BackSvg} from '../../../assets/assets/ImageSvg';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import {IFestival} from '../../../services/festivals.api';
import LargeItemFestival from '../../../component/LargeItemFestival';
import NavigationService from '../NavigationService';
import {convertCitationVietnameseUnsigned} from '../../../utils/Utils';
import TextBase from '../../../common/TextBase';
import {AppStyle} from '../../../common/AppStyle';
import {
  withAzureTranslation,
  WithAzureTranslationProps,
} from '../../../hoc/withAzureTranslation';

type SearchFilterType = 'all' | 'name' | 'location' | 'description';
type SearchModeType = 'semantic' | 'keyword';

interface IViewAllFestivalsProps extends WithAzureTranslationProps {
  navigation: any;
  route: any; // React Navigation v5+ route prop
}

interface IViewAllFestivalsState {
  festivals: IFestival[];
  allFestivals: IFestival[]; // Store original festivals for mode switching
  filterModalVisible: boolean;
  selectedFilter: SearchFilterType;
  searchMode: SearchModeType; // Toggle between AI and keyword search
}

// Helper to get params from route (v5+)
const getParams = (props: IViewAllFestivalsProps) => {
  return props.route?.params || {};
};

class ViewAllFestivals extends React.PureComponent<
  IViewAllFestivalsProps,
  IViewAllFestivalsState
> {
  constructor(props: IViewAllFestivalsProps) {
    super(props);
    // Get initial search mode from navigation params
    const params = getParams(props);
    const isSemanticSearch = params.isSemanticSearch ?? true;
    this.state = {
      festivals: [],
      allFestivals: [],
      filterModalVisible: false,
      selectedFilter: 'all',
      searchMode: isSemanticSearch ? 'semantic' : 'keyword',
    };
  }

  componentDidMount(): void {
    this.initializeFestivals();
  }

  initializeFestivals = () => {
    const params = getParams(this.props);
    const festivalsIn: IFestival[] = params.festivals ?? [];
    // Store all festivals for mode switching
    this.setState({ allFestivals: festivalsIn }, () => {
      this.filterFestivals();
    });
  };

  filterFestivals = () => {
    const {allFestivals, searchMode, selectedFilter} = this.state;
    const params = getParams(this.props);
    const valueSearch: string = params.valueSearch ?? '';

    if (__DEV__) {console.log('📋 Filtering with mode:', searchMode, 'filter:', selectedFilter);}

    // If semantic search mode, use pre-filtered results directly (already sorted by AI relevance)
    if (searchMode === 'semantic') {
      if (__DEV__) {console.log('🧠 Semantic search results - using pre-filtered data:', allFestivals.length, 'items');}
      this.setState({ festivals: allFestivals });
      return;
    }

    // For keyword search, apply additional filtering
    let festivalOut: IFestival[] = [];

    allFestivals.forEach(festival => {
      const normalizedSearch = convertCitationVietnameseUnsigned(valueSearch)?.toLowerCase();

      // Apply filter based on selected filter type
      let matches = false;

      if (selectedFilter === 'all') {
        // Search by name, description, and location
        const nameMatch = convertCitationVietnameseUnsigned(festival.name ?? '')
          ?.toLowerCase()
          ?.includes(normalizedSearch);

        const descriptionMatch = convertCitationVietnameseUnsigned(
          festival.description ?? '',
        )
          ?.toLowerCase()
          ?.includes(normalizedSearch);

        const locationMatch = convertCitationVietnameseUnsigned(
          festival.location ?? '',
        )
          ?.toLowerCase()
          ?.includes(normalizedSearch);

        matches = nameMatch || descriptionMatch || locationMatch;
      } else if (selectedFilter === 'name') {
        matches = convertCitationVietnameseUnsigned(festival.name ?? '')
          ?.toLowerCase()
          ?.includes(normalizedSearch);
      } else if (selectedFilter === 'location') {
        matches = convertCitationVietnameseUnsigned(festival.location ?? '')
          ?.toLowerCase()
          ?.includes(normalizedSearch);
      } else if (selectedFilter === 'description') {
        matches = convertCitationVietnameseUnsigned(festival.description ?? '')
          ?.toLowerCase()
          ?.includes(normalizedSearch);
      }

      if (matches) {
        festivalOut = festivalOut.concat(festival);
      }
    });

    if (__DEV__) {console.log('🔤 Keyword search results:', festivalOut.length, 'items');}
    this.setState({ festivals: festivalOut });
  };

  toggleSearchMode = () => {
    this.setState(
      prevState => ({
        searchMode: prevState.searchMode === 'semantic' ? 'keyword' : 'semantic',
      }),
      () => {
        this.filterFestivals();
      }
    );
  };

  renderItem = ({item, index}: {item: IFestival; index: number}) => {
    return <LargeItemFestival festival={item} />;
  };

  handleFilterSelect = (filter: SearchFilterType) => {
    this.setState({ selectedFilter: filter, filterModalVisible: false }, () => {
      this.filterFestivals();
    });
  };

  getFilterLabel = (filter: SearchFilterType): string => {
    const {t} = this.props;
    switch (filter) {
      case 'all':
        return t('search.filterAll');
      case 'name':
        return t('search.filterName');
      case 'location':
        return t('search.filterLocation');
      case 'description':
        return t('search.filterDescription');
      default:
        return t('search.filterAll');
    }
  };

  renderFilterOption = (filter: SearchFilterType, label: string) => {
    const isSelected = this.state.selectedFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterOption,
          isSelected ? styles.filterOptionSelected : {},
        ]}
        onPress={() => this.handleFilterSelect(filter)}>
        <TextBase style={[
          styles.filterOptionText,
          isSelected ? styles.filterOptionTextSelected : {},
        ]}>
          {label}
        </TextBase>
        {isSelected && (
          <TextBase style={styles.checkmark}>✓</TextBase>
        )}
      </TouchableOpacity>
    );
  };

  render(): React.ReactNode {
    const {searchMode, festivals} = this.state;
    const {t} = this.props;
    const params = getParams(this.props);
    const isSemanticMode = searchMode === 'semantic';

    return (
      <Page>
        <HeaderBase
          title={params.title ?? t('festivals.title')}
          leftIconSvg={
            <BackSvg
              width={sizes._24sdp}
              height={sizes._24sdp}
              color={colors.primary_950}
            />
          }
          onLeftIconPress={() => {
            NavigationService.pop();
          }}
        />
        <View style={{padding: sizes._16sdp, flex: 1}}>
          {/* Search Mode Toggle */}
          <View style={styles.searchModeContainer}>
            <TouchableOpacity
              style={[styles.searchModeButton, isSemanticMode && styles.searchModeButtonActive]}
              onPress={() => isSemanticMode || this.toggleSearchMode()}>
              <TextBase style={[styles.searchModeButtonText, isSemanticMode && styles.searchModeButtonTextActive]}>
                🧠 AI Search
              </TextBase>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.searchModeButton, !isSemanticMode && styles.searchModeButtonActive]}
              onPress={() => !isSemanticMode || this.toggleSearchMode()}>
              <TextBase style={[styles.searchModeButtonText, !isSemanticMode && styles.searchModeButtonTextActive]}>
                🔤 Keyword
              </TextBase>
            </TouchableOpacity>
          </View>

          {/* Filter Button - only show for keyword search */}
          {!isSemanticMode && (
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => this.setState({ filterModalVisible: true })}>
              <TextBase style={styles.filterButtonText}>
                🔍 {t('home.search')}: {this.getFilterLabel(this.state.selectedFilter)}
              </TextBase>
              <TextBase style={styles.filterButtonIcon}>▼</TextBase>
            </TouchableOpacity>
          )}

          {/* Results count */}
          <TextBase style={styles.resultsCount}>
            {festivals.length} {t('search.results')} {isSemanticMode ? `(${t('search.sortedByRelevance')})` : ''}
          </TextBase>

          <FlatList
            data={festivals}
            renderItem={this.renderItem}
            keyExtractor={item => item.Id?.toString() ?? Math.random().toString()}
          />
        </View>

        {/* Filter Modal */}
        <Modal
          visible={this.state.filterModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => this.setState({ filterModalVisible: false })}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => this.setState({ filterModalVisible: false })}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TextBase style={styles.modalTitle}>
                  {t('search.filterAll')}
                </TextBase>
              </View>
              <View style={styles.filterOptionsContainer}>
                {this.renderFilterOption('all', t('search.filterAll'))}
                {this.renderFilterOption('name', t('search.filterName'))}
                {this.renderFilterOption('location', t('search.filterLocation'))}
                {this.renderFilterOption('description', t('search.filterDescription'))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </Page>
    );
  }
}

export default withAzureTranslation(ViewAllFestivals);

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary_200,
    paddingHorizontal: sizes._16sdp,
    paddingVertical: sizes._12sdp,
    borderRadius: sizes._8sdp,
    marginBottom: sizes._12sdp,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterButtonText: {
    fontSize: sizes._14sdp,
    fontFamily: 'GoogleSans_Medium',
    color: colors.primary_950,
    flex: 1,
  },
  filterButtonIcon: {
    fontSize: sizes._12sdp,
    color: colors.primary_600,
    marginLeft: sizes._8sdp,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: sizes._12sdp,
    width: '80%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    backgroundColor: colors.primary,
    paddingVertical: sizes._16sdp,
    paddingHorizontal: sizes._20sdp,
    borderTopLeftRadius: sizes._12sdp,
    borderTopRightRadius: sizes._12sdp,
  },
  modalTitle: {
    fontSize: sizes._18sdp,
    fontFamily: 'GoogleSans_Bold',
    color: colors.primary_950,
    textAlign: 'center',
  },
  filterOptionsContainer: {
    paddingVertical: sizes._8sdp,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes._20sdp,
    paddingVertical: sizes._14sdp,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary_100,
  },
  filterOptionSelected: {
    backgroundColor: colors.primary_100,
  },
  filterOptionText: {
    fontSize: sizes._16sdp,
    fontFamily: 'GoogleSans_Regular',
    color: colors.primary_950,
  },
  filterOptionTextSelected: {
    fontFamily: 'GoogleSans_Bold',
    color: colors.primary_600,
  },
  checkmark: {
    fontSize: sizes._18sdp,
    color: colors.primary_600,
    fontFamily: 'GoogleSans_Bold',
  },
  searchModeContainer: {
    flexDirection: 'row',
    marginBottom: sizes._12sdp,
    backgroundColor: colors.primary_100,
    borderRadius: sizes._8sdp,
    padding: sizes._4sdp,
  },
  searchModeButton: {
    flex: 1,
    paddingVertical: sizes._10sdp,
    paddingHorizontal: sizes._12sdp,
    borderRadius: sizes._6sdp,
    alignItems: 'center',
  },
  searchModeButtonActive: {
    backgroundColor: colors.primary,
  },
  searchModeButtonText: {
    fontSize: sizes._14sdp,
    fontFamily: 'GoogleSans_Medium',
    color: colors.primary_600,
  },
  searchModeButtonTextActive: {
    color: colors.white,
    fontFamily: 'GoogleSans_Bold',
  },
  resultsCount: {
    fontSize: sizes._12sdp,
    color: colors.primary_500,
    marginBottom: sizes._8sdp,
    fontFamily: 'GoogleSans_Regular',
  },
});

