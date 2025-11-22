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

type SearchFilterType = 'all' | 'name' | 'location' | 'description';

interface IViewAllFestivalsProps {
  navigation: any;
}

interface IViewAllFestivalsState {
  festivals: IFestival[];
  filterModalVisible: boolean;
  selectedFilter: SearchFilterType;
}

export default class ViewAllFestivals extends React.PureComponent<
  IViewAllFestivalsProps,
  IViewAllFestivalsState
> {
  constructor(props: IViewAllFestivalsProps) {
    super(props);
    this.state = {
      festivals: [],
      filterModalVisible: false,
      selectedFilter: 'all',
    };
  }

  componentDidMount(): void {
    this.filterFestivals();
  }

  filterFestivals = () => {
    console.log(this.props.navigation.state.params);
    const festivalsIn: IFestival[] =
      this.props.navigation.state.params?.festivals ?? [];
    const valueSearch: string =
      this.props.navigation.state.params?.valueSearch ?? '';
    let festivalOut: IFestival[] = [];

    festivalsIn.forEach(festival => {
      const normalizedSearch = convertCitationVietnameseUnsigned(valueSearch)?.toLowerCase();

      // Apply filter based on selected filter type
      let matches = false;

      if (this.state.selectedFilter === 'all') {
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
      } else if (this.state.selectedFilter === 'name') {
        matches = convertCitationVietnameseUnsigned(festival.name ?? '')
          ?.toLowerCase()
          ?.includes(normalizedSearch);
      } else if (this.state.selectedFilter === 'location') {
        matches = convertCitationVietnameseUnsigned(festival.location ?? '')
          ?.toLowerCase()
          ?.includes(normalizedSearch);
      } else if (this.state.selectedFilter === 'description') {
        matches = convertCitationVietnameseUnsigned(festival.description ?? '')
          ?.toLowerCase()
          ?.includes(normalizedSearch);
      }

      if (matches) {
        festivalOut = festivalOut.concat(festival);
      }
    });

    this.setState({
      festivals: festivalOut,
    });
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
    switch (filter) {
      case 'all':
        return 'Tất cả';
      case 'name':
        return 'Tên';
      case 'location':
        return 'Địa điểm';
      case 'description':
        return 'Mô tả';
      default:
        return 'Tất cả';
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
    return (
      <Page>
        <HeaderBase
          title={this.props.navigation.state.params?.title ?? 'Lễ hội'}
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
          {/* Filter Button */}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => this.setState({ filterModalVisible: true })}>
            <TextBase style={styles.filterButtonText}>
              🔍 Tìm kiếm theo: {this.getFilterLabel(this.state.selectedFilter)}
            </TextBase>
            <TextBase style={styles.filterButtonIcon}>▼</TextBase>
          </TouchableOpacity>

          <FlatList
            data={this.state.festivals}
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
                  Chọn loại tìm kiếm
                </TextBase>
              </View>
              <View style={styles.filterOptionsContainer}>
                {this.renderFilterOption('all', 'Tất cả')}
                {this.renderFilterOption('name', 'Tên')}
                {this.renderFilterOption('location', 'Địa điểm')}
                {this.renderFilterOption('description', 'Mô tả')}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </Page>
    );
  }
}

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
});

