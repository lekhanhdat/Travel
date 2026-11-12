import {ScrollView, StyleSheet, View} from 'react-native';
import React from 'react';
import Text from '../../../ui/Text';
import {color} from '../../../theme/tokens';
import {withTranslation, WithTranslation} from 'react-i18next';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import {BackSvg} from '../../../assets/ImageSvg';
import colors from '../../../common/colors';
import sizes from '../../../common/sizes';
import NavigationService from '../NavigationService';
import {ILocation} from '../../../common/types';
import {AppStyle} from '../../../common/AppStyle';

interface Props extends WithTranslation {
  navigation: any;
  route: any;
}
interface States {}

class Advise extends React.PureComponent<Props, States> {
  render(): React.ReactNode {
    const {t} = this.props;
    const location: ILocation = this.props.route?.params?.location;
    return (
      <Page style={styles.pageContainer}>
        <HeaderBase
          title={t('map.adviseTitle')}
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
            {t('map.adviseIntro')}
          </Text>
        </View>

        <ScrollView style={styles.scrollContainer}>
          {location?.advise ? (
            // Kiểm tra xem advise là string hay array
            (Array.isArray(location.advise)
              ? location.advise
              : location.advise.split('\n')
            ).map((item, index) => (
              <View key={index} style={styles.adviseItem}>
                <Text style={styles.adviseText}>• {item.trim()}</Text>
              </View>
            ))
          ) : (
            <View style={styles.adviseItem}>
              <Text style={styles.noContentText}>
                {t('map.noAdvise')}
              </Text>
            </View>
          )}
        </ScrollView>

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
  scrollContainer: {
    flex: 1,
    paddingBottom: sizes._16sdp,
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
    color: color.text,
    lineHeight: 24,
    textAlign: 'justify',
  },
  noContentText: {
    fontSize: 16,
    color: colors.xam,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default withTranslation('common')(Advise);
