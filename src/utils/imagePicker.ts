import {NativeModules, Platform} from 'react-native';
import {
  launchImageLibrary as launchLibrary,
  Asset,
  Callback,
  ImageLibraryOptions,
  ImagePickerResponse,
} from 'react-native-image-picker';

const {ContentPicker} = NativeModules as {
  ContentPicker?: {pickImage: () => Promise<Asset | null>};
};

/**
 * `launchImageLibrary` with an Android fallback: when the system photo picker
 * (PICK_IMAGES) is missing, react-native-image-picker fails with errorCode 'others'
 * ("No Activity found"); we then open the generic content chooser through the
 * app's own ContentPicker module (android/app/.../picker). Same callback contract.
 */
export function launchImageLibrary(options: ImageLibraryOptions, callback?: Callback): Promise<ImagePickerResponse> {
  return launchLibrary(options).then(async response => {
    let result = response;
    if (response.errorCode === 'others' && Platform.OS === 'android' && ContentPicker) {
      try {
        const asset = await ContentPicker.pickImage();
        result = asset ? {assets: [asset]} : {didCancel: true};
      } catch (e: any) {
        result = {errorCode: 'others', errorMessage: e?.message ?? String(e)};
      }
    }
    callback?.(result);
    return result;
  });
}
