import React from 'react';
import {FlatList, TouchableOpacity, View, Image, ScrollView, StyleSheet} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import {IAccount, ILocation, IReview} from '../../../common/types';
import sizes from '../../../common/sizes';
import BottomSheet from '../../../component/BottomSheet';
import colors from '../../../common/colors';
import TextBase from '../../../common/TextBase';
import {AppStyle} from '../../../common/AppStyle';
import {Searchbar, TextInput} from 'react-native-paper';
import _, { size } from 'lodash';
import {
  LOCATION_NEARLY,
  LOCATION_POPULAR,
} from '../../../common/locationConstants';
import LargeItemLocation from '../../../component/LargeItemLocation';
import BigItemLocation from '../../../component/BigItemLocation';
import NavigationService from '../NavigationService';
import { ScreenName } from '../../AppContainer';
import HistoricalArtifact from '../../../component/HistoricalArtifact';



// DAY LA TRANG HIEN VAT, TRANG NEWFEED GOC DOI TEN THANH NewFeedGoc.tsx




interface INewFeedScreenProps {
  navigation: any;
}

interface INewFeedScreenState {
  valueSearch: string;
  locations: ILocation[];
  LOCATION_POPULAR: ILocation[];
  LOCATION_NEARLY: ILocation[];
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
      locations: [],
      LOCATION_POPULAR: [],
      LOCATION_NEARLY: [],
    };
  }

  componentDidMount(): void {
    this.props.navigation.addListener('focus', () => {
      this.setState({
        valueSearch: '',      
        LOCATION_POPULAR,
        LOCATION_NEARLY,
      });
    });
  }

  renderItemHorizontal = ({ item, index }: { item: ILocation, index: number }) => {
    return <HistoricalArtifact location={item} />
  }
  renderItemLarge = ({ item, index }: { item: ILocation, index: number }) => {
    return <HistoricalArtifact location={item} />
  }

  handleSearch = (isViewAll: boolean, locations: ILocation[]) => {
    NavigationService.navigate(ScreenName.VIEW_ALL_SCREEN, { title: isViewAll ? 'Xem tất cả' : 'Tìm kiếm', locations: locations, valueSearch: this.state.valueSearch });
  }

  

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
                this.state.locations,
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
                  this.handleSearch(true, this.state.LOCATION_POPULAR)
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
              data={this.state.LOCATION_POPULAR}
              renderItem={this.renderItemHorizontal}
              keyExtractor={item => item.id.toString()}
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
                  this.handleSearch(true, this.state.LOCATION_NEARLY)
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
              data={this.state.LOCATION_NEARLY}
              renderItem={this.renderItemHorizontal}
              keyExtractor={item => item.id.toString()}
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