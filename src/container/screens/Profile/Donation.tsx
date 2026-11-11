import React, {useEffect, useRef, useState} from 'react';
import i18n from '../../../i18n';
import {Alert, StyleSheet, View} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import {BackSvg} from '../../../assets/ImageSvg';
import colors from '../../../common/colors';
import sizes from '../../../common/sizes';
import TextBase from '../../../common/TextBase';
import InputBase from '../../../component/InputBase';
import {Button} from 'react-native-paper';
import {AppStyle} from '../../../common/AppStyle';
import paymentApi from '../../../services/payment.api';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import {localStorageKey} from '../../../common/constants';
import {IAccount} from '../../../common/types';
import QRCode from 'react-native-qrcode-svg';
import authApi from '../../../services/auth.api';

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  content: {padding: sizes._16sdp, gap: sizes._16sdp},
  qr: {width: sizes.width - sizes._64sdp, height: sizes.width - sizes._64sdp, alignSelf: 'center'},
});

const Donation = () => {
  const [amount, setAmount] = useState<string>('50000');
  const [creating, setCreating] = useState(false);
  const [qrCode, setQrCode] = useState<string | undefined>(undefined);
  const [orderCode, setOrderCode] = useState<number | undefined>(undefined);
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [userAccount, setUserAccount] = useState<IAccount | undefined>(undefined);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    // Load current user id from local storage and fetch the latest profile (balance) from the API
    (async () => {
      try {
        const acc: IAccount = await LocalStorageCommon.getItem(localStorageKey.AVT);
        if (acc?.id) {
          setUserId(acc.id);
          const latestUserData = await authApi.getUserById(acc.id);
          if (latestUserData) {
            setUserAccount(latestUserData);
            // Update LocalStorage with latest data
            await LocalStorageCommon.setItem(localStorageKey.AVT, latestUserData);
          } else {
            // Fallback to cached data if fetch fails
            setUserAccount(acc);
          }
        }
      } catch (e) {
        console.error('Error loading user data:', e);
      }
    })();
    return () => {
      if (pollRef.current != null) {clearInterval(pollRef.current as any);}
    };
  }, []);

  const onCreate = async () => {
    try {
      const amt = parseInt(amount || '0', 10);
      if (!amt || amt < 1000 || amt > 50000000) {
        Alert.alert(i18n.t('common:ui.donation.invalidAmount'));
        return;
      }
      setCreating(true);
      const res = await paymentApi.createDonation({amount: amt, userId});
      setQrCode(res.qrCode);
      setOrderCode(res.orderCode);

      // Start polling status mỗi 4s nếu có orderCode
      if (res.orderCode) {
        if (pollRef.current != null) {clearInterval(pollRef.current as any);}
        pollRef.current = (setInterval(async () => {
          try {
            const status = await paymentApi.getStatus(res.orderCode);
            if (status.status === 'CANCELLED' || status.status === 'EXPIRED') {
              if (pollRef.current != null) {clearInterval(pollRef.current as any);}
              pollRef.current = null;
              setQrCode(undefined);
              Alert.alert(i18n.t('common:ui.donation.expired'));
            } else if (status.status === 'PAID') {
              if (pollRef.current != null) {clearInterval(pollRef.current as any);}
              pollRef.current = null;
              Alert.alert(i18n.t('common:ui.donation.paid'));
              // Quay về trang Profile
              // @ts-ignore
              require('../NavigationService').default.pop();
            }
          } catch (e) {
            // ignore temporary errors
          }
        }, 4000) as unknown) as number;
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert(e?.message ?? i18n.t('common:ui.donation.qrFailed'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Page>
      <HeaderBase
        title={i18n.t('common:ui.donation.title')}
        leftIconSvg={<BackSvg width={sizes._24sdp} height={sizes._24sdp} color={colors.primary_950} />}
        onLeftIconPress={() => {
          // @ts-ignore
          require('../NavigationService').default.pop();
        }}
      />
      <View style={styles.content}>
        {userAccount && (
          <TextBase style={[AppStyle.txt_16_medium, {color: colors.primary_700, marginBottom: sizes._8sdp}]}>
            {i18n.t('common:ui.donation.thanks', {
              name: userAccount.fullName || userAccount.userName,
              balance: userAccount.balance?.toLocaleString('vi-VN') || '0',
            })}
          </TextBase>
        )}
        <TextBase style={[AppStyle.txt_18_bold]}>{i18n.t('common:ui.donation.amount')}</TextBase>
        <InputBase
          placeHolder={i18n.t('common:ui.donation.amountExample')}
          initValue={amount}
          onChangeText={(t: string) => setAmount(t.replace(/[^0-9]/g, ''))}
        />
        <Button mode="contained" loading={creating} onPress={onCreate}>
          {i18n.t('common:ui.donation.create')}
        </Button>

        {qrCode && (
          <View style={{marginTop: sizes._16sdp, alignItems: 'center'}}>
            <TextBase style={[AppStyle.txt_16_medium, {marginBottom: sizes._8sdp}]}>{i18n.t('common:ui.donation.scan')}</TextBase>
            <QRCode value={qrCode} size={sizes.width - sizes._64sdp} />
            {!!orderCode && (
              <TextBase style={{marginTop: sizes._8sdp, color: colors.primary_700}}>
                {i18n.t('common:ui.donation.orderCode', {orderCode})}
              </TextBase>
            )}
          </View>
        )}
      </View>
    </Page>
  );
};

export default Donation;

