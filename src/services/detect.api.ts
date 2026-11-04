import RNFetchBlob from 'rn-fetch-blob';
import {env} from '../utils/env';
import {AI_RECOGNITION_TIMEOUT} from '../common/constants';
import {tokenStore} from './api.client';

// P8: camera recognition through the Cloud Run API (POST /detect, JWT; Google Lens + OpenAI run on the BE).
// rn-fetch-blob streams the photo file as multipart (field `image_file`, as before).
export interface DetectResult {
  name: string;
  description: string;
  /** Row of GET /objects when the photo matched a known object. */
  object_id: number | null;
}

export class DetectError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'DetectError';
  }
}

export async function detectImage(filePath: string): Promise<DetectResult> {
  const token = await tokenStore.get();
  const response = await RNFetchBlob.config({timeout: AI_RECOGNITION_TIMEOUT}).fetch(
    'POST',
    `${env.API_BASE_URL}/detect`,
    {
      'Content-Type': 'multipart/form-data',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    [{name: 'image_file', filename: 'image.jpg', type: 'image/jpeg', data: RNFetchBlob.wrap(filePath)}],
  );
  const status = response.info().status;
  let body: any = null;
  try {
    body = JSON.parse(response.data);
  } catch {
    body = null;
  }
  if (status !== 200) {
    // BE errors are Vietnamese `detail` strings (quota, nothing recognised, provider down).
    throw new DetectError(status, typeof body?.detail === 'string' ? body.detail : `Server trả về lỗi: ${status}`);
  }
  if (!body || typeof body.name !== 'string' || typeof body.description !== 'string') {
    throw new DetectError(status, 'Không thể xử lý kết quả từ server');
  }
  return body as DetectResult;
}
