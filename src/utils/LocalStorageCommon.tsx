import AsyncStorage from '@react-native-async-storage/async-storage';
class LocalStorageCommon {
  /**
   * set item~
   */
  static async setItem(key: string, data: any) {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }
  /**
   * get item
   * @param objectKeys
   */
  static async getItem(key: string) {
    const dataCache = JSON.parse(await AsyncStorage.getItem(key));
    return dataCache;
  }
}
export default LocalStorageCommon;
