import {NativeModules} from 'react-native';

export const getRSAKeys = async (): Promise<{
  public: string;
  private: string;
}> => {
  const UniqueDeviceID = NativeModules.UniqueDeviceIDModule;
  const keys = await UniqueDeviceID.getRSAKeys();
  let _keys = JSON.parse(keys);
  return _keys;
};

export function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return [h, m > 9 ? m : h ? '0' + m : m || '0', s > 9 ? s : '0' + s]
    .filter(Boolean)
    .join(':');
}
/**
 *
 * @param sms
 */
export const getOtpFromString = (sms: string) => {
  let otp = '';
  let regex = /[0-9]{6}/g;
  let otps = sms.match(regex);
  if (otps && otps.length == 1) {
    otp = otps[0];
  }
  return otp;
};
export const setTextNumber = (str: string) => {
  str = str.toLowerCase();
  str = str.replace(/[^0-9.]/g, '');
  return str;
};
export const setOnllyTextAndNumber = (str: string) => {
  str = str.toLowerCase();
  str = str.replace(
    /[-#*;₫¥€'"~:•,“‘|.<>!@$%^&_?=`√π÷×¶∆£¢°°℅™®©\{\}\[\]\\\/+()]/gi,
    '',
  );
  return str;
};
/**
 * validate email
 * @param {string} email
 * @returns true | false
 */
export const validateEmail = (email: string) => {
  const re =
    /^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email.toLowerCase());
};

/**
 * Xoa dau tieng viet.
 * @param {string} words
 * @returns Chuoi khong co dau.
 */
export const convertCitationVietnameseUnsigned = (words: string) => {
  if (!words || !words.trim()) {
    return '';
  }

  const wordsSplit = words.split(' ');
  const citationConvert: any = [];
  wordsSplit.forEach(word => {
    citationConvert.push(removeSign(word));
  });

  return citationConvert.join(' ');
};

/**
 * Xoa dau tu tieng viet
 * @param str
 */
const removeSign = (str: string) => {
  if (!str) {
    return str;
  }
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str;
};
