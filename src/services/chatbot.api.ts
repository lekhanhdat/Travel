import axios from 'axios';
import {env} from '../utils/env';

// OpenAI API Configuration
const OPENAI_API_KEY = env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// SerpAPI Configuration (Google Images search)
const SERPAPI_KEY = env.SERPAPI_KEY || '';
const SERPAPI_URL = 'https://serpapi.com/search.json';

// Debug: Log API key (first 10 chars only for security)
console.log('🔑 SERPAPI_KEY loaded:', SERPAPI_KEY ? `${SERPAPI_KEY.substring(0, 10)}...` : 'EMPTY');

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

/**
 * Send message to OpenAI ChatGPT API
 * @param messages - Array of chat messages (conversation history)
 * @param systemPrompt - Optional system prompt to set chatbot behavior
 * @returns ChatResponse with assistant's reply
 */
export const sendChatMessage = async (
  messages: ChatMessage[],
  systemPrompt?: string,
): Promise<ChatResponse> => {
  try {
    // Build messages array with system prompt
    const apiMessages: ChatMessage[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      apiMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    } else {
      // Default system prompt for travel assistant
      apiMessages.push({
        role: 'system',
        content: `Bạn là trợ lý AI thông minh của ứng dụng du lịch Đà Nẵng.
Nhiệm vụ của bạn là:
- Tư vấn về các địa điểm du lịch tại Đà Nẵng
- Giới thiệu các hiện vật lịch sử, văn hóa
- Hướng dẫn lịch trình du lịch
- Trả lời các câu hỏi về ẩm thực, khách sạn, di chuyển
- Luôn trả lời bằng tiếng Việt, thân thiện và nhiệt tình
- Câu trả lời chi tiết, đầy đủ thông tin
- Có thể phân tích hình ảnh nếu người dùng gửi ảnh

**QUAN TRỌNG - Khi người dùng yêu cầu xem/tìm ảnh:**
- Keywords: "cho tôi xem ảnh", "tìm ảnh", "ảnh của", "hình ảnh về", "show me", "find image"
- Trả lời ngắn gọn: "Đây là [số lượng] ảnh [địa điểm]!" (ví dụ: "Đây là 3 ảnh Cầu Rồng Đà Nẵng!")
- Hệ thống sẽ tự động tìm ảnh qua SerpAPI và hiển thị
- MẶC ĐỊNH: Gửi 3 ảnh nếu user không chỉ định số lượng
- Nếu user yêu cầu số lượng cụ thể (ví dụ: "cho tôi 5 ảnh", "tìm 1 ảnh"), trả lời theo số lượng đó
- Ví dụ:
  + User: "Cho tôi xem ảnh Cầu Rồng" → AI: "Đây là 3 ảnh Cầu Rồng Đà Nẵng!" (mặc định 3 ảnh)
  + User: "Tìm 5 ảnh Bà Nà Hills" → AI: "Đây là 5 ảnh Bà Nà Hills!" (theo yêu cầu 5 ảnh)
  + User: "Cho tôi 1 ảnh biển Mỹ Khê" → AI: "Đây là ảnh biển Mỹ Khê!" (theo yêu cầu 1 ảnh)`,
      });
    }

    // Add conversation history
    apiMessages.push(...messages);

    console.log('📤 Sending to OpenAI:', {
      messageCount: apiMessages.length,
      lastMessage: messages[messages.length - 1]?.content,
    });

    // Call OpenAI API
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini', // GPT-4o-mini: Fast, cost-effective, supports vision
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000, // Balanced for speed
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        timeout: 30000, // 30 seconds timeout
      },
    ).catch(err => {
      // Log detailed error for debugging
      console.error('❌ OpenAI API Error Details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        error: err.response?.data?.error,
        message: err.response?.data?.error?.message,
      });
      throw err;
    });

    const assistantMessage = response.data.choices[0]?.message?.content || '';

    console.log('✅ OpenAI response received:', {
      length: assistantMessage.length,
      preview: assistantMessage.substring(0, 50) + '...',
    });

    return {
      message: assistantMessage,
    };
  } catch (error: any) {
    console.error('❌ Error calling OpenAI API:', error);

    // Handle specific errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 401) {
        return {
          message: '',
          error: 'API key không hợp lệ. Vui lòng kiểm tra cấu hình.',
        };
      } else if (status === 429) {
        return {
          message: '',
          error: 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.',
        };
      } else if (status === 500) {
        return {
          message: '',
          error: 'Lỗi server OpenAI. Vui lòng thử lại sau.',
        };
      } else {
        return {
          message: '',
          error: `Lỗi API: ${errorData?.error?.message || 'Unknown error'}`,
        };
      }
    } else if (error.code === 'ECONNABORTED') {
      return {
        message: '',
        error: 'Timeout: Không nhận được phản hồi từ server.',
      };
    } else {
      return {
        message: '',
        error: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
      };
    }
  }
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
 * Search and get images from SerpAPI (Google Images)
 * @param query - Search query (e.g., "Cầu Rồng Đà Nẵng")
 * @param count - Number of images to fetch (default: 3)
 * @returns ImageGenerationResponse with image URLs or error
 */
export const searchImage = async (
  query: string,
  count: number = 3,
): Promise<ImageGenerationResponse> => {
  try {
    console.log(`🔍 Searching ${count} images via SerpAPI:`, query);

    // Call SerpAPI for Google Images search
    const response = await axios.get(SERPAPI_URL, {
      params: {
        engine: 'google_images',
        q: query,
        api_key: SERPAPI_KEY,
        num: count, // Get specified number of images
      },
      timeout: 10000,
    });

    console.log('📥 SerpAPI response:', response.data);

    // Extract images from results
    const images = response.data.images_results;

    if (!images || images.length === 0) {
      return {
        error: 'Không tìm thấy ảnh phù hợp.',
      };
    }

    // Get image URLs (original or thumbnail)
    const imageUrls = images
      .slice(0, count)
      .map((img: any) => img.original || img.thumbnail)
      .filter((url: string) => url); // Remove any undefined URLs

    console.log(`✅ ${imageUrls.length} images found via SerpAPI`);

    return {
      imageUrls,
    };
  } catch (error: any) {
    console.error('❌ Error searching image:', error);
    console.error('❌ Error response:', error.response?.data);

    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 401) {
        return {
          error: 'SerpAPI key không hợp lệ.',
        };
      } else if (status === 429) {
        return {
          error: 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.',
        };
      } else {
        return {
          error: `Lỗi tìm ảnh: ${errorData?.error || 'Unknown error'}`,
        };
      }
    } else if (error.code === 'ECONNABORTED') {
      return {
        error: 'Timeout: Tìm ảnh mất quá nhiều thời gian.',
      };
    } else {
      return {
        error: 'Không thể kết nối đến SerpAPI.',
      };
    }
  }
};

// Export extractImageCount for use in ChatbotScreen
export {extractImageCount};

/**
 * Detect if user wants to VIEW/FIND an existing image (use Unsplash)
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

