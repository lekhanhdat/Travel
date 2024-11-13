import React from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import {Button, Card, Searchbar, TextInput} from 'react-native-paper';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import TextBase from '../../../common/TextBase';
import {AppStyle} from '../../../common/AppStyle';
import {ILocation} from '../../../common/types';
import BigItemLocation from '../../../component/BigItemLocation';
import {
  LOCATION_NEARLY,
  LOCATION_POPULAR,
} from '../../../common/locationConstants';
import LargeItemLocation from '../../../component/LargeItemLocation';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import _, {size} from 'lodash';
import images from '../../../res/images';
import {Text} from 'react-native-paper';
import {Image} from 'react-native-svg';
import locationApi from '../../../services/locations.api';
import fonts from '../../../common/fonts';

interface IHomeScreenProps {
  navigation: any;
}

interface IHomeScreenState {
  valueSearch: string;
  locations: ILocation[];
  locationsPopular: ILocation[];
  locationsNearly: ILocation[];
}

export default class HomeScreen extends React.PureComponent<
  IHomeScreenProps,
  IHomeScreenState
> {
  refInput: any;
  constructor(props: IHomeScreenProps) {
    super(props);
    this.state = {
      valueSearch: '',
      locations: [],
      locationsNearly: [],
      locationsPopular: [],
    };
  }

  componentDidMount(): void {
    this.props.navigation.addListener('focus', () => {
      this.setState({
        valueSearch: '',
      });
    });

    this.fetchLocations();
  }

  async fetchLocations() {
    const data = await locationApi.getLocations();
    this.setState({
      locations: data,
      locationsNearly: data.slice(10, 20),
      locationsPopular: data.slice(0, 10),
    });
  }

  renderItemHorizontal = ({item, index}: {item: ILocation; index: number}) => {
    return <BigItemLocation location={item} />;
  };

  renderItemLarge = ({item, index}: {item: ILocation; index: number}) => {
    return <LargeItemLocation location={item} />;
  };

  handleSearch = (isViewAll: boolean, locations: ILocation[]) => {
    NavigationService.navigate(ScreenName.VIEW_ALL_SCREEN, {
      title: isViewAll ? 'Xem tất cả' : 'Tìm kiếm',
      locations: locations,
      valueSearch: this.state.valueSearch,
    });
  };

  render(): React.ReactNode {
    return (
      <Page style={{backgroundColor: colors.background}}>
        {/* <HeaderBase hideLeftIcon title={strings.home_page} /> */}

        <TextBase
          style={[
            AppStyle.txt_18_bold,
            {
              marginTop: sizes._36sdp,
              marginLeft: sizes._16sdp,
              color: colors.black,
            },
          ]}>
          Xin chào,
        </TextBase>
        <TextBase
          style={[
            AppStyle.txt_20_bold,
            {
              marginTop: sizes._6sdp,
              marginLeft: sizes._16sdp,
              color: colors.black,
            },
          ]}>
          Chúc bạn có những trải nghiệm tuyệt vời
        </TextBase>
        <TextBase
          style={[
            AppStyle.txt_20_bold,
            {
              marginLeft: sizes._16sdp,
              marginBottom: sizes._8sdp,
              color: colors.black,
            },
          ]}>
          tại Đà Nẵng!
        </TextBase>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginVertical: sizes._16sdp,
            marginHorizontal: sizes._16sdp,
            backgroundColor: '#fff', // Nền trắng để đổ bóng hiển thị tốt hơn
            borderRadius: 30, // Bo tròn các góc
            // Đổ bóng trên Android
            elevation: 7,
            // width: sizes.width - sizes._32sdp,
            // marginBottom: sizes._22sdp,
            // marginLeft: sizes._16sdp,
            // marginTop: sizes._16sdp,
            // display: 'flex',
            // flexDirection: 'row',
            // alignItems: 'center',
            // justifyContent: 'space-between',
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
          {/* <Button
            mode="contained"
            onPress={() =>
              this.handleSearch(
                false,
                _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY, 'id'),
              )
            }>
            Tìm kiếm
          </Button> */}
          {/* <TextInput
            mode="outlined"
            label="Tìm kiếm địa điểm du lịch"
            placeholder="nhập tên địa điểm, địa chỉ..."
            outlineStyle={{
              borderColor: colors.black,
              borderRadius: sizes._20sdp,
            }}
            textColor={colors.black}
            placeholderTextColor={colors.black}
            style={{width: sizes.width - sizes._135sdp, color: colors.black}}
            onChangeText={txt => {
              this.setState({
                valueSearch: txt,
              });
            }}
            value={this.state.valueSearch}
          /> */}
          {/* <TouchableOpacity
            style={{
              paddingVertical: sizes._16sdp,
              backgroundColor: colors.primary_600,
              borderRadius: sizes._20sdp,
              width: sizes._90sdp,
              height: sizes._54sdp,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() =>
              this.handleSearch(
                false,
                _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY, 'id'),
              )
            }>
            <TextBase style={AppStyle.txt_16_medium}>Tìm kiếm</TextBase>
          </TouchableOpacity> */}
        </View>
        <ScrollView>
          <View style={styles.container}>
            <View style={styles.rowCenter}>
              <TextBase style={[AppStyle.txt_20_bold]}>Phổ biến</TextBase>
              <TouchableOpacity
                onPress={() =>
                  this.handleSearch(true, this.state.locationsPopular)
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
              data={this.state.locationsPopular}
              renderItem={this.renderItemHorizontal}
              keyExtractor={item => item.Id.toString()}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            />

            <View style={[styles.rowCenter, {marginTop: sizes._24sdp}]}>
              <TextBase
                style={[AppStyle.txt_20_bold, {marginBottom: sizes._16sdp}]}>
                Gần tôi
              </TextBase>
              <TouchableOpacity
                onPress={() =>
                  this.handleSearch(true, this.state.locationsNearly)
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
              data={this.state.locationsNearly}
              renderItem={this.renderItemLarge}
              keyExtractor={item => item.Id.toString()}
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
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
