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
  constructor(props: IFestivalsScreenProps) {
    super(props);
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
    });

    this.fetchItems();
    this.fetchFestivals();
  }

  async fetchItems() {
    const data = await locationApi.getItems();
    console.log('📦 Items loaded:', data.length);
    this.setState({
      items: data,
      ITEMS_POPULAR: data.slice(10, 40),
      ITEMS_NEARLY: data.slice(0, 15),
    });
  }

  async fetchFestivals() {
    const data = await festivalsApi.getFestivals();
    console.log('🎉 Festivals loaded:', data.length);
    this.setState({
      festivals: data,
      FESTIVALS_POPULAR: data.slice(0, 10),
    });
  }

  renderItemHorizontal = ({item}: {item: IItem}) => {
    return <HistoricalArtifact key={`item-${item.Id}`} item={item} />;
  };

  renderFestivalHorizontal = ({item}: {item: IFestival}) => {
    // Calculate rating from reviews instead of using static rating field
    const avgRating = festivalsApi.calculateAverageRating(item.reviews);

    return (
      <TouchableOpacity
        key={`festival-${item.Id}`}
        style={styles.festivalCard}
        onPress={() => {
          NavigationService.navigate(ScreenName.DETAIL_FESTIVAL_SCREEN, {
            festival: item,
          });
        }}>
        <View style={styles.festivalInfo}>
          <TextBase numberOfLines={2} style={[AppStyle.txt_18_bold]}>
            {item.name}
          </TextBase>
          <TextBase
            numberOfLines={1}
            style={[AppStyle.txt_14_regular, {marginTop: sizes._4sdp}]}>
            ⏰ {item.event_time}
          </TextBase>
          <TextBase
            numberOfLines={1}
            style={[AppStyle.txt_14_regular, {marginTop: sizes._4sdp}]}>
            📍 {item.location}
          </TextBase>
          <View style={{flexDirection: 'row', marginTop: sizes._8sdp}}>
            <TextBase style={[AppStyle.txt_14_bold]}>
              ⭐ {avgRating.toFixed(1)}
            </TextBase>
            <TextBase
              style={[
                AppStyle.txt_14_regular,
                {marginLeft: sizes._12sdp, color: colors.primary_600},
              ]}>
              {item.price_level === 0
                ? '🆓 Miễn phí'
                : item.price_level === 1
                ? '💰 Có phí'
                : '💰💰 Cao cấp'}
            </TextBase>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  handleSearch = (isViewAll: boolean, items: IItem[]) => {
    NavigationService.navigate(ScreenName.VIEW_ALL_ITEM, {
      title: isViewAll ? 'Xem tất cả' : 'Lễ hội',
      items,
      valueSearch: this.state.valueSearch,
    });
  };

  render(): React.ReactNode {
    return (
      <Page style={{backgroundColor: colors.background}}>
        <HeaderBase hideLeftIcon title={strings.festival} />
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginVertical: sizes._16sdp,
            marginHorizontal: sizes._16sdp,
            marginTop: sizes._24sdp,
            backgroundColor: '#fff',
            borderRadius: 30,
            elevation: 7,
          }}>
          <Searchbar
            value={this.state.valueSearch}
            onChangeText={txt => {
              this.setState({valueSearch: txt});
            }}
            placeholder="Tìm kiếm các lễ hội tại Đà Nẵng..."
            style={{
              backgroundColor: colors.primary_200,
              color: colors.black,
              flex: 1,
            }}
            inputStyle={{
              color: colors.black,
              fontFamily: 'GoogleSans_Regular',
            }}
            onIconPress={() =>
              this.handleSearch(
                false,
                this.state.items,
              )
            }
          />
        </View>

        <ScrollView>
          <View style={styles.container}>
            {/* FESTIVALS SECTION */}
            <View style={styles.rowCenter}>
              <TextBase style={[AppStyle.txt_20_bold]}>🎉 Lễ hội</TextBase>
              <TouchableOpacity
                onPress={() => {
                  NavigationService.navigate(ScreenName.VIEW_ALL_FESTIVALS, {
                    title: 'Tất cả lễ hội',
                    festivals: this.state.festivals,
                    valueSearch: '',
                  });
                }}>
                <TextBase style={[AppStyle.txt_18_regular]}>
                  Xem tất cả
                </TextBase>
              </TouchableOpacity>
            </View>

            <FlatList
              contentContainerStyle={{
                paddingVertical: sizes._16sdp,
              }}
              data={this.state.FESTIVALS_POPULAR}
              renderItem={this.renderFestivalHorizontal}
              keyExtractor={item => item.Id!.toString()}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
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
  festivalCard: {
    width: 280,
    marginRight: sizes._12sdp,
    borderRadius: sizes._12sdp,
    backgroundColor: colors.white,
    padding: sizes._16sdp,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  festivalInfo: {
    flex: 1,
  },
});

