import {env} from '../../utils/env';

const API_VERSION = '3.0';

interface TranslationResult {
  translations: Array<{text: string; to: string}>;
}

interface DetectionResult {
  language: string;
  score: number;
}

class AzureTranslatorService {
  private endpoint: string;
  private key: string;
  private region: string;

  constructor() {
    this.endpoint = env.AZURE_TRANSLATOR_ENDPOINT;
    this.key = env.AZURE_TRANSLATOR_KEY;
    this.region = env.AZURE_TRANSLATOR_REGION;
  }

  async translate(
    text: string,
    targetLang: string,
    sourceLang: string = 'en',
  ): Promise<string> {
    try {
      const results = await this.translateBatch([text], targetLang, sourceLang);
      return results[0] || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  async translateBatch(
    texts: string[],
    targetLang: string,
    sourceLang: string = 'en',
  ): Promise<string[]> {
    if (!texts.length) return [];
    if (!this.key) {
      console.warn('Azure Translator key not configured');
      return texts;
    }

    try {
      const url = `${this.endpoint}/translate?api-version=${API_VERSION}&from=${sourceLang}&to=${targetLang}`;
      const body = texts.map(text => ({text}));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.key,
          'Ocp-Apim-Subscription-Region': this.region,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: TranslationResult[] = await response.json();
      return data.map((item, i) => item.translations[0]?.text || texts[i]);
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts;
    }
  }

  async detectLanguage(text: string): Promise<string> {
    if (!this.key) return 'en';

    try {
      const url = `${this.endpoint}/detect?api-version=${API_VERSION}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.key,
          'Ocp-Apim-Subscription-Region': this.region,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{text}]),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: DetectionResult[] = await response.json();
      return data[0]?.language || 'en';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }
}

export const azureTranslator = new AzureTranslatorService();
export default azureTranslator;

