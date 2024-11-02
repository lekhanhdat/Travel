import axios, {AxiosInstance, AxiosResponse, HttpStatusCode} from 'axios';

// declare module 'axios' {}

const TIMEOUT = 5 * 60 * 1000; // 5 minutes

const request: AxiosInstance = axios.create({
  baseURL: 'https://sea-turtle-app-3wdrl.ondigitalocean.app',
  timeout: TIMEOUT,
});

request.interceptors.request.use(async config => {
  // if (waitForLogout) return;

  //   const token = LocalStorage.get(AUTH_KEY) || undefined;

  // request.headers = {
  //   ...request.headers,
  // };

  //   if (token) {
  //     request.headers.Authorization = `Bearer ${token}`;
  //   }

  config.headers['xc-token'] = 'wq-ABISx8gtwEXsr0HgnBxaMMBY-O3v8bXP-VVSc';

  return config;
});

request.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.status === HttpStatusCode.NoContent) {
      return true;
    }
    return response.data;
  },
  async error => {
    // if (waitForLogout) return

    // const {status, data} = error?.response || {};
    // switch (status) {
    //   case HttpStatusCode.Unauthorized: {

    //     // if (!LocalStorage.get(PROJECT_AUTH_TOKEN)) {
    //     //   // if (data?.message) {
    //     //   //   toast({
    //     //   //     description: data?.message,
    //     //   //     status: "error",
    //     //   //   });
    //     //   // }
    //     //   clearLocalStorageAndGotoLogin();
    //     //   return;
    //     // }

    //     // let token;

    //     // // if (isFetchingNewToken) {
    //     // //   token = await waitForGetNewToken();
    //     // // } else {
    //     // //   token = await handleRefreshToken();
    //     // // }

    //     // return request({
    //     //   ...config,
    //     //   headers: {
    //     //     ...config.headers,
    //     //     Authorization: `Bearer ${token}`,
    //     //   },
    //     // });
    //   }
    //   // eslint-disable-next-line no-fallthrough
    //   case HttpStatusCode.Forbidden: {
    //     // clearLocalStorageAndGotoLogin()
    //     return;
    //   }
    // }

    // return Promise.reject(data);
    return Promise.reject(error);
  },
);

export {request};
