import React from 'react';
import { FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import { TextInput } from 'react-native-paper';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import TextBase from '../../../common/TextBase';
import { AppStyle } from '../../../common/AppStyle';
import { ILocation } from '../../../common/types';
import BigItemLocation from '../../../component/BigItemLocation';
import { LOCATION_NEARLY, LOCATION_POPULAR } from '../../../common/locationConstants';
import LargeItemLocation from '../../../component/LargeItemLocation';
import NavigationService from '../NavigationService';
import { ScreenName } from '../../AppContainer';
import _ from 'lodash';

interface IHomeScreenProps {
  navigation: any;
}

interface IHomeScreenState {
  valueSearch: string;
}

export default class HomeScreen extends React.PureComponent<IHomeScreenProps, IHomeScreenState> {
  refInput: any;
  constructor(props: IHomeScreenProps) {
    super(props);
    this.state = {
      valueSearch: ''
    }
  }

  componentDidMount(): void {
    this.props.navigation.addListener('focus', () => {
      this.setState({
        valueSearch: ''
      })
    })
  }

  renderItemHorizontal = ({ item, index }: { item: ILocation, index: number }) => {
    return <BigItemLocation location={item} />
  }

  renderItemLarge = ({ item, index }: { item: ILocation, index: number }) => {
    return <LargeItemLocation location={item} />
  }

  handleSearch = (isViewAll: boolean, locations: ILocation[]) => {
    NavigationService.navigate(ScreenName.VIEW_ALL_SCREEN, { title: isViewAll ? 'Xem tất cả' : 'Tìm kiếm', locations: locations, valueSearch: this.state.valueSearch });
  }

  render(): React.ReactNode {
    return (
      <Page>
        <HeaderBase hideLeftIcon title={strings.home_page} />

        <View style={{
          width: sizes.width - sizes._32sdp, marginBottom: sizes._32sdp, marginLeft: sizes._16sdp,
          marginTop: sizes._16sdp,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <TextInput
            mode="outlined"
            label="Tìm kiếm địa điểm du lịch"
            placeholder="Nhập tên, địa chỉ..."
            outlineStyle={{ borderColor: colors.primary }}
            textColor={colors.primary_950}
            placeholderTextColor={colors.primary_950}
            style={{ width: sizes.width - sizes._138sdp, color: colors.primary_950 }}
            onChangeText={(txt) => {
              this.setState({
                valueSearch: txt
              })
            }}
            value={this.state.valueSearch}
          />
          <TouchableOpacity
            style={{
              paddingVertical: sizes._16sdp,
              backgroundColor: colors.primary,
              borderRadius: sizes._10sdp,
              width: sizes._90sdp,
              alignItems: 'center'
            }}
            onPress={() => this.handleSearch(false, _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY, 'id'))}
          >
            <TextBase style={AppStyle.txt_14_medium}>Tìm kiếm</TextBase>
          </TouchableOpacity>
        </View>
        <ScrollView>
          <View style={styles.container}>

            <View style={styles.rowCenter}>
              <TextBase style={[AppStyle.txt_16_bold, { color: colors.primary_950, marginBottom: sizes._16sdp }]}>Phổ biến</TextBase>
              <TouchableOpacity
                onPress={() => this.handleSearch(true, LOCATION_POPULAR)}
              >
                <TextBase style={[AppStyle.txt_16_regular, { color: colors.primary_950, marginBottom: sizes._16sdp, textDecorationLine: 'underline' }]}>Xem tất cả</TextBase>
              </TouchableOpacity>
            </View>

            <FlatList
              data={LOCATION_POPULAR.slice(0, 5)}
              renderItem={this.renderItemHorizontal}
              keyExtractor={(item) => item.id.toString()}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            />

            <View style={[styles.rowCenter, { marginTop: sizes._32sdp }]}>
              <TextBase style={[AppStyle.txt_16_bold, { color: colors.primary_950, marginBottom: sizes._16sdp }]}>Gần tôi</TextBase>
              <TouchableOpacity
                onPress={() => this.handleSearch(true, LOCATION_NEARLY)}

              >
                <TextBase style={[AppStyle.txt_16_regular, { color: colors.primary_950, marginBottom: sizes._16sdp, textDecorationLine: 'underline' }]}>Xem tất cả</TextBase>
              </TouchableOpacity>
            </View>

            <FlatList
              data={LOCATION_NEARLY.slice(0, 5)}
              renderItem={this.renderItemLarge}
              keyExtractor={(item) => item.id.toString()}
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
    padding: sizes._16sdp
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  }
})