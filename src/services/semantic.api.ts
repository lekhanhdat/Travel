/**
 * Semantic Search API Service
 * Provides TypeScript functions for all semantic search endpoints
 * Includes query caching for performance optimization
 * Includes API usage tracking for cost monitoring
 */

import axios from 'axios';
import {SERVER_URL} from '../utils/configs';
import {apiUsageTracker} from '../utils/apiUsageTracker';

// ============ Cache Configuration ============

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // 5 minutes default
  }

  private generateKey(prefix: string, params: any): string {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  get<T>(prefix: string, params: any): T | null {
    const key = this.generateKey(prefix, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(prefix: string, params: any, data: T, ttl?: number): void {
    const key = this.generateKey(prefix, params);

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttl || this.defaultTTL),
    });
  }

  invalidate(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): {size: number; maxSize: number} {
    return {size: this.cache.size, maxSize: this.maxSize};
  }
}

// Singleton cache instance
const queryCache = new QueryCache(100, 5 * 60 * 1000); // 100 entries, 5 min TTL

// Export cache controls
export const cacheControls = {
  invalidateSearch: () => queryCache.invalidate('search'),
  invalidateSimilar: () => queryCache.invalidate('similar'),
  invalidateRecommendations: () => queryCache.invalidate('recommendations'),
  invalidateAll: () => queryCache.invalidate(),
  getStats: () => queryCache.getStats(),
};

// ============ Debounce Utility ============

type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFn;
}

// Pre-configured debounced suggestions function (300ms delay)
let pendingSuggestionsCallback: ((suggestions: string[]) => void) | null = null;

export const debouncedGetSuggestions = debounce(
  async (query: string, limit: number, callback: (suggestions: string[]) => void) => {
    pendingSuggestionsCallback = callback;
    const suggestions = await getSuggestions(query, limit);
    if (pendingSuggestionsCallback === callback) {
      callback(suggestions);
    }
  },
  300,
);

// ============ Types & Interfaces ============

export type EntityType = 'location' | 'festival' | 'item';

export interface SemanticSearchRequest {
  query: string;
  entity_types?: EntityType[];
  top_k?: number;  // Backend expects 'top_k', NOT 'limit' - number of results to return
  min_score?: number;
}

export interface SearchResult {
  id: number;  // Backend returns "id", not "entity_id"
  entity_type: EntityType;
  title: string;
  description?: string;
  score: number;
  metadata: {
    title?: string;
    description?: string;
    image_url?: string;
    [key: string]: any;
  };
  image_url?: string;
  location?: string;
}

export interface SemanticSearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  total_count: number;  // Backend returns "total_count", not "total"
  search_time_ms: number;
  search_type: string;
  error?: string;
}

export interface RAGChatRequest {
  message: string;  // Backend expects 'message', not 'query'
  session_id?: string;
  user_id?: number;
  include_sources?: boolean;
}

export interface RAGSource {
  entity_type: EntityType;
  entity_id: number;
  title: string;
  relevance_score: number;
}

/**
 * Suggested action from RAG response (matches backend SuggestedAction model)
 */
export interface SuggestedAction {
  action_type: string;  // 'navigate', 'search', etc.
  label: string;        // Display label for the action
  payload: Record<string, any>;  // Action payload data
}

export interface RAGChatResponse {
  success: boolean;
  response: string;
  sources: RAGSource[];
  session_id: string;
  suggested_actions?: SuggestedAction[];  // Changed from string[] to SuggestedAction[]
  error?: string;
}

export interface SimilarItem {
  entity_type: EntityType;
  entity_id: number;
  name: string;
  similarity_score: number;
  description?: string;
  image_url?: string;
}

export interface SimilarItemsResponse {
  success: boolean;
  entity_type: EntityType;
  entity_id: number;
  similar_items: SimilarItem[];
  error?: string;
}

export interface Recommendation {
  entity_type: EntityType;
  entity_id: number;
  name: string;
  reason: string;
  score: number;
  description?: string;
  images?: string[];
}

export interface RecommendationsResponse {
  success: boolean;
  user_id: number;
  recommendations: Recommendation[];
  error?: string;
}

export type MemoryType = 'preference' | 'interest' | 'visited' | 'dislike' | 'context';

