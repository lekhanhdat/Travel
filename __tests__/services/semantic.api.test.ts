/**
 * Unit Tests for Semantic Search API Service
 * @format
 */

import axios from 'axios';
import {
  searchSemantic,
  getSuggestions,
  chatWithRAG,
  clearChatSession,
  getSimilarItems,
  getRecommendations,
  storeMemory,
  getUserMemories,
  generateSessionId,
  SemanticSearchRequest,
  RAGChatRequest,
  StoreMemoryRequest,
} from '../../src/services/semantic.api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios.create to return our mocked axios instance
mockedAxios.create = jest.fn().mockReturnValue(mockedAxios);

describe('Semantic API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============ searchSemantic Tests ============
  describe('searchSemantic', () => {
    it('should return search results on success', async () => {
      const mockResponse = {
        data: {
          success: true,
          query: 'beach destinations',
          results: [
            {
              id: 1,  // Backend returns "id", not "entity_id"
              entity_type: 'location',
              title: 'Beautiful Beach',
              description: 'A sunny beach',
              score: 0.95,
              metadata: {title: 'Beautiful Beach', description: 'A sunny beach'},
            },
          ],
          total_count: 1,
          search_time_ms: 45.2,
          search_type: 'text',
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const request: SemanticSearchRequest = {
        query: 'beach destinations',
        limit: 10,
      };
      const result = await searchSemantic(request);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].entity_type).toBe('location');
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/search/semantic', request);
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {data: {error: 'Service unavailable'}},
      });

      const request: SemanticSearchRequest = {query: 'test'};
      const result = await searchSemantic(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Service unavailable');
      expect(result.results).toHaveLength(0);
    });

    it('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({code: 'ECONNABORTED'});

      const request: SemanticSearchRequest = {query: 'test'};
      const result = await searchSemantic(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout. Please try again.');
    });

    it('should handle no response errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({});

      const request: SemanticSearchRequest = {query: 'test'};
      const result = await searchSemantic(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error. Please check your connection.');
    });
  });

  // ============ getSuggestions Tests ============
  describe('getSuggestions', () => {
    it('should return suggestions on success', async () => {
      const mockResponse = {
        data: {suggestions: ['beach', 'beach resort', 'beach vacation']},
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await getSuggestions('bea', 5);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('beach');
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/search/suggestions', {
        params: {query: 'bea', limit: 5},
      });
    });

    it('should return empty array on error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await getSuggestions('test');

      expect(result).toEqual([]);
    });
  });

  // ============ chatWithRAG Tests ============
  describe('chatWithRAG', () => {
    it('should return RAG response with sources', async () => {
      const mockResponse = {
        data: {
          success: true,
          response: 'Da Nang has beautiful beaches...',
          sources: [
            {entity_type: 'location', entity_id: 1, title: 'Da Nang Beach', relevance_score: 0.9},
          ],
          session_id: 'session_123',
          suggested_actions: ['Learn more about My Khe Beach'],
        },
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const request: RAGChatRequest = {
        message: 'Tell me about beaches in Da Nang',
        session_id: 'session_123',
        user_id: 1,
      };
      const result = await chatWithRAG(request);

      expect(result.success).toBe(true);
      expect(result.response).toContain('Da Nang');
      expect(result.sources).toHaveLength(1);
      expect(result.suggested_actions).toHaveLength(1);
    });

    it('should handle chat errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({response: {data: {detail: 'Rate limited'}}});

      const request: RAGChatRequest = {message: 'test'};
      const result = await chatWithRAG(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limited');
    });
  });

  // ============ clearChatSession Tests ============
  describe('clearChatSession', () => {
    it('should return true on success', async () => {
      mockedAxios.post.mockResolvedValueOnce({data: {success: true}});

      const result = await clearChatSession('session_123');

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/chat/clear-session', {
        session_id: 'session_123',
      });
    });

    it('should return false on error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Server error'));

      const result = await clearChatSession('session_123');

      expect(result).toBe(false);
    });
  });

  // ============ getSimilarItems Tests ============
  describe('getSimilarItems', () => {
    it('should return similar items for location', async () => {
      const mockResponse = {
        data: {
          success: true,
          entity_type: 'location',
          entity_id: 1,
          similar_items: [
            {entity_type: 'location', entity_id: 2, name: 'Similar Beach', similarity_score: 0.85},
            {entity_type: 'location', entity_id: 3, name: 'Another Beach', similarity_score: 0.75},
          ],
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await getSimilarItems('location', 1, 5);

      expect(result.success).toBe(true);
      expect(result.similar_items).toHaveLength(2);
      expect(result.similar_items[0].similarity_score).toBe(0.85);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/similar/location/1', {params: {limit: 5}});
    });

    it('should return similar items for festival', async () => {
      const mockResponse = {
        data: {
          success: true,
          entity_type: 'festival',
          entity_id: 10,
          similar_items: [{entity_type: 'festival', entity_id: 11, name: 'Similar Festival', similarity_score: 0.9}],
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await getSimilarItems('festival', 10);

      expect(result.success).toBe(true);
      expect(result.entity_type).toBe('festival');
    });

    it('should handle errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce({response: {data: {error: 'Entity not found'}}});

      const result = await getSimilarItems('location', 999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Entity not found');
      expect(result.similar_items).toHaveLength(0);
    });
  });

  // ============ getRecommendations Tests ============
  describe('getRecommendations', () => {
    it('should return personalized recommendations', async () => {
      const mockResponse = {
        data: {
          success: true,
          user_id: 1,
          recommendations: [
            {entity_type: 'location', entity_id: 5, name: 'Recommended Place', reason: 'Based on your interests', score: 0.95},
            {entity_type: 'festival', entity_id: 3, name: 'Recommended Festival', reason: 'Similar to visited', score: 0.85},
          ],
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await getRecommendations(1, 10);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].reason).toBe('Based on your interests');
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/recommendations/1', {params: {limit: 10}});
    });

    it('should handle no recommendations', async () => {
      const mockResponse = {
        data: {
          success: true,
          user_id: 999,
          recommendations: [],
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await getRecommendations(999);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(0);
    });

    it('should handle errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Server error'));

      const result = await getRecommendations(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get recommendations');
    });
  });

  // ============ storeMemory Tests ============
  describe('storeMemory', () => {
    it('should store memory successfully', async () => {
      const mockResponse = {
        data: {success: true, memory_id: 123},
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const request: StoreMemoryRequest = {
        user_id: 1,
        memory_type: 'preference',
        content: 'User likes beaches',
        confidence: 0.9,
      };
      const result = await storeMemory(request);

      expect(result.success).toBe(true);
      expect(result.memory_id).toBe(123);
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/memory/store', request);
    });

    it('should handle store errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({response: {data: {error: 'Invalid data'}}});

      const request: StoreMemoryRequest = {
        user_id: 1,
        memory_type: 'interest',
        content: 'test',
      };
      const result = await storeMemory(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid data');
    });
  });

  // ============ getUserMemories Tests ============
  describe('getUserMemories', () => {
    it('should return user memories', async () => {
      const mockResponse = {
        data: {
          success: true,
          user_id: 1,
          memories: [
            {id: 1, userId: 1, memoryType: 'preference', content: 'Likes beaches', confidence: 0.9, createdAt: '2024-01-01'},
            {id: 2, userId: 1, memoryType: 'interest', content: 'History', confidence: 0.8, createdAt: '2024-01-02'},
          ],
          count: 2,
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await getUserMemories(1, undefined, 10);

      expect(result.success).toBe(true);
      expect(result.memories).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('should filter by memory type', async () => {
      const mockResponse = {
        data: {
          success: true,
          user_id: 1,
          memories: [{id: 1, userId: 1, memoryType: 'preference', content: 'test', confidence: 0.9, createdAt: '2024-01-01'}],
          count: 1,
        },
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await getUserMemories(1, 'preference');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/memory/user/1', {
        params: {limit: 10, memory_type: 'preference'},
      });
    });

    it('should handle errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Server error'));

      const result = await getUserMemories(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get memories');
    });
  });

  // ============ generateSessionId Tests ============
  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should include timestamp in session ID', () => {
      const before = Date.now();
      const id = generateSessionId();
      const after = Date.now();

      const timestamp = parseInt(id.split('_')[1], 10);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });
});

