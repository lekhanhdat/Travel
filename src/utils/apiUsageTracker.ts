/**
 * API Usage Tracker
 * Tracks frontend API calls for monitoring and cost awareness
 * Complements backend-side OpenAI usage tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============ Types ============

interface APICallRecord {
  endpoint: string;
  timestamp: number;
  success: boolean;
  responseTime: number;
  cached: boolean;
}

interface UsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  cachedCalls: number;
  averageResponseTime: number;
  callsByEndpoint: Record<string, number>;
  lastReset: number;
}

interface DailyUsage {
  date: string;
  semanticSearchCalls: number;
  ragChatCalls: number;
  similarItemsCalls: number;
  recommendationsCalls: number;
  memoryCalls: number;
}

// ============ Constants ============

const STORAGE_KEY = '@api_usage_stats';
const DAILY_USAGE_KEY = '@api_daily_usage';
const MAX_RECORDS = 1000;

// Alert thresholds (per day)
const ALERT_THRESHOLDS = {
  semanticSearch: 100,
  ragChat: 50,
  similarItems: 200,
  recommendations: 100,
  memory: 50,
};

// ============ Tracker Class ============

class APIUsageTracker {
  private records: APICallRecord[] = [];
  private dailyUsage: DailyUsage | null = null;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedUsage = await AsyncStorage.getItem(DAILY_USAGE_KEY);
      if (storedUsage) {
        this.dailyUsage = JSON.parse(storedUsage);
        // Reset if it's a new day
        const today = new Date().toISOString().split('T')[0];
        if (this.dailyUsage?.date !== today) {
          this.dailyUsage = this.createEmptyDailyUsage(today);
        }
      } else {
        this.dailyUsage = this.createEmptyDailyUsage(new Date().toISOString().split('T')[0]);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize API usage tracker:', error);
      this.dailyUsage = this.createEmptyDailyUsage(new Date().toISOString().split('T')[0]);
      this.initialized = true;
    }
  }

  private createEmptyDailyUsage(date: string): DailyUsage {
    return {
      date,
      semanticSearchCalls: 0,
      ragChatCalls: 0,
      similarItemsCalls: 0,
      recommendationsCalls: 0,
      memoryCalls: 0,
    };
  }

  async trackCall(
    endpoint: string,
    success: boolean,
    responseTime: number,
    cached: boolean = false,
  ): Promise<void> {
    await this.initialize();

    const record: APICallRecord = {
      endpoint,
      timestamp: Date.now(),
      success,
      responseTime,
      cached,
    };

    this.records.push(record);
    if (this.records.length > MAX_RECORDS) {
      this.records = this.records.slice(-MAX_RECORDS);
    }

    // Update daily usage
    if (this.dailyUsage) {
      if (endpoint.includes('search/semantic')) {
        this.dailyUsage.semanticSearchCalls++;
      } else if (endpoint.includes('chat/rag')) {
        this.dailyUsage.ragChatCalls++;
      } else if (endpoint.includes('similar')) {
        this.dailyUsage.similarItemsCalls++;
      } else if (endpoint.includes('recommendations')) {
        this.dailyUsage.recommendationsCalls++;
      } else if (endpoint.includes('memory')) {
        this.dailyUsage.memoryCalls++;
      }

      await this.saveDailyUsage();
    }
  }

  private async saveDailyUsage(): Promise<void> {
    try {
      await AsyncStorage.setItem(DAILY_USAGE_KEY, JSON.stringify(this.dailyUsage));
    } catch (error) {
      console.error('Failed to save daily usage:', error);
    }
  }

  getDailyUsage(): DailyUsage | null {
    return this.dailyUsage;
  }

  checkThresholds(): string[] {
    const warnings: string[] = [];
    if (!this.dailyUsage) return warnings;

    if (this.dailyUsage.semanticSearchCalls >= ALERT_THRESHOLDS.semanticSearch) {
      warnings.push(`Semantic search calls (${this.dailyUsage.semanticSearchCalls}) exceeded threshold`);
    }
    if (this.dailyUsage.ragChatCalls >= ALERT_THRESHOLDS.ragChat) {
      warnings.push(`RAG chat calls (${this.dailyUsage.ragChatCalls}) exceeded threshold`);
    }
    return warnings;
  }

  getStats(): UsageStats {
    const callsByEndpoint: Record<string, number> = {};
    let totalResponseTime = 0;
    let successfulCalls = 0;
    let cachedCalls = 0;

    for (const record of this.records) {
      callsByEndpoint[record.endpoint] = (callsByEndpoint[record.endpoint] || 0) + 1;
      totalResponseTime += record.responseTime;
      if (record.success) successfulCalls++;
      if (record.cached) cachedCalls++;
    }

    return {
      totalCalls: this.records.length,
      successfulCalls,
      failedCalls: this.records.length - successfulCalls,
      cachedCalls,
      averageResponseTime: this.records.length > 0 ? totalResponseTime / this.records.length : 0,
      callsByEndpoint,
      lastReset: this.dailyUsage?.date ? new Date(this.dailyUsage.date).getTime() : Date.now(),
    };
  }
}

// Singleton instance
export const apiUsageTracker = new APIUsageTracker();

