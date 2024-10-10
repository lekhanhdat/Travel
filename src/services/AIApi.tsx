import Axios from 'axios';
import NavigationService from '../container/screens/NavigationService';

export const baseURL = 'https://maps.googleapis.com';
export enum BodyType {
  RAW,
  URLENCODED,
  FORMDATA,
  NONE,
  RAW_URL,
}
class AIApi {
  /**
   *
   * @param url
   * @param params
   * @param headers
   */
  private requestPost(
    url: string,
    params?: any,
    headers?: any | null,
    bodyType?: BodyType,
    baseUrl?: string,
    errorResponse?: (error) => void,
  ) {
    var paramsConverted: any = null;
    if (params != null && bodyType != null) {
      if (bodyType === BodyType.URLENCODED) {
        paramsConverted = new URLSearchParams(params).toString();
      } else if (bodyType === BodyType.FORMDATA) {
        const formData = new FormData();
        Object.keys(params).forEach(key => formData.append(key, params[key]));
        paramsConverted = formData;
      } else if (bodyType === BodyType.NONE) {
        paramsConverted = params;
      } else if (bodyType === BodyType.RAW_URL) {
        paramsConverted = {};
      }
    }
    // let axiosParams = new URLSearchParams(params).toString();
    return Axios.post(
      baseUrl ? baseUrl + url : baseURL + url,
      paramsConverted ? paramsConverted : params != null ? params : {},
      {
        headers: headers ? headers : {},
        params: bodyType === BodyType.RAW_URL ? params : {},
      },
    )
      .then(res => {
        console.log('RESRES', res);
        if (res.data) {
          ///////////////////////////////////////////// Using to check invalid session
          var resJSON = null;
          if (res.data.data) {
            resJSON = JSON.stringify(res.data.data);
          }
          if (
            resJSON != null &&
            resJSON.error &&
            resJSON.error === 'invalid_token'
          ) {
            NavigationService.navigate('LoginScreen', {});
          }
          return res.data;
        } else {
          return {};
        }
      })
      .catch(error => {
        console.log('error', error.response);
        errorResponse && errorResponse(error.response);
        return error.response;
      });
  }
  /**
   *
   * @param url
   * @param params
   * @param headers
   */
  private requestPut(
    url: string,
    params?: any,
    headers?: any | null,
    bodyType?: BodyType,
    baseUrl?: string,
    errorResponse?: (error) => void,
  ) {
    var paramsConverted: any = null;
    if (params != null && bodyType != null) {
      if (bodyType === BodyType.URLENCODED) {
        paramsConverted = new URLSearchParams(params).toString();
      } else if (bodyType === BodyType.FORMDATA) {
        const formData = new FormData();
        Object.keys(params).forEach(key => formData.append(key, params[key]));
        paramsConverted = formData;
      } else if (bodyType === BodyType.NONE) {
        paramsConverted = params;
      } else if (bodyType === BodyType.RAW_URL) {
        paramsConverted = {};
      }
    }
    // let axiosParams = new URLSearchParams(params).toString();
    return Axios.put(
      baseUrl ? baseUrl + url : baseURL + url,
      paramsConverted ? paramsConverted : params != null ? params : {},
      {
        headers: headers ? headers : {},
        params: bodyType === BodyType.RAW_URL ? params : {},
      },
    )
      .then(res => {
        console.log('RESRES', res);
        if (res.data) {
          ///////////////////////////////////////////// Using to check invalid session
          var resJSON = null;
          if (res.data.data) {
            resJSON = JSON.stringify(res.data.data);
          }
          if (
            resJSON != null &&
            resJSON.error &&
            resJSON.error === 'invalid_token'
          ) {
            NavigationService.navigate('LoginScreen', {});
          }
          return res.data;
        } else {
          return {};
        }
      })
      .catch(error => {
        console.log('error', error.response);
        errorResponse && errorResponse(error.response);
        return error.response;
      });
  }

  /**
   *
   * @param url
   */
  private requestDel(
    url: string,
    headers?: any,
    params?: any,
    baseUrl?: string,
  ) {
    // console.log("=======> URL: " + fixURL ? fixURL + url : BASE_URL + url)
    // console.log("=======> PARAMS: " + JSON.stringify(params ? params : {}))
    return Axios.delete(baseUrl ? baseUrl + url : baseURL + url, {
      headers: headers ? headers : {},
      params: params ? params : {},
    })
      .then(res => {
        if (res.data) {
          try {
            // console.log("=======> RESPONSE: " + JSON.stringify(res.data), res.data);
          } catch (error) { }
          return res.data;
        } else {
          return {};
        }
      })
      .catch(error => {
        console.log('=========> error: ', error.response);
      });
  }

  /**
   *
   * @param url
   */
  private requestGet(
    url: string,
    headers?: any,
    params?: any,
    fixURL?: string,
    errorResponse?: (error) => void,
  ) {
    let urlRequest = fixURL ? fixURL + url : baseURL + url;
    return Axios.get(urlRequest, {
      headers: headers ? headers : {},
      params: params ? params : {},
    })
      .then(res => {
        if (res.data) {
          try {
          } catch (error) { }

          return res.data;
        } else {
          return {};
        }
      })
      .catch(error => {
        console.log('=========> error: ', error.response);
        errorResponse && errorResponse(error.response);
        if (error && error.response && error.response.status === 401) {
          // this.refresh_access_token();
        } else {
        }
      });
  }

  async getLine(params: any) {
    let url = `/maps/api/directions/json`;
    return await this.requestGet(url, {}, params, undefined);
  }
}
export default new AIApi();
