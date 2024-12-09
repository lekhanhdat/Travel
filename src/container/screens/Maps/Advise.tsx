import {ScrollView, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import {BackSvg} from '../../../assets/assets/ImageSvg';
import colors from '../../../common/colors';
import sizes from '../../../common/sizes';
import NavigationService from '../NavigationService';
import {ILocation} from '../../../common/types';
import {AppStyle} from '../../../common/AppStyle';

interface Props {
  navigation: any;
}
interface States {}

export default class Advise extends React.PureComponent<Props, States> {
  render(): React.ReactNode {
    const location: ILocation = this.props.navigation.state.params?.location;
    console.log(111, JSON.stringify(location, null, 2));
    return (
      <Page style={styles.pageContainer}>
        <HeaderBase
          title={'Quy tắc ứng xử văn minh'}
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

        <View style={styles.contentContainer}>
          <Text style={[AppStyle.txt_20_bold, styles.titleText]}>
            Một số lưu ý khi tham quan tại địa điểm:
          </Text>
        </View>

        {location?.advise &&
          location.advise.split('\n').map((item, index) => (
            <View key={index} style={styles.adviseItem}>
              <Text style={styles.adviseText}>- {item}</Text>
            </View>
          ))}

        {/* <View style={styles.contentContainer}>
          <Text style={[AppStyle.txt_20_bold, styles.titleText]}>
            Một số lưu ý khi tham quan tại địa điểm:
          </Text>
          <View style={styles.spacing} />
          <Text style={AppStyle.txt_20_regular}>
            - Tuân thủ các quy định của pháp luật; phù hợp với chuẩn mực đạo đức, thuần phong mỹ tục và truyền thống văn hóa của dân tộc.
          </Text>
          <View style={styles.smallSpacing} />
          <Text style={AppStyle.txt_20_regular}>
            - Giữ gìn trật tự và không gây ồn ào
          </Text>
          <View style={styles.smallSpacing} />
          <Text style={AppStyle.txt_20_regular}>
            - Có thái độ, hành vi cư xử văn minh, lịch sự, tôn trọng khi tiếp xúc với mọi người.
          </Text>
          <View style={styles.smallSpacing} />
        </View> */}
      </Page>
    );
  }
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    // padding: sizes._16sdp,
    backgroundColor: colors.white,
  },
  titleText: {
    textAlign: 'center',
    marginTop: sizes._24sdp,
  },
  spacing: {
    height: sizes._16sdp,
  },
  smallSpacing: {
    height: sizes._8sdp,
  },
  adviseItem: {
    marginHorizontal: sizes._16sdp,
    marginTop: sizes._16sdp,
  },
  adviseText: {
    fontSize: 16,
    color: '#333',
  },
});
