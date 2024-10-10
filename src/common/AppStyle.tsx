import { StyleSheet } from "react-native";
import sizes from "./sizes";
import fonts from "./fonts";
import colors from "./colors";

export const AppStyle = StyleSheet.create({
  txt_12_regular: {
    fontSize: sizes._12sdp,
    lineHeight: sizes._14sdp,
    fontFamily: fonts.NotoSansJP_Regular,
    color: colors.primary_950,
  },
  txt_12_medium: {
    fontSize: sizes._12sdp,
    lineHeight: sizes._14sdp,
    fontFamily: fonts.NotoSansJP_Medium,
    color: colors.primary_950,
  },
  txt_12_bold: {
    fontSize: sizes._12sdp,
    lineHeight: sizes._14sdp,
    fontFamily: fonts.NotoSansJP_Bold,
    color: colors.primary_950,
  },

  txt_14_regular: {
    fontSize: sizes._14sdp,
    lineHeight: sizes._17sdp,
    fontFamily: fonts.NotoSansJP_Regular,
    color: colors.primary_950,
  },
  txt_14_medium: {
    fontSize: sizes._14sdp,
    lineHeight: sizes._17sdp,
    fontFamily: fonts.NotoSansJP_Medium,
    color: colors.primary_950,
  },
  txt_14_bold: {
    fontSize: sizes._14sdp,
    lineHeight: sizes._17sdp,
    fontFamily: fonts.NotoSansJP_Bold,
    color: colors.primary_950,
  },

  txt_16_regular: {
    fontSize: sizes._16sdp,
    lineHeight: sizes._20sdp,
    fontFamily: fonts.NotoSansJP_Regular,
    color: colors.primary_950,
  },
  txt_16_medium: {
    fontSize: sizes._16sdp,
    lineHeight: sizes._20sdp,
    fontFamily: fonts.NotoSansJP_Medium,
    color: colors.primary_950,
  },
  txt_16_bold: {
    fontSize: sizes._16sdp,
    lineHeight: sizes._20sdp,
    fontFamily: fonts.NotoSansJP_Bold,
    color: colors.primary_950,
  },
});