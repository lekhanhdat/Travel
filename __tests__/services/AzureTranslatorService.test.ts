/**
 * Unit tests for AzureTranslatorService
 */

import {azureTranslator} from '../../src/services/translation/AzureTranslatorService';

// Mock fetch globally
global.fetch = jest.fn();

describe('AzureTranslatorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('translate', () => {
    it('should translate a single text', async () => {
      const mockResponse = [{translations: [{text: 'Xin chào', to: 'vi'}]}];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await azureTranslator.translate('Hello', 'vi', 'en');
      expect(result).toBe('Xin chào');
    });

    it('should return original text on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await azureTranslator.translate('Hello', 'vi', 'en');
      expect(result).toBe('Hello');
    });
  });

  describe('translateBatch', () => {
    it('should translate multiple texts', async () => {
      const mockResponse = [
        {translations: [{text: 'Xin chào', to: 'vi'}]},
        {translations: [{text: 'Tạm biệt', to: 'vi'}]},
      ];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await azureTranslator.translateBatch(['Hello', 'Goodbye'], 'vi', 'en');
      expect(result).toEqual(['Xin chào', 'Tạm biệt']);
    });

    it('should return empty array for empty input', async () => {
      const result = await azureTranslator.translateBatch([], 'vi', 'en');
      expect(result).toEqual([]);
    });

    it('should return original texts on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await azureTranslator.translateBatch(['Hello'], 'vi', 'en');
      expect(result).toEqual(['Hello']);
    });
  });

  describe('detectLanguage', () => {
    it('should detect language of text', async () => {
      const mockResponse = [{language: 'en', score: 1.0}];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await azureTranslator.detectLanguage('Hello world');
      expect(result).toBe('en');
    });

    it('should return "en" on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await azureTranslator.detectLanguage('Hello');
      expect(result).toBe('en');
    });
  });
});

