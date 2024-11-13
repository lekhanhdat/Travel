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

// DAY LA TRANG HIEN VAT, TRANG NEWFEED GOC DOI TEN THANH NewFeedGoc.tsx

interface INewFeedScreenProps {
  navigation: any;
}

interface INewFeedScreenState {
  valueSearch: string;
  items: IItem[];
  ITEMS_POPULAR: IItem[];
  ITEMS_NEARLY: IItem[];
}

export default class NewFeedScreen extends React.PureComponent<
  INewFeedScreenProps,
  INewFeedScreenState
> {
  refSheet: BottomSheet | null | undefined;
  refSheetLocation: BottomSheet | null | undefined;
  constructor(props: INewFeedScreenProps) {
    super(props);
    this.state = {
      valueSearch: '',
      items: [],
      ITEMS_POPULAR: [],
      ITEMS_NEARLY: [],
    };
  }

  componentDidMount(): void {
    this.props.navigation.addListener('focus', () => {
      this.setState({
        valueSearch: '',
        // ITEMS_POPULAR: LOCATION_POPULAR,
        // ITEMS_NEARLY: LOCATION_NEARLY,
      });
    });

    this.fetchItems();
  }

  async fetchItems() {
    const data = await locationApi.getItems();
    console.log(JSON.stringify(data, null, 2));
    this.setState({
      items: data,
      ITEMS_POPULAR: data.slice(0, 5),
      ITEMS_NEARLY: data.slice(0, 5),
    });
  }

  renderItemHorizontal = ({item, index}: {item: IItem; index: number}) => {
    return <HistoricalArtifact key={`item-${item}`} item={item} />;
  };
  renderItemLarge = ({item, index}: {item: ILocation; index: number}) => {
    return <HistoricalArtifact key={`item-${index}`} item={item} />;
  };

  handleSearch = (isViewAll: boolean, items: IItem[]) => {
    NavigationService.navigate(ScreenName.VIEW_ALL_ITEM, {
      title: isViewAll ? 'Xem tất cả' : 'Tìm kiếm',
      items,
      valueSearch: this.state.valueSearch,
    });
  };

  render(): React.ReactNode {
    return (
      <Page style={{backgroundColor: colors.background}}>
        <HeaderBase hideLeftIcon title={strings.new_feed} />
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
            placeholder="Tìm kiếm địa điểm, địa chỉ,..."
            style={{
              // backgroundColor: '#CEE8E7',
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
                // _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY, 'id'),
              )
            }
          />
        </View>

        <ScrollView>
          <View style={styles.container}>
            <View style={styles.rowCenter}>
              <TextBase style={[AppStyle.txt_20_bold]}>Phổ biến</TextBase>
              <TouchableOpacity
                onPress={() =>
                  this.handleSearch(true, this.state.ITEMS_POPULAR)
                }>
                <TextBase style={[AppStyle.txt_18_regular]}>
                  Xem tất cả
                </TextBase>
              </TouchableOpacity>
            </View>

            <FlatList
              contentContainerStyle={{
                paddingVertical: sizes._16sdp,
              }}
              data={this.state.ITEMS_POPULAR}
              renderItem={this.renderItemHorizontal}
              keyExtractor={item => item.Id.toString()}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            />

            <View style={[styles.rowCenter, {marginTop: sizes._16sdp}]}>
              <TextBase
                style={[AppStyle.txt_20_bold, {marginBottom: sizes._16sdp}]}>
                Gần đây
              </TextBase>
              <TouchableOpacity
                onPress={() =>
                  this.handleSearch(true, this.state.ITEMS_NEARLY)
                }>
                <TextBase
                  style={[
                    AppStyle.txt_18_regular,
                    {marginBottom: sizes._16sdp},
                  ]}>
                  Xem tất cả
                </TextBase>
              </TouchableOpacity>
            </View>

            <FlatList
              data={this.state.ITEMS_NEARLY}
              renderItem={this.renderItemHorizontal}
              keyExtractor={item => item.Id.toString()}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            />
            {/*
            <FlatList
              data={this.state.LOCATION_NEARLY}
              renderItem={this.renderItemLarge}
              keyExtractor={item => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
            /> */}
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
