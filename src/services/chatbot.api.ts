// P9: the chatbot talks to the Cloud Run RAG chat (POST /api/v1/chat/rag, JWT); OpenAI/SerpAPI keys
// are only on the BE. Function names/signatures are unchanged for ChatbotScreen.
import {chatWithRAG, clearChatSession, generateSessionId} from './semantic.api';
import LocalStorageCommon from '../utils/LocalStorageCommon';
import {localStorageKey} from '../common/constants';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{type: 'text' | 'image_url'; text?: string; image_url?: {url: string}}>;
}

export interface ChatResponse {
  message: string;
  error?: string;
  imageUrl?: string; // URL of generated image (if any)
}

export interface ImageGenerationResponse {
  imageUrl?: string;
  imageUrls?: string[]; // Multiple images
  error?: string;
}

// Images of the RAG sources of the last answer (catalog images); shown when the user asks for photos.
let lastSourceImages: string[] = [];

/** Chat session on the BE (history + quota); one per conversation, reset by "new conversation". */
async function chatSessionId(): Promise<string> {
  const saved = await LocalStorageCommon.getItem(localStorageKey.CHAT_SESSION_ID);
  if (typeof saved === 'string' && saved) {
    return saved;
  }
  const created = generateSessionId();
  await LocalStorageCommon.setItem(localStorageKey.CHAT_SESSION_ID, created);
  return created;
}

/** Start a new conversation: the BE forgets the old session's history. */
export const resetChatSession = async (): Promise<void> => {
  const saved = await LocalStorageCommon.getItem(localStorageKey.CHAT_SESSION_ID);
  if (typeof saved === 'string' && saved) {
    await clearChatSession(saved);
  }
  await LocalStorageCommon.setItem(localStorageKey.CHAT_SESSION_ID, generateSessionId());
  lastSourceImages = [];
};

/**
 * Send the latest user message to the BE RAG chat (context from Neon: catalog + objects; history per session).
 * @param messages - conversation shown in the app; only the last user message is sent (the BE keeps history)
 * @param _systemPrompt - unused: the system prompt now lives in the BE (services/rag_service.py)
 */
export const sendChatMessage = async (
  messages: ChatMessage[],
  _systemPrompt?: string,
): Promise<ChatResponse> => {
  const last = [...messages].reverse().find(message => message.role === 'user');
  if (!last) {
    return {message: '', error: 'Chưa có câu hỏi.'};
  }
  const parts = typeof last.content === 'string' ? [{type: 'text' as const, text: last.content}] : last.content;
  const text = parts.find(part => part.type === 'text')?.text?.trim() || 'Đây là gì? Hãy mô tả chi tiết.';
  const imageUrl = parts.find(part => part.type === 'image_url')?.image_url?.url;
  const result = await chatWithRAG({
    message: text,
    session_id: await chatSessionId(),
    include_sources: true,
    ...(imageUrl ? {image_url: imageUrl} : {}),
  });
  if (!result.success) {
    return {message: '', error: result.error || 'Trợ lý đang gặp lỗi, vui lòng thử lại sau.'};
  }
  lastSourceImages = (result.sources || [])
    .map(source => source.image_url)
    .filter((url): url is string => typeof url === 'string' && url.length > 0);
  return {message: result.message ?? result.response ?? ''};
};

/**
 * Extract number of images requested from user message
 * @param message - User's message
 * @returns Number of images to fetch (default: 3)
 */
const extractImageCount = (message: string): number => {
  const lowerMessage = message.toLowerCase();

  // Match patterns like "5 ảnh", "10 hình", "1 ảnh", etc.
  const match = lowerMessage.match(/(\d+)\s*(ảnh|hình|image|photo)/);

  if (match) {
    const count = parseInt(match[1], 10);
    // Limit to max 10 images to avoid excessive API calls
    return Math.min(count, 10);
  }

  // Default: 3 images
  return 3;
};

/**
 * Images for "cho tôi xem ảnh …": the catalog images of the sources of the last answer.
 * P9: no Google Images search any more — the SerpAPI free plan (250/month) is reserved for Camera detect.
 */
export const searchImage = async (
  _query: string,
  count: number = 3,
): Promise<ImageGenerationResponse> => {
  const imageUrls = lastSourceImages.filter((url, index) => lastSourceImages.indexOf(url) === index).slice(0, count);
  return imageUrls.length > 0
    ? {imageUrls}
    : {error: 'Chưa có ảnh trong dữ liệu của ứng dụng cho nội dung này.'};
};

export {extractImageCount};

/**
 * Detect if user wants to VIEW/FIND an existing image (catalog images from the chat sources)
 * @param message - User's message
 * @returns true if user wants to see an existing image
 */
export const isImageSearchRequest = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();

  const findKeywords = [
    'cho tôi xem ảnh',
    'cho xem ảnh',
    'tìm ảnh',
    'ảnh của',
    'ảnh về',
    'hình ảnh về',
    'hình ảnh của',
    'show me',
    'show image',
    'find image',
    'search image',
    'xem ảnh',
    'có ảnh',
    'ảnh nào',
    'picture of',
    'photo of',
  ];

  return findKeywords.some(keyword => lowerMessage.includes(keyword));
};

/**
 * Get quick reply suggestions based on context
 */
export const getQuickReplies = (): string[] => {
  return [
    'Địa điểm nổi tiếng ở Đà Nẵng?',
    'Món ăn đặc sản nên thử?',
    'Lịch trình 3 ngày 2 đêm?',
    'Khách sạn gần biển?',
  ];
};

