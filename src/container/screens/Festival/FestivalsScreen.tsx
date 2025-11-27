import React from 'react';
import {
  FlatList,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import {IAccount, IItem, ILocation, IReview} from '../../../common/types';
import {IFestival} from '../../../services/festivals.api';
import sizes from '../../../common/sizes';
import BottomSheet from '../../../component/BottomSheet';
import colors from '../../../common/colors';
import TextBase from '../../../common/TextBase';
import {AppStyle} from '../../../common/AppStyle';
import {Searchbar, TextInput} from 'react-native-paper';
import _, {size} from 'lodash';
import {
  LOCATION_NEARLY,
  LOCATION_POPULAR,
} from '../../../common/locationConstants';
import LargeItemLocation from '../../../component/LargeItemLocation';
import BigItemLocation from '../../../component/BigItemLocation';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import HistoricalArtifact from '../../../component/HistoricalArtifact';
import locationApi from '../../../services/locations.api';
import festivalsApi from '../../../services/festivals.api';
import SearchBarComponent from '../../../component/SearchBarComponent';
import LargeItemFestival from '../../../component/LargeItemFestival';

// TRANG FESTIVALS - Tìm kiếm và hiển thị lễ hội
// TRANG FESTIVALS - Tìm kiếm và hiển thị lễ hội
// TRANG FESTIVALS - Tìm kiếm và hiển thị lễ hội

interface IFestivalsScreenProps {
  navigation: any;
}

interface IFestivalsScreenState {
  valueSearch: string;
  items: IItem[];
  ITEMS_POPULAR: IItem[];
  ITEMS_NEARLY: IItem[];
  festivals: IFestival[];
  FESTIVALS_POPULAR: IFestival[];
}

export default class FestivalsScreen extends React.PureComponent<
  IFestivalsScreenProps,
  IFestivalsScreenState
> {
  refSheet: BottomSheet | null | undefined;
  refSheetLocation: BottomSheet | null | undefined;
  searchBarRef: React.RefObject<SearchBarComponent<IFestival>>;

  constructor(props: IFestivalsScreenProps) {
    super(props);
    this.searchBarRef = React.createRef();
    this.state = {
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

    this.fetchItems();
    this.fetchFestivals();
  }

  async fetchItems() {
    const data = await locationApi.getItems();
    if (__DEV__) console.log('📦 Items loaded:', data.length);
    this.setState({
      items: data,
      ITEMS_POPULAR: data.slice(10, 40),
      ITEMS_NEARLY: data.slice(0, 15),
    });
  }

  async fetchFestivals() {
    const data = await festivalsApi.getFestivals();
    if (__DEV__) console.log('🎉 Festivals loaded:', data.length);
    this.setState({
      festivals: data,
      FESTIVALS_POPULAR: data.slice(0, 10),
    });
  }

  renderItemHorizontal = ({item}: {item: IItem}) => {
    return <HistoricalArtifact key={`item-${item.Id}`} item={item} />;
  };

  // Render festival item using LargeItemFestival (matching "Gần tôi" section layout)
  renderFestivalItem = ({item}: {item: IFestival}) => {
    return <LargeItemFestival festival={item} />;
  };

  // Stable keyExtractor function to prevent re-creation
  keyExtractorById = (item: IFestival) => item.Id!.toString();

  handleSearch = (isViewAll: boolean, items: IItem[]) => {
    NavigationService.navigate(ScreenName.VIEW_ALL_ITEM, {
      title: isViewAll ? 'Xem tất cả' : 'Lễ hội',
      items,
      valueSearch: this.state.valueSearch,
    });
  };

  handleFestivalSearch = (filteredData: IFestival[], searchValue: string) => {
    this.setState({valueSearch: searchValue}, () => {
      NavigationService.navigate(ScreenName.VIEW_ALL_FESTIVALS, {
        title: 'Tìm kiếm lễ hội',
        festivals: this.state.festivals,
        valueSearch: searchValue,
      });
    });
  };

  render(): React.ReactNode {
    return (
      <Page style={{backgroundColor: colors.background}}>
        <HeaderBase hideLeftIcon title={strings.festival} />
        <SearchBarComponent<IFestival>
          ref={this.searchBarRef}
          data={this.state.festivals}
          searchFields={['name', 'location', 'description']}
          onSearch={this.handleFestivalSearch}
          placeholder="Tìm kiếm các lễ hội tại Đà Nẵng..."
          containerStyle={{marginTop: sizes._24sdp}}
        />

        <ScrollView>
          <View style={styles.container}>
            {/* FESTIVALS SECTION - Matching "Gần tôi" layout */}
            <View style={[styles.rowCenter]}>
              <TextBase
                style={[AppStyle.txt_20_bold, {marginBottom: sizes._16sdp}]}>
                🎉 Lễ hội
              </TextBase>
              <TouchableOpacity
                onPress={() => {
                  NavigationService.navigate(ScreenName.VIEW_ALL_FESTIVALS, {
                    title: 'Tất cả lễ hội',
                    festivals: this.state.festivals,
                    valueSearch: '',
                  });
                }}>
                <TextBase
                  style={[
                    AppStyle.txt_18_regular,
                    {marginBottom: sizes._16sdp},
                  ]}>
                  Xem tất cả
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

