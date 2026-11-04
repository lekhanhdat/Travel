import i18n from '../../src/i18n';
import {
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

  describe('catalog fields come from the API', () => {
    afterEach(async () => {await i18n.changeLanguage('vi');});

    it('returns the API value without calling t', () => {
      expect(translateLocationField(mockT, 1, 'name', 'Tên từ API')).toBe('Tên từ API');
      expect(translateLocationField(mockT, 1, 'advise', 'Lời khuyên', 0)).toBe('Lời khuyên');
      expect(translateFestivalField(mockT, 10, 'location', '')).toBe('');
      expect(mockT).not.toHaveBeenCalled();
    });

    it.each(['vi', 'en'])('shows the API name for an id that collides with an old static key (%s)', async lng => {
      // Old vi/locations.json mapped loc_1 to a different place than API id 1.
      await i18n.changeLanguage(lng);
      const t = i18n.t.bind(i18n);
      expect(translateLocationField(t, 1, 'name', 'An Phú Farm')).toBe('An Phú Farm');
      expect(translateFestivalField(t, 1, 'name', 'Lễ hội từ API')).toBe('Lễ hội từ API');
      expect(i18n.hasResourceBundle(lng, 'locations')).toBe(false);
      expect(i18n.hasResourceBundle(lng, 'festivals')).toBe(false);
    });

    // P11 (D1): English content lives in the record (`content_en`, Neon), field by field.
    it('uses content_en in English and falls back to Vietnamese per missing field', async () => {
      const location = {name: 'Chùa Linh Ứng', content_en: {name: 'Linh Ung Pagoda', advise: ['Dress modestly', '  ']}};
      const festival = {content_en: {event_time: 'June every year'}};
      expect(translateLocationField(mockT, location, 'name', location.name)).toBe('Chùa Linh Ứng');
      await i18n.changeLanguage('en');
      expect(translateLocationField(mockT, location, 'name', location.name)).toBe('Linh Ung Pagoda');
      expect(translateLocationField(mockT, location, 'description', 'Mô tả')).toBe('Mô tả');
      expect(translateLocationField(mockT, location, 'advise', 'Ăn mặc kín đáo', 0)).toBe('Dress modestly');
      expect(translateLocationField(mockT, location, 'advise', 'Lời khuyên 2', 1)).toBe('Lời khuyên 2');
      expect(translateLocationField(mockT, location, 'advise', 'Lời khuyên 3', 2)).toBe('Lời khuyên 3');
      expect(translateFestivalField(mockT, festival, 'event_time', 'Tháng 6 hàng năm')).toBe('June every year');
      expect(translateFestivalField(mockT, {}, 'name', 'Tên')).toBe('Tên');
      expect(mockT).not.toHaveBeenCalled();
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