export interface StoreMemoryRequest {
  user_id: number;
  memory_type: MemoryType;
  content: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface UserMemory {
  id: number;
  userId: number;
  memoryType: MemoryType;
  content: string;
  confidence: number;
  createdAt: string;
}

export interface UserMemoriesResponse {
  success: boolean;
  user_id: number;
  memories: UserMemory[];
  count: number;
  error?: string;
}

// ============ API Configuration ============

const API_TIMEOUT = 30000; // 30 seconds

const apiClient = axios.create({
  baseURL: SERVER_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ Helper Functions ============

const handleApiError = (error: any, defaultMessage: string): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }
  return defaultMessage;
};

// ============ API Functions ============

/**
 * Perform semantic search across entities (with caching and usage tracking)
 */
export const searchSemantic = async (
  request: SemanticSearchRequest,
  useCache: boolean = true,
): Promise<SemanticSearchResponse> => {
  const startTime = Date.now();

  // Check cache first
  if (useCache) {
    const cached = queryCache.get<SemanticSearchResponse>('search', request);
    if (cached) {
      apiUsageTracker.trackCall('/api/v1/search/semantic', true, Date.now() - startTime, true);
      return cached;
    }
  }

  try {
    const response = await apiClient.post('/api/v1/search/semantic', request);
    const result = response.data;

    // Track API call
    apiUsageTracker.trackCall('/api/v1/search/semantic', result.success, Date.now() - startTime, false);

    // Cache successful results
    if (result.success && useCache) {
      queryCache.set('search', request, result, 3 * 60 * 1000); // 3 min TTL for search
    }

    return result;
  } catch (error: any) {
    console.error('❌ Semantic search error:', error);
    return {
      success: false,
      query: request.query,
      results: [],
      total_count: 0,
      search_time_ms: 0,
      search_type: 'text',
      error: handleApiError(error, 'Search failed'),
    };
  }
};

/**
 * Get search suggestions (with debounce-friendly caching)
 */
export const getSuggestions = async (
  query: string,
  limit: number = 5,
): Promise<string[]> => {
  // Check cache first (short TTL for suggestions)
  const cached = queryCache.get<string[]>('suggestions', {query, limit});
  if (cached) {
    return cached;
  }

  try {
    const response = await apiClient.get('/api/v1/search/suggestions', {
      params: {query, limit},
    });
    const suggestions = response.data.suggestions || [];

    // Cache for 1 minute
    queryCache.set('suggestions', {query, limit}, suggestions, 60 * 1000);

    return suggestions;
  } catch (error: any) {
    console.error('❌ Suggestions error:', error);
    return [];
  }
};

/**
 * Send message to RAG-enhanced chatbot (with usage tracking)
 */
export const chatWithRAG = async (
  request: RAGChatRequest,
): Promise<RAGChatResponse> => {
  const startTime = Date.now();
  try {
    const response = await apiClient.post('/api/v1/chat/rag', request);
    const result = response.data;

    // Track API call (RAG calls are expensive - OpenAI embeddings + GPT)
    apiUsageTracker.trackCall('/api/v1/chat/rag', result.success, Date.now() - startTime, false);

    return result;
  } catch (error: any) {
    console.error('❌ RAG chat error:', error);
    apiUsageTracker.trackCall('/api/v1/chat/rag', false, Date.now() - startTime, false);
    return {
      success: false,
      response: '',
      sources: [],
      session_id: request.session_id || '',
      error: handleApiError(error, 'Chat failed'),
    };
  }
};

/**
 * Clear chat session history
 */
export const clearChatSession = async (sessionId: string): Promise<boolean> => {
  try {
    // Backend expects session_id as query parameter, not in request body
    await apiClient.post(`/api/v1/chat/clear-session?session_id=${encodeURIComponent(sessionId)}`);
    return true;
  } catch (error: any) {
    console.error('❌ Clear session error:', error);
    return false;
  }
};

/**
 * Get similar items for an entity (with caching)
 */
export const getSimilarItems = async (
  entityType: EntityType,
  entityId: number,
  limit: number = 5,
  useCache: boolean = true,
): Promise<SimilarItemsResponse> => {
  const cacheParams = {entityType, entityId, limit};

  // Check cache first
  if (useCache) {
    const cached = queryCache.get<SimilarItemsResponse>('similar', cacheParams);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await apiClient.get(
      `/api/v1/similar/${entityType}/${entityId}`,
      {params: {limit}},
    );
    const result = response.data;

    // Cache successful results for 10 minutes (similar items don't change often)
    if (result.success && useCache) {
      queryCache.set('similar', cacheParams, result, 10 * 60 * 1000);
    }

    return result;
  } catch (error: any) {
    console.error('❌ Similar items error:', error);
    return {
      success: false,
      entity_type: entityType,
      entity_id: entityId,
      similar_items: [],
      error: handleApiError(error, 'Failed to get similar items'),
    };
  }
};

/**
 * Get personalized recommendations for a user (with caching)
 */
export const getRecommendations = async (
  userId: number,
  limit: number = 10,
  useCache: boolean = true,
): Promise<RecommendationsResponse> => {
  const cacheParams = {userId, limit};

  // Check cache first
  if (useCache) {
    const cached = queryCache.get<RecommendationsResponse>('recommendations', cacheParams);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await apiClient.get(`/api/v1/recommendations/${userId}`, {
      params: {limit},
    });
    const result = response.data;

    // Cache for 5 minutes (recommendations can change based on user activity)
    if (result.success && useCache) {
      queryCache.set('recommendations', cacheParams, result, 5 * 60 * 1000);
    }

    return result;
  } catch (error: any) {
    console.error('❌ Recommendations error:', error);
    return {
      success: false,
      user_id: userId,
      recommendations: [],
      error: handleApiError(error, 'Failed to get recommendations'),
    };
  }
};

/**
 * Store a user memory/preference
 */
export const storeMemory = async (
  request: StoreMemoryRequest,
): Promise<{success: boolean; memory_id?: number; error?: string}> => {
  try {
    const response = await apiClient.post('/api/v1/memory/store', request);
    return response.data;
  } catch (error: any) {
    console.error('❌ Store memory error:', error);
    return {
      success: false,
      error: handleApiError(error, 'Failed to store memory'),
    };
  }
};

/**
 * Get user memories
 */
export const getUserMemories = async (
  userId: number,
  memoryType?: MemoryType,
  limit: number = 10,
): Promise<UserMemoriesResponse> => {
  try {
    const params: any = {limit};
    if (memoryType) {
      params.memory_type = memoryType;
    }
    const response = await apiClient.get(`/api/v1/memory/user/${userId}`, {params});
    return response.data;
  } catch (error: any) {
    console.error('❌ Get memories error:', error);
    return {
      success: false,
      user_id: userId,
      memories: [],
      count: 0,
      error: handleApiError(error, 'Failed to get memories'),
    };
  }
};

/**
 * Generate a unique session ID for chat
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

