import React from 'react';
import { FlatList, View, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import { BackSvg } from '../../../assets/assets/ImageSvg';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import { ILocation } from '../../../common/types';
import LargeItemLocation from '../../../component/LargeItemLocation';
import NavigationService from '../NavigationService';
import { convertCitationVietnameseUnsigned } from '../../../utils/Utils';
import TextBase from '../../../common/TextBase';
import { AppStyle } from '../../../common/AppStyle';

type SearchFilterType = 'all' | 'name' | 'address' | 'description';

interface IViewAllLocationProps {
  navigation: any;
}

interface IViewAllLocationState {
  locations: ILocation[];
  filterModalVisible: boolean;
  selectedFilter: SearchFilterType;
}

export default class ViewAllLocation extends React.PureComponent<
  IViewAllLocationProps,
  IViewAllLocationState
> {
  constructor(props: IViewAllLocationProps) {
    super(props);
    this.state = {
      locations: [],
      filterModalVisible: false,
      selectedFilter: 'all',
    };
  }

  componentDidMount(): void {
    this.filterLocations();
  }

  filterLocations = () => {
    console.log(this.props.navigation.state.params);
    const locationsIn: ILocation[] = this.props.navigation.state.params?.locations ?? [];
    const valueSearch: string = this.props.navigation.state.params?.valueSearch;
    let locationOut: ILocation[] = [];

    locationsIn.forEach(location => {
      const normalizedSearch = convertCitationVietnameseUnsigned(valueSearch)?.toLowerCase();

      // Apply filter based on selected filter type
      let matches = false;

      if (this.state.selectedFilter === 'all') {
        // Search by name, address, and description
        const nameMatch = convertCitationVietnameseUnsigned(location.name ?? '')
          ?.toLowerCase()
          ?.includes(normalizedSearch);

        const addressMatch = convertCitationVietnameseUnsigned(location.address ?? '')
          ?.toLowerCase()
          ?.includes(normalizedSearch);

        const descriptionMatch = convertCitationVietnameseUnsigned(location.description ?? '')
          ?.toLowerCase()
          ?.includes(normalizedSearch);

        matches = nameMatch || addressMatch || descriptionMatch;
      } else if (this.state.selectedFilter === 'name') {
        matches = convertCitationVietnameseUnsigned(location.name ?? '')
          ?.toLowerCase()
          ?.includes(normalizedSearch);
      } else if (this.state.selectedFilter === 'address') {
        matches = convertCitationVietnameseUnsigned(location.address ?? '')
          ?.toLowerCase()
          ?.includes(normalizedSearch);
      } else if (this.state.selectedFilter === 'description') {
        matches = convertCitationVietnameseUnsigned(location.description ?? '')
          ?.toLowerCase()
          ?.includes(normalizedSearch);
      }

      if (matches) {
        locationOut = locationOut.concat(location);
      }
    });

    this.setState({
      locations: locationOut
    });
  };

  renderItem = ({ item, index }: { item: ILocation, index: number }) => {
    return <LargeItemLocation location={item} />
  };

  handleFilterSelect = (filter: SearchFilterType) => {
    this.setState({ selectedFilter: filter, filterModalVisible: false }, () => {
      this.filterLocations();
    });
  };

  getFilterLabel = (filter: SearchFilterType): string => {
    switch (filter) {
      case 'all':
        return 'Tất cả';
      case 'name':
        return 'Tên';
      case 'address':
        return 'Địa chỉ';
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
          title={this.props.navigation.state.params?.title ?? ''}
          leftIconSvg={
            <BackSvg
              width={sizes._24sdp}
              height={sizes._24sdp}
              color={colors.primary_950}
            />
          }
          onLeftIconPress={() => {
            NavigationService.pop()
          }}
        />
        <View style={{ padding: sizes._16sdp, flex: 1 }}>
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
            data={this.state.locations}
            renderItem={this.renderItem}
            keyExtractor={(item) => item.name.toString()}
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
                {this.renderFilterOption('address', 'Địa chỉ')}
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
