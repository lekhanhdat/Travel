import React from 'react';
import { ScrollView, View, Image, FlatList } from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import { BackSvg } from '../../../assets/assets/ImageSvg';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import NavigationService from '../NavigationService';
import { ILocation, IReview } from '../../../common/types';
import TextBase from '../../../common/TextBase';
import { AppStyle } from '../../../common/AppStyle';
import ReviewItem from '../../../component/ReviewItem';
import { reviews } from '../../../common/reviewsConstants';
import { MapSvg } from '../../../assets/ImageSvg';
import { ScreenName } from '../../AppContainer';

interface IDetailLocationScreenProps {
  navigation: any;
}

interface IDetailLocationScreenState {

}

export default class DetailLocationScreen extends React.PureComponent<IDetailLocationScreenProps, IDetailLocationScreenState> {
  constructor(props: IDetailLocationScreenProps) {
    super(props);
    this.state = {
    }
  }

  renderItem = ({ item, index }: { item: IReview, index: number }) => {
    return <ReviewItem review={item} />
  }

  getRandomElements = (arr: IReview[], num: number) => {
    // Copy mảng gốc để tránh thay đổi
    const shuffled = [...arr];
    // Sắp xếp lại mảng một cách ngẫu nhiên
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Trả về `num` phần tử đầu tiên
    return shuffled.slice(0, num);
  }

  render(): React.ReactNode {
    const location: ILocation = this.props.navigation.state.params?.location;
    return (
      <Page>
        <HeaderBase
          title={'Xem chi tiết'}
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

          rightIconSvgOne={<MapSvg
            width={sizes._24sdp}
            height={sizes._24sdp}
            color={colors.primary_950}
          />}
          onRightIconOnePress={() => {
            NavigationService.navigate(ScreenName.MAP_SCREEN, { locations: [location] })
          }}
        />
        <View style={{ flex: 1 }}>
          <ScrollView>
            <Image source={{ uri: location.avatar }} style={{
              width: sizes.width,
              height: sizes._200sdp,
            }} />

            <View style={{ flex: 1, padding: sizes._16sdp }}>
              <TextBase style={[AppStyle.txt_20_bold, ]}>
                {location.name}
              </TextBase>

              <TextBase style={[AppStyle.txt_16_regular, { marginTop: sizes._16sdp }]}>
                {location.description}
              </TextBase>

              <View style={{ width: sizes.width - sizes._32sdp, height: 3, backgroundColor: colors.primary, marginVertical: sizes._25sdp }} />

              <TextBase style={[AppStyle.txt_16_bold, { marginBottom: sizes._16sdp }]}>
                {'Nhận xét của du khách:'}
              </TextBase>

              <FlatList
                data={location.reviews}
                scrollEnabled={false}
                renderItem={this.renderItem}
                keyExtractor={(item, index) => index.toString() + item.id}
              />
            </View>
          </ScrollView>
        </View>
      </Page>
    );
  }
}