import React from 'react';
import {Image, ScrollView, View} from 'react-native';
import {BackSvg} from '../../../assets/assets/ImageSvg';
import {MapSvg} from '../../../assets/ImageSvg';
import {AppStyle} from '../../../common/AppStyle';
import colors from '../../../common/colors';
import sizes from '../../../common/sizes';
import TextBase from '../../../common/TextBase';
import {IItem, IReview} from '../../../common/types';
import HeaderBase from '../../../component/HeaderBase';
import Page from '../../../component/Page';
import ReviewItem from '../../../component/ReviewItem';
import {ScreenName} from '../../AppContainer';
import NavigationService from '../NavigationService';
import {DB_URL} from '../../../utils/configs';

interface IDetailItemScreenProps {
  navigation: any;
}

interface IDetailItemScreenState {}

export default class DetailItem extends React.PureComponent<
  IDetailItemScreenProps,
  IDetailItemScreenState
> {
  constructor(props: IDetailItemScreenProps) {
    super(props);
    this.state = {};
  }

  renderItem = ({item, index}: {item: IReview; index: number}) => {
    return <ReviewItem key={`item-${index}`} review={item} />;
  };

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
  };

  render(): React.ReactNode {
    const item: IItem = this.props.navigation.state.params?.item;
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
            NavigationService.pop();
          }}
          //   rightIconSvgOne={
          //     <MapSvg
          //       width={sizes._24sdp}
          //       height={sizes._24sdp}
          //       color={colors.primary_950}
          //     />
          //   }
          //   onRightIconOnePress={() => {
          //     NavigationService.navigate(ScreenName.MAP_SCREEN, {
          //       locations: [item],
          //     });
          //   }}
        />
        <View style={{flex: 1, backgroundColor: colors.primary_200}}>
          <ScrollView>
            <Image
              source={{
                uri:
                  item.images && item.images.length > 0
                    ? // @ts-ignore
                      `${DB_URL}/${item.images[0]?.path}`
                    : undefined,
              }}
              style={{
                objectFit: 'contain',
                width: sizes.width,
                height: sizes._400sdp,
              }}
            />

            <View style={{flex: 1, padding: sizes._16sdp}}>
              <TextBase style={[AppStyle.txt_20_bold]}>{item.name}</TextBase>

              <TextBase
                style={[AppStyle.txt_16_medium, {marginTop: sizes._12sdp}]}>
                {item.description}
              </TextBase>

              {/* <TextBase
                style={[AppStyle.txt_16_medium, {marginTop: sizes._12sdp}]}>
                Địa chỉ: {item.address}
              </TextBase> */}

              <View
                style={{
                  width: sizes.width - sizes._32sdp,
                  height: 2,
                  elevation: 2,
                  backgroundColor: colors.primary_700,
                  marginVertical: sizes._25sdp,
                }}
              />

              {/* <TextBase
                style={[AppStyle.txt_20_bold, {marginBottom: sizes._20sdp}]}>
                {'Nhận xét của du khách:'}
              </TextBase>
 */}
              {/* <FlatList
                data={location.reviews}
                scrollEnabled={false}
                renderItem={this.renderItem}
                keyExtractor={(item, index) => index.toString() + item.id}
              /> */}
            </View>
          </ScrollView>
        </View>
      </Page>
    );
  }
}
