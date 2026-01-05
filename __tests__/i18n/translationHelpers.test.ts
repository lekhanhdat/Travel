import {
  getLocationTranslationKey,
  getFestivalTranslationKey,
  translateLocationField,
  translateFestivalField,
  translateWithFallback,
} from '../../src/utils/translationHelpers';

// Define types for mock implementation
type MockTOptions = {
  defaultValue?: string;
};

// Mock Translation Function (t)
const mockT = jest.fn();

describe('translationHelpers', () => {
  beforeEach(() => {
    mockT.mockClear();
    // Reset global __DEV__ if needed, but usually jest sets it based on config
  });

  describe('getLocationTranslationKey', () => {
    it('should generate correct key for string id', () => {
      expect(getLocationTranslationKey('1')).toBe('loc_1');
    });

    it('should generate correct key for number id', () => {
      expect(getLocationTranslationKey(1)).toBe('loc_1');
    });
  });

  describe('getFestivalTranslationKey', () => {
    it('should generate correct key for string id', () => {
      expect(getFestivalTranslationKey('1')).toBe('fest_1');
    });

    it('should generate correct key for number id', () => {
      expect(getFestivalTranslationKey(1)).toBe('fest_1');
    });
  });

  describe('translateLocationField', () => {
    it('should call t with correct key and fallback', () => {
      const locationId = 1;
      const field = 'name';
      const fallback = 'Default Name';
      const expectedKey = 'locations:loc_1.name';

      mockT.mockReturnValue('Translated Name');

      const result = translateLocationField(mockT, locationId, field, fallback);

      expect(mockT).toHaveBeenCalledWith(expectedKey, {defaultValue: fallback});
      expect(result).toBe('Translated Name');
    });

    it('should return fallback when t returns key (missing translation)', () => {
      const locationId = 2;
      const field = 'description';
      const fallback = 'Default Description';
      const expectedKey = 'locations:loc_2.description';

      // Simulate missing translation by returning the key (i18next behavior)
      mockT.mockReturnValue(expectedKey);

      // We need to verify translateWithFallback behavior which is used internally
      // But here we're mocking t, so let's rely on translateWithFallback implementation detail
      // translateWithFallback calls t(key, {defaultValue})
      // If t returns defaultValue (or key if defaultValue not passed, but here we pass it), that's what we get.
      // Wait, translateWithFallback implementation:
      // const defaultValue = fallback || key;
      // const translated = t(key, {defaultValue});
      // return translated;

      mockT.mockImplementation((_key: string, options: MockTOptions) => options.defaultValue);

      const result = translateLocationField(mockT, locationId, field, fallback);

      expect(mockT).toHaveBeenCalledWith(expectedKey, {defaultValue: fallback});
      expect(result).toBe(fallback);
    });
  });

  describe('translateFestivalField', () => {
    it('should call t with correct key and fallback', () => {
      const festivalId = 10;
      const field = 'name';
      const fallback = 'Default Festival';
      const expectedKey = 'festivals:fest_10.name';

      mockT.mockReturnValue('Translated Festival');

      const result = translateFestivalField(mockT, festivalId, field, fallback);

      expect(mockT).toHaveBeenCalledWith(expectedKey, {defaultValue: fallback});
      expect(result).toBe('Translated Festival');
    });
  });

  describe('translateWithFallback', () => {
    it('should return translated text when available', () => {
      const key = 'common:hello';
      const fallback = 'Hello';
      mockT.mockReturnValue('Xin chào');

      const result = translateWithFallback(mockT, key, fallback);

      expect(mockT).toHaveBeenCalledWith(key, {defaultValue: fallback});
      expect(result).toBe('Xin chào');
    });

    it('should return fallback when translation missing', () => {
      const key = 'common:missing';
      const fallback = 'Fallback Text';
      
      // i18next usually returns defaultValue if key is missing
      mockT.mockImplementation((_k: string, opts: MockTOptions) => opts.defaultValue);

      const result = translateWithFallback(mockT, key, fallback);

      expect(result).toBe(fallback);
    });

    it('should return key if no fallback and translation missing', () => {
      const key = 'common:missing_no_fallback';
      
      // i18next returns key if no translation and no defaultValue
      mockT.mockImplementation((k: string, opts: MockTOptions) => opts.defaultValue || k);

      const result = translateWithFallback(mockT, key);

      expect(result).toBe(key);
    });

    it('should warn in __DEV__ if translation is missing (returns key)', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const key = 'missing_key';
        
        // Ensure we are in DEV mode for this test (though jest sets it usually)
        // We can't easily change global.__DEV__ in readonly env, but Jest usually has it true.
        
        mockT.mockReturnValue(key); // Simulator returning key

        translateWithFallback(mockT, key, 'Some fallback');

        // Note: translateWithFallback logic: 
        // const translated = t(key, {defaultValue});
        // if (__DEV__ && translated === key) console.warn(...)
        // So if we passed a fallback, t returns fallback. translated !== key. No warn.
        // We need to simulate t returning KEY even if fallback provided? 
        // No, i18next returns defaultValue if present.
        // So warning only happens if translated === key.
        // That means either no fallback provided, OR fallback === key (unlikely).
        
        translateWithFallback(mockT, key); // No fallback
        
        expect(consoleSpy).toHaveBeenCalledWith(`Missing translation for key: ${key}`);
        
        consoleSpy.mockRestore();
    });

    it('should NOT warn if translation found', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const key = 'exists';
        mockT.mockReturnValue('Translated');

        translateWithFallback(mockT, key);

        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
  });
});
