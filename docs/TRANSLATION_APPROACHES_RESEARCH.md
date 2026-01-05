# Translation Approaches Research & Planning Document
## Vietnamese-English Real-Time Translation for Travel Application

**Document Version:** 3.0 (Unified JSON Approach)
**Date:** January 4, 2026
**Author:** Development Team
**Status:** ✅ APPROVED FOR IMPLEMENTATION

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Final Decision: Unified JSON Architecture](#final-decision-unified-json-architecture)
3. [Current Implementation Analysis](#current-implementation-analysis)
4. [Approach 1: i18n (Internationalization)](#approach-1-i18n-internationalization)
5. [Approach 2: OpenAI API](#approach-2-openai-api)
6. [Approach 3: Azure Translator API](#approach-3-azure-translator-api)
7. [Comparison Matrix](#comparison-matrix)
8. [Detailed Implementation Plan](#detailed-implementation-plan)
9. [OpenAI Pre-Translation Scripts](#openai-pre-translation-scripts)
10. [NocoDB Data Pre-Translation](#nocodb-data-pre-translation)
11. [Implementation Task List](#implementation-task-list)
12. [Timeline & Phases](#timeline--phases)
13. [Conclusion](#conclusion)

---

## Executive Summary

This document provides the **final implementation plan** for Vietnamese-English bidirectional translation in the Travel application.

### ✅ Final Decision: Unified JSON Approach

**All pre-translations (both Static UI and NocoDB data) are stored as JSON files bundled with the app.**

| Component | Technology | Storage | Runtime |
|-----------|------------|---------|---------|
| **Static UI** | i18n (react-i18next) | JSON files (`common.json`) | ✅ Runtime (0ms) |
| **NocoDB Data** | i18n (react-i18next) | JSON files (`locations.json`, `festivals.json`) | ✅ Runtime (0ms) |
| **New Dynamic Content** | Azure Translator API | Memory cache | ✅ Runtime (50-200ms) |
| **Pre-Translation Tool** | OpenAI API | N/A | ❌ Development only |

### Key Architecture Decisions

```
┌─────────────────────────────────────────────────────────────────┐
│                    RUNTIME TRANSLATION                          │
├─────────────────────────────────────────────────────────────────┤
│  Static UI Content ──────► i18n JSON files ──────► 0ms         │
│  NocoDB Data (existing) ─► i18n JSON files ──────► 0ms         │
│  New Dynamic Content ────► Azure Translator ─────► 50-200ms    │
├─────────────────────────────────────────────────────────────────┤
│                    DEVELOPMENT PHASE ONLY                       │
├─────────────────────────────────────────────────────────────────┤
│  Static UI Strings ──────► OpenAI API ───────────► common.json │
│  NocoDB Locations ───────► OpenAI API ───────────► locations.json │
│  NocoDB Festivals ───────► OpenAI API ───────────► festivals.json │
└─────────────────────────────────────────────────────────────────┘
```

### Unified JSON File Structure

```
src/i18n/locales/
├── en/
│   ├── common.json      # Static UI strings
│   ├── locations.json   # NocoDB locations (pre-translated)
│   └── festivals.json   # NocoDB festivals (pre-translated)
└── vi/
    ├── common.json      # Static UI strings (Vietnamese)
    ├── locations.json   # NocoDB locations (Vietnamese)
    └── festivals.json   # NocoDB festivals (Vietnamese)
```

### What's NOT Included
- ❌ Chatbot response translation (excluded per requirements)
- ❌ OpenAI API calls during app runtime
- ❌ AsyncStorage cache for pre-translations (simplified to JSON files)

---

## Final Decision: Unified JSON Architecture

### Why Unified JSON Files?

| Benefit | Description |
|---------|-------------|
| **Simplicity** | Single storage method for all pre-translations |
| **Performance** | 0ms latency for all bundled content |
| **Reliability** | No risk of cache being cleared by user |
| **Offline Support** | 100% offline capability for pre-translated content |
| **Consistency** | Same access pattern for UI and NocoDB data |

### Runtime Architecture (Production)

| Content Type | Source | Translation Method | Latency | Cost |
|--------------|--------|-------------------|---------|------|
| Button labels | `common.json` | react-i18next | 0ms | Free |
| Navigation text | `common.json` | react-i18next | 0ms | Free |
| Error messages | `common.json` | react-i18next | 0ms | Free |
| Form placeholders | `common.json` | react-i18next | 0ms | Free |
| Location descriptions | `locations.json` | react-i18next | 0ms | Free |
| Festival information | `festivals.json` | react-i18next | 0ms | Free |
| **New content (not pre-translated)** | NocoDB | Azure Translator | 50-200ms | $10/1M chars |

### Development Phase (One-Time)

| Task | Tool | Output | When |
|------|------|--------|------|
| Generate UI translations | OpenAI GPT-4 | `vi/common.json` | Before release |
| Pre-translate Locations | OpenAI GPT-4 | `en/locations.json` + `vi/locations.json` | Before release |
| Pre-translate Festivals | OpenAI GPT-4 | `en/festivals.json` + `vi/festivals.json` | Before release |
| Quality review | Human | Verified JSON files | Before release |

---

## Current Implementation Analysis

### Existing Translation Infrastructure

The Travel app already has a sophisticated translation system in place:

```
src/
├── context/TranslationContext.tsx    # Main translation context provider
├── hooks/useTranslation.ts           # Translation hook for components
├── services/translation/
│   ├── AzureTranslatorService.ts     # Azure API integration
│   ├── TranslationCache.ts           # LRU memory cache (1000 items, 60min TTL)
│   ├── TranslationPersistentCache.ts # AsyncStorage persistent cache
│   ├── TranslationQueue.ts           # Batch processing (100 items, 50ms delay)
│   └── OfflineFallback.ts            # Essential UI strings for offline use
├── data/baseTranslations.ts          # Translation key mappings
├── config/featureFlags.ts            # Feature toggles for translation
└── hoc/withAzureTranslation.tsx      # HOC for class components
```

### Current Features
- ✅ Azure Translator API integration (already configured)
- ✅ Batch translation with queue system
- ✅ Multi-layer caching (memory + persistent)
- ✅ Offline fallback for essential UI strings
- ✅ Language switching (Vietnamese/English)
- ✅ Feature flags for gradual rollout

### Current Limitations
- ❌ No structured i18n file system (JSON translation files)
- ❌ Static translations hardcoded in TranslationContext
- ❌ OpenAI API not utilized for translation
- ❌ No TypeScript type safety for translation keys

---

## Approach 1: i18n (Internationalization)

### Overview
Traditional internationalization using static JSON translation files with libraries like `react-i18next` or `react-intl`.

### Technical Implementation

```typescript
// Example i18n structure
// src/i18n/locales/en.json
{
  "common": {
    "back": "Back",
    "save": "Save",
    "cancel": "Cancel"
  },
  "home": {
    "welcome": "Welcome to Travel App",
    "popularPlaces": "Popular Places"
  }
}

// src/i18n/locales/vi.json
{
  "common": {
    "back": "Quay lại",
    "save": "Lưu",
    "cancel": "Hủy"
  },
  "home": {
    "welcome": "Chào mừng đến với Travel App",
    "popularPlaces": "Địa điểm phổ biến"
  }
}
```

### Performance Characteristics

| Metric | Value |
|--------|-------|
| **Latency** | 0ms (instant) |
| **Bundle Size** | ~18-19KB (react-i18next) |
| **Memory Usage** | Low (loaded once) |
| **Offline Support** | Full |

### Pros
1. **Zero latency** - Translations loaded at app startup
2. **No API costs** - All translations bundled with app
3. **Perfect accuracy** - Human-curated translations
4. **Full offline support** - Works without internet
5. **TypeScript support** - Auto-generated types for keys
6. **Namespace support** - Lazy loading by feature/screen
7. **Industry standard** - Well-documented, large community

### Cons
1. **Static only** - Cannot translate dynamic/user content
2. **Manual maintenance** - Requires updating JSON files
3. **App updates required** - New translations need app release
4. **Scalability limits** - Large translation files increase bundle
5. **No context awareness** - Same translation regardless of context

### Best Use Cases
- Navigation labels
- Button text
- Form labels and placeholders
- Error messages
- Static headings and titles
- Settings and preferences

### Library Comparison: react-i18next vs react-intl

| Feature | react-i18next | react-intl |
|---------|---------------|------------|
| **Bundle Size** | ~18KB gzipped | ~19KB gzipped |
| **Message Format** | JSON / ICU / MF2 | ICU MessageFormat |
| **Lazy Loading** | ✅ Built-in | ❌ Manual setup |
| **TypeScript** | ✅ Excellent | ✅ Good |
| **Namespaces** | ✅ Yes | ❌ No |
| **Plugin Ecosystem** | ✅ Extensive | ⚠️ Limited |

**Recommendation**: `react-i18next` for its flexibility and namespace support.

---

## Approach 2: OpenAI API

### Overview
Using OpenAI's GPT models for translation provides contextual, high-quality translations with understanding of nuance and cultural context.

### Technical Implementation

```typescript
// OpenAI Translation Service
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

async function translateWithOpenAI(
  text: string,
  targetLang: 'vi' | 'en',
  context?: string
): Promise<string> {
  const systemPrompt = `You are a professional translator specializing in Vietnamese-English translation for a travel application.
  Translate naturally while preserving:
  - Place names (keep original or provide both)
  - Cultural context
  - Tourism-specific terminology
  Target language: ${targetLang === 'vi' ? 'Vietnamese' : 'English'}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Cost-effective for translation
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Translate: "${text}"${context ? `\nContext: ${context}` : ''}` }
    ],
    temperature: 0.3, // Lower for consistent translations
    max_tokens: 1000
  });

  return response.choices[0].message.content || text;
}
```

### Performance Characteristics

| Metric | GPT-4o-mini | GPT-4o | GPT-4.1 |
|--------|-------------|--------|---------|
| **Latency** | 500-1000ms | 1000-2000ms | 800-1500ms |
| **Cost (1M tokens)** | ~$0.15 input / $0.60 output | ~$2.50 input / $10 output | ~$2 input / $8 output |
| **Quality** | Very Good | Excellent | Excellent |
| **Context Window** | 128K | 128K | 1M |

### Pricing Estimate (Travel App)

| Usage Scenario | Monthly Volume | Estimated Cost |
|----------------|----------------|----------------|
| Light (1K users) | ~500K tokens | $0.30 - $5 |
| Medium (10K users) | ~5M tokens | $3 - $50 |
| Heavy (100K users) | ~50M tokens | $30 - $500 |

### Pros
1. **Contextual understanding** - Understands travel/tourism context
2. **Cultural adaptation** - Adapts idioms and expressions
3. **Handles ambiguity** - Resolves context-dependent meanings
4. **Multi-sentence coherence** - Maintains consistency across paragraphs
5. **Custom instructions** - Can be tuned for travel domain
6. **Handles complex content** - Reviews, descriptions, user content

### Cons
1. **High latency** - 500-2000ms per request
2. **Higher cost** - More expensive than dedicated MT APIs
3. **Rate limits** - API throttling under heavy load
4. **Inconsistency** - May vary slightly between calls
5. **Overkill for simple text** - Unnecessary for "Back" or "Save"
6. **No batch API** - Must process sequentially or parallel

### Best Use Cases
- Long-form content (location descriptions)
- User reviews with context
- Chatbot conversations
- Content requiring cultural adaptation
- Complex sentences with idioms

---

## Approach 3: Azure Translator API

### Overview
Microsoft's Neural Machine Translation service optimized for speed and scale, already integrated in the Travel app.

### Current Implementation (Already in Codebase)

```typescript
// src/services/translation/AzureTranslatorService.ts
class AzureTranslatorService {
  async translateBatch(
    texts: string[],
    targetLang: string,
    sourceLang: string = 'en'
  ): Promise<string[]> {
    const url = `${this.endpoint}/translate?api-version=3.0&from=${sourceLang}&to=${targetLang}`;
    const body = texts.map(text => ({ text }));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.key,
        'Ocp-Apim-Subscription-Region': this.region,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return data.map((item, i) => item.translations[0]?.text || texts[i]);
  }
}
```

### Performance Characteristics

| Metric | Value |
|--------|-------|
| **Latency** | 50-200ms (single), 100-300ms (batch) |
| **Batch Size** | Up to 100 texts per request |
| **Max Characters** | 50,000 per request |
| **Languages** | 130+ supported |
| **Vietnamese Quality** | Very Good (Neural MT) |

### Pricing (Azure Translator)

| Tier | Price | Free Allowance |
|------|-------|----------------|
| **Free (F0)** | $0 | 2M characters/month |
| **Standard (S1)** | $10/1M characters | None |
| **Document Translation** | $15/1M characters | None |

### Monthly Cost Estimate

| Usage Level | Characters/Month | Cost |
|-------------|------------------|------|
| Light | < 2M | **FREE** |
| Medium | 5M | $30 |
| Heavy | 20M | $180 |

### Pros
1. **Very low latency** - 50-200ms response time
2. **Batch processing** - 100 texts per request
3. **Cost-effective** - $10/1M characters + 2M free
4. **High availability** - 99.9% SLA
5. **Already integrated** - Working in current codebase
6. **Language detection** - Auto-detect source language
7. **Neural MT quality** - Continuously improving

### Cons
1. **Less contextual** - Doesn't understand travel domain deeply
2. **Literal translations** - May miss cultural nuances
3. **No customization** - Cannot fine-tune for travel terminology
4. **Character-based pricing** - Long texts cost more
5. **API dependency** - Requires internet connection

### Best Use Cases
- Dynamic content from database
- Location names and addresses
- Short descriptions
- Real-time UI text not in i18n files
- Bulk translation of content

---

## Comparison Matrix

### Feature Comparison

| Feature | i18n | OpenAI API | Azure Translator |
|---------|------|------------|------------------|
| **Latency** | ⭐⭐⭐⭐⭐ 0ms | ⭐⭐ 500-2000ms | ⭐⭐⭐⭐ 50-200ms |
| **Translation Quality** | ⭐⭐⭐⭐⭐ Perfect | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Very Good |
| **Cost** | ⭐⭐⭐⭐⭐ Free | ⭐⭐ High | ⭐⭐⭐⭐ Low |
| **Dynamic Content** | ⭐ No | ⭐⭐⭐⭐⭐ Yes | ⭐⭐⭐⭐⭐ Yes |
| **Offline Support** | ⭐⭐⭐⭐⭐ Full | ⭐ None | ⭐⭐ Cached only |
| **Batch Processing** | N/A | ⭐⭐ Limited | ⭐⭐⭐⭐⭐ 100/request |
| **Context Awareness** | ⭐⭐ Static | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Limited |
| **Setup Complexity** | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Easy | ⭐⭐⭐⭐⭐ Already done |
| **Maintenance** | ⭐⭐ Manual | ⭐⭐⭐⭐⭐ None | ⭐⭐⭐⭐⭐ None |
| **TypeScript Support** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐ Good |

### Cost Comparison (10,000 Monthly Active Users)

| Approach | Estimated Monthly Cost | Notes |
|----------|------------------------|-------|
| **i18n** | $0 | One-time translation effort |
| **OpenAI (GPT-4o-mini)** | $30-100 | For dynamic content only |
| **Azure Translator** | $0-50 | 2M chars free, then $10/1M |
| **Hybrid (Recommended)** | $0-30 | i18n + Azure for overflow |

### Latency Comparison

```
User switches language → Translation displayed

i18n:           [████████████████████] 0ms (instant)
Azure (cached): [████████████████████] 0ms (from cache)
Azure (API):    [████████████░░░░░░░░] 50-200ms
OpenAI:         [████░░░░░░░░░░░░░░░░] 500-2000ms
```

### Content Type Suitability

| Content Type | i18n | OpenAI | Azure |
|--------------|------|--------|-------|
| Button labels | ✅ Best | ❌ Overkill | ⚠️ OK |
| Navigation | ✅ Best | ❌ Overkill | ⚠️ OK |
| Error messages | ✅ Best | ⚠️ OK | ⚠️ OK |
| Location descriptions | ❌ Static | ✅ Best | ✅ Good |
| User reviews | ❌ Cannot | ✅ Best | ✅ Good |
| Festival info | ❌ Static | ✅ Best | ✅ Good |
| Chatbot responses | ❌ Cannot | ✅ Best | ⚠️ OK |
| Place names | ⚠️ Manual | ✅ Good | ✅ Good |

---

## Hybrid Solution Recommendation

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSLATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   STATIC UI     │    │ DYNAMIC CONTENT │    │  CHATBOT    │ │
│  │   CONTENT       │    │ (Database)      │    │  RESPONSES  │ │
│  └────────┬────────┘    └────────┬────────┘    └──────┬──────┘ │
│           │                      │                     │        │
│           ▼                      ▼                     ▼        │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │     i18n        │    │ Azure Translator│    │  OpenAI API │ │
│  │ (react-i18next) │    │   (Existing)    │    │  (Optional) │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│           │                      │                     │        │
│           │              ┌───────┴───────┐             │        │
│           │              ▼               ▼             │        │
│           │      ┌─────────────┐ ┌─────────────┐       │        │
│           │      │Memory Cache │ │Persist Cache│       │        │
│           │      │  (LRU)      │ │(AsyncStorage)│      │        │
│           │      └─────────────┘ └─────────────┘       │        │
│           │                      │                     │        │
│           └──────────────────────┼─────────────────────┘        │
│                                  ▼                              │
│                    ┌─────────────────────────┐                  │
│                    │   TRANSLATED CONTENT    │                  │
│                    │   (User Interface)      │                  │
│                    └─────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities (Updated)

| Layer | Technology | Content Types | When Used |
|-------|------------|---------------|-----------|
| **Layer 1** | i18n (react-i18next) | Static UI, labels, navigation | ✅ Runtime |
| **Layer 2** | i18n (react-i18next) | NocoDB data (pre-translated) | ✅ Runtime |
| **Layer 3** | Azure Translator | New dynamic content (not pre-translated) | ✅ Runtime |
| **Layer 4** | OpenAI API | Pre-translation of i18n + NocoDB data | ❌ Development only |

> **Note**: OpenAI is NOT used at runtime. It's only used during development to create high-quality translations stored in JSON files.

### Runtime Decision Flow

```typescript
function getTranslation(text: string, type: ContentType): string {
  // 1. Check i18n first (static content + pre-translated NocoDB) - INSTANT
  if (type === 'static' || i18n.exists(text)) {
    return i18n.t(text);
  }

  // 2. Check cache (previously translated dynamic content) - INSTANT
  const cached = translationCache.get(text);
  if (cached) return cached;

  // 3. Use Azure for NEW dynamic content only - 50-200ms
  if (type === 'dynamic') {
    return azureTranslator.translate(text);
  }

  // NO OpenAI at runtime - excluded per requirements
  return text; // Fallback
}
```

---

## Detailed Implementation Plan

### Phase 1: i18n Setup (Week 1-2)

#### Step 1.1: Install Dependencies
```bash
npm install react-i18next i18next
```

#### Step 1.2: Create Translation Files Structure
```
src/
├── i18n/
│   ├── index.ts              # i18n configuration
│   ├── locales/
│   │   ├── en/
│   │   │   ├── common.json   # Common UI strings
│   │   │   ├── home.json     # Home screen
│   │   │   ├── profile.json  # Profile screen
│   │   │   ├── map.json      # Map screen
│   │   │   └── settings.json # Settings
│   │   └── vi/
│   │       ├── common.json
│   │       ├── home.json
│   │       ├── profile.json
│   │       ├── map.json
│   │       └── settings.json
│   └── types.d.ts            # TypeScript definitions
```

#### Step 1.3: Configure i18next
```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import enCommon from './locales/en/common.json';
import viCommon from './locales/vi/common.json';
// ... other imports

const resources = {
  en: {
    common: enCommon,
    // ... other namespaces
  },
  vi: {
    common: viCommon,
    // ... other namespaces
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi', // Default language
    fallbackLng: 'en',
    ns: ['common', 'home', 'profile', 'map', 'settings'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Persist language preference
export const setLanguage = async (lang: 'vi' | 'en') => {
  await AsyncStorage.setItem('app_language', lang);
  await i18n.changeLanguage(lang);
};

export default i18n;
```

#### Step 1.4: Migrate Static Translations
Extract all hardcoded Vietnamese strings from:
- `TranslationContext.tsx` (vietnameseTranslations object)
- `baseTranslations.ts`
- Component files with hardcoded text

**Estimated Effort**: 40-60 translation keys

### Phase 2: Integrate with Existing System (Week 2-3)

#### Step 2.1: Update TranslationContext
```typescript
// Enhanced TranslationContext.tsx
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { azureTranslator } from '../services/translation';

export const useTranslation = () => {
  const { t: i18nT, i18n } = useI18nTranslation();

  // For static content - use i18n
  const t = (key: string) => i18nT(key);

  // For dynamic content - use Azure
  const translateDynamic = async (text: string) => {
    if (i18n.language === 'en') return text;
    return azureTranslator.translate(text, 'vi', 'en');
  };

  return {
    t,
    translateDynamic,
    language: i18n.language,
    setLanguage: (lang: string) => i18n.changeLanguage(lang),
  };
};
```

#### Step 2.2: Update Components
```typescript
// Before
<Text>{t('Địa điểm phổ biến')}</Text>

// After
<Text>{t('home.popularPlaces')}</Text>
```

### Phase 3: Optimize Azure Integration (Week 3-4)

#### Step 3.1: Enhance Caching Strategy
- Increase persistent cache TTL for stable content
- Pre-fetch translations for known dynamic content
- Implement cache warming on app startup

#### Step 3.2: Add Translation Prefetching
```typescript
// Prefetch translations for location list
const prefetchLocationTranslations = async (locations: ILocation[]) => {
  const textsToTranslate = locations.flatMap(loc => [
    loc.name,
    loc.description,
    loc.address,
  ]).filter(Boolean);

  await translationQueue.translateBatch(textsToTranslate, 'vi', 'en');
};
```

### Phase 4: Testing & Optimization (Week 4-5)

#### Testing Checklist
- [ ] All static UI elements display correctly in both languages
- [ ] Language switching is instant for static content
- [ ] Dynamic content translates within 200ms
- [ ] Offline mode works with cached translations
- [ ] No untranslated strings visible to users
- [ ] Performance metrics meet targets

#### Performance Targets
| Metric | Target |
|--------|--------|
| Static translation | < 10ms |
| Cached dynamic | < 10ms |
| Azure API call | < 300ms |
| Language switch | < 100ms |
| Memory usage | < 5MB for translations |

---

## OpenAI Pre-Translation Scripts

> **Important**: OpenAI is used ONLY during development to create high-quality translations. It is NOT called during app runtime. All translations are stored as JSON files bundled with the app.

### Purpose
1. Generate Vietnamese translations for i18n JSON files (static UI content)
2. Pre-translate existing NocoDB data into JSON files (locations, festivals)

### Script 1: Generate i18n Vietnamese Translations

Create a Node.js script to translate English i18n files to Vietnamese:

```typescript
// scripts/translate-i18n.ts
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TranslationFile {
  [key: string]: string | TranslationFile;
}

async function translateI18nFile(
  englishContent: TranslationFile,
  namespace: string
): Promise<TranslationFile> {
  const systemPrompt = `You are a professional Vietnamese translator for a travel application.
Translate the following JSON content from English to Vietnamese.
Rules:
- Preserve JSON structure exactly
- Keep keys unchanged (only translate values)
- Use natural Vietnamese for travel/tourism context
- Keep place names in original form or provide Vietnamese equivalent
- Maintain consistent terminology throughout
- Return ONLY valid JSON, no explanations`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(englishContent, null, 2) }
    ],
    temperature: 0.3,
    max_tokens: 4000
  });

  const translatedJson = response.choices[0].message.content;
  return JSON.parse(translatedJson || '{}');
}

async function processAllI18nFiles() {
  const enDir = path.join(__dirname, '../src/i18n/locales/en');
  const viDir = path.join(__dirname, '../src/i18n/locales/vi');

  // Ensure vi directory exists
  if (!fs.existsSync(viDir)) {
    fs.mkdirSync(viDir, { recursive: true });
  }

  const files = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    console.log(`Translating ${file}...`);
    const enContent = JSON.parse(fs.readFileSync(path.join(enDir, file), 'utf-8'));
    const viContent = await translateI18nFile(enContent, file.replace('.json', ''));
    fs.writeFileSync(path.join(viDir, file), JSON.stringify(viContent, null, 2));
    console.log(`✅ ${file} translated successfully`);
  }
}

processAllI18nFiles().catch(console.error);
```

### Script 2: Extract Static Strings from Codebase

```typescript
// scripts/extract-strings.ts
// Extract all hardcoded Vietnamese strings from TranslationContext.tsx

import * as fs from 'fs';

const vietnameseTranslations = {
  // Common
  "back": "Back",
  "save": "Save",
  "cancel": "Cancel",
  "success": "Success",
  "error": "Error",
  "loading": "Loading...",
  "search": "Search",
  "viewAll": "View All",
  "close": "Close",
  "confirm": "Confirm",
  "delete": "Delete",
  "edit": "Edit",
  "add": "Add",
  "update": "Update",
  "select": "Select",
  "done": "Done",
  "retry": "Retry",
  "refresh": "Refresh",
  // Home
  "hello": "Hello",
  "welcomeToTravelApp": "Welcome to Travel App",
  "popularPlaces": "Popular Places",
  "nearbyPlaces": "Nearby Places",
  "searchPlaces": "Search places...",
  "exploreMore": "Explore More",
  // Navigation
  "home": "Home",
  "feed": "Feed",
  "map": "Map",
  "camera": "Camera",
  "profile": "Profile",
  // Profile
  "personalInformation": "Personal Information",
  "accountInformation": "Account Information",
  "settings": "Settings",
  "faq": "FAQ",
  "privacyPolicy": "Privacy & Policy",
  "aboutApp": "About App",
  "logout": "Logout",
  "editProfile": "Edit Profile",
  "language": "Language",
  // Settings
  "notifications": "Notifications",
  "pushNotifications": "Push Notifications",
  "receiveNotifications": "Receive notifications about new places and updates",
  "privacy": "Privacy",
  "locationServices": "Location Services",
  "allowLocationAccess": "Allow app to access your location",
  "synchronization": "Synchronization",
  "autoSync": "Auto Sync",
  "syncData": "Sync data when internet connection is available",
  "interface": "Interface",
  "darkMode": "Dark Mode",
  "useDarkInterface": "Use dark interface",
  "featureComingSoon": "This feature will be updated in the next version.",
  "storage": "Storage",
  "cache": "Cache",
  "size": "Size",
  "clear": "Clear",
  "clearCache": "Clear Cache",
  "confirmClearCache": "Are you sure you want to delete all temporary data?",
  "cacheClearedSuccess": "Cache cleared successfully!",
  // FAQ
  "frequentlyAskedQuestions": "Frequently Asked Questions",
  "searchQuestions": "Search questions...",
  "contactSupport": "Contact Support",
  "noResultsFound": "No results found",
  // About
  "version": "Version",
  "developer": "Developer",
  "contact": "Contact",
  "rateApp": "Rate App",
  "shareApp": "Share App",
  "feedback": "Feedback",
  // NewFeed
  "addReview": "Add Review",
  "writeReview": "Write Review",
  "rating": "Rating",
  "comment": "Comment",
  "submit": "Submit",
  "reviews": "Reviews",
  "photos": "Photos",
  "likes": "Likes",
  "comments": "Comments",
  "viewMore": "View More",
  "loadMore": "Load More",
  "noReviewsYet": "No reviews yet",
  // Policy
  "termsOfService": "Terms of Service",
  "security": "Security"
};

// Generate en/common.json
fs.writeFileSync(
  'src/i18n/locales/en/common.json',
  JSON.stringify(vietnameseTranslations, null, 2)
);
console.log('✅ English common.json generated');
```

---

## NocoDB Data Pre-Translation

### Purpose
Pre-translate existing NocoDB data (locations, festivals) using OpenAI for high-quality translations, then store them as JSON files bundled with the app.

### Unified JSON File Structure

```
src/i18n/locales/
├── en/
│   ├── common.json      # Static UI strings
│   ├── locations.json   # NocoDB locations (English)
│   └── festivals.json   # NocoDB festivals (English)
└── vi/
    ├── common.json      # Static UI strings (Vietnamese)
    ├── locations.json   # NocoDB locations (Vietnamese)
    └── festivals.json   # NocoDB festivals (Vietnamese)
```

### JSON File Format for NocoDB Data

**locations.json (English)**
```json
{
  "loc_1": {
    "name": "Dragon Bridge",
    "description": "The Dragon Bridge is a bridge over the Han River...",
    "address": "An Hai Trung, Son Tra, Da Nang",
    "advise": ["Best time to visit is weekend evenings", "Fire show at 9 PM"]
  },
  "loc_2": {
    "name": "Ba Na Hills",
    "description": "Ba Na Hills is a hill station and resort...",
    "address": "Hoa Ninh, Hoa Vang, Da Nang",
    "advise": ["Bring warm clothes", "Cable car included in ticket"]
  }
}
```

**locations.json (Vietnamese)**
```json
{
  "loc_1": {
    "name": "Cầu Rồng",
    "description": "Cầu Rồng là cây cầu bắc qua sông Hàn...",
    "address": "An Hải Trung, Sơn Trà, Đà Nẵng",
    "advise": ["Thời điểm tốt nhất là tối cuối tuần", "Phun lửa lúc 21h"]
  },
  "loc_2": {
    "name": "Bà Nà Hills",
    "description": "Bà Nà Hills là khu nghỉ dưỡng trên đồi...",
    "address": "Hòa Ninh, Hòa Vang, Đà Nẵng",
    "advise": ["Mang theo áo ấm", "Cáp treo đã bao gồm trong vé"]
  }
}
```

### NocoDB Tables to Pre-Translate

| Table | Table ID | Fields to Translate | Output File |
|-------|----------|---------------------|-------------|
| Locations | `mfz84cb0t9a84jt` | name, description, address, advise | `locations.json` |
| Festivals | `mktzgff8mpu2c32` | name, description, event_time, location, ticket_info | `festivals.json` |

### Script 3: Pre-Translate NocoDB Data to JSON Files

```typescript
// scripts/pretranslate-nocodb-to-json.ts
import OpenAI from 'openai';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const NOCODB_URL = process.env.DB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;

// Output directories
const EN_DIR = path.join(__dirname, '../src/i18n/locales/en');
const VI_DIR = path.join(__dirname, '../src/i18n/locales/vi');

interface LocationData {
  [key: string]: {
    name: string;
    description: string;
    address: string;
    advise: string[];
  };
}

interface FestivalData {
  [key: string]: {
    name: string;
    description: string;
    event_time: string;
    location: string;
    ticket_info: string;
  };
}

async function translateText(
  text: string,
  targetLang: 'en' | 'vi',
  context: string
): Promise<string> {
  if (!text) return '';

  const systemPrompt = `You are a professional translator for a Vietnamese travel app.
Translate the following text to ${targetLang === 'en' ? 'English' : 'Vietnamese'}.
Context: ${context}
Rules:
- Use natural, tourism-friendly language
- Keep cultural references intact
- Return ONLY the translated text, no explanations`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ],
    temperature: 0.3,
    max_tokens: 1000
  });

  return response.choices[0].message.content?.trim() || text;
}

async function fetchNocoDBData(tableId: string): Promise<any[]> {
  const response = await axios.get(
    `${NOCODB_URL}/api/v2/tables/${tableId}/records`,
    {
      headers: { 'xc-token': NOCODB_TOKEN },
      params: { limit: 1000 }
    }
  );
  return response.data.list || [];
}

async function preTranslateLocations() {
  console.log('📍 Pre-translating Locations to JSON files...');
  const locations = await fetchNocoDBData('mfz84cb0t9a84jt');

  const enData: LocationData = {};
  const viData: LocationData = {};

  for (const loc of locations) {
    const locId = `loc_${loc.Id}`;

    // Determine source language and translate accordingly
    const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(loc.name || '');

    if (isVietnamese) {
      // Source is Vietnamese, translate to English
      viData[locId] = {
        name: loc.name || '',
        description: loc.description || '',
        address: loc.address || '',
        advise: Array.isArray(loc.advise) ? loc.advise : [loc.advise].filter(Boolean)
      };

      enData[locId] = {
        name: await translateText(loc.name, 'en', 'location name'),
        description: await translateText(loc.description, 'en', 'location description'),
        address: await translateText(loc.address, 'en', 'address'),
        advise: await Promise.all(
          (Array.isArray(loc.advise) ? loc.advise : [loc.advise])
            .filter(Boolean)
            .map(a => translateText(a, 'en', 'travel advice'))
        )
      };
    } else {
      // Source is English, translate to Vietnamese
      enData[locId] = {
        name: loc.name || '',
        description: loc.description || '',
        address: loc.address || '',
        advise: Array.isArray(loc.advise) ? loc.advise : [loc.advise].filter(Boolean)
      };

      viData[locId] = {
        name: await translateText(loc.name, 'vi', 'location name'),
        description: await translateText(loc.description, 'vi', 'location description'),
        address: await translateText(loc.address, 'vi', 'address'),
        advise: await Promise.all(
          (Array.isArray(loc.advise) ? loc.advise : [loc.advise])
            .filter(Boolean)
            .map(a => translateText(a, 'vi', 'travel advice'))
        )
      };
    }

    console.log(`  ✅ ${loc.name}`);
  }

  // Write to JSON files
  fs.writeFileSync(
    path.join(EN_DIR, 'locations.json'),
    JSON.stringify(enData, null, 2)
  );
  fs.writeFileSync(
    path.join(VI_DIR, 'locations.json'),
    JSON.stringify(viData, null, 2)
  );

  console.log(`📍 Locations: ${Object.keys(enData).length} items saved to JSON files`);
}

async function preTranslateFestivals() {
  console.log('🎉 Pre-translating Festivals to JSON files...');
  const festivals = await fetchNocoDBData('mktzgff8mpu2c32');

  const enData: FestivalData = {};
  const viData: FestivalData = {};

  for (const fest of festivals) {
    const festId = `fest_${fest.Id}`;

    // Determine source language
    const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(fest.name || '');

    if (isVietnamese) {
      viData[festId] = {
        name: fest.name || '',
        description: fest.description || '',
        event_time: fest.event_time || '',
        location: fest.location || '',
        ticket_info: fest.ticket_info || ''
      };

      enData[festId] = {
        name: await translateText(fest.name, 'en', 'festival name'),
        description: await translateText(fest.description, 'en', 'festival description'),
        event_time: await translateText(fest.event_time, 'en', 'event time'),
        location: await translateText(fest.location, 'en', 'location'),
        ticket_info: await translateText(fest.ticket_info, 'en', 'ticket information')
      };
    } else {
      enData[festId] = {
        name: fest.name || '',
        description: fest.description || '',
        event_time: fest.event_time || '',
        location: fest.location || '',
        ticket_info: fest.ticket_info || ''
      };

      viData[festId] = {
        name: await translateText(fest.name, 'vi', 'festival name'),
        description: await translateText(fest.description, 'vi', 'festival description'),
        event_time: await translateText(fest.event_time, 'vi', 'event time'),
        location: await translateText(fest.location, 'vi', 'location'),
        ticket_info: await translateText(fest.ticket_info, 'vi', 'ticket information')
      };
    }

    console.log(`  ✅ ${fest.name}`);
  }

  // Write to JSON files
  fs.writeFileSync(
    path.join(EN_DIR, 'festivals.json'),
    JSON.stringify(enData, null, 2)
  );
  fs.writeFileSync(
    path.join(VI_DIR, 'festivals.json'),
    JSON.stringify(viData, null, 2)
  );

  console.log(`🎉 Festivals: ${Object.keys(enData).length} items saved to JSON files`);
}

async function main() {
  console.log('🚀 Starting NocoDB Pre-Translation to JSON files...\n');

  // Ensure directories exist
  if (!fs.existsSync(EN_DIR)) fs.mkdirSync(EN_DIR, { recursive: true });
  if (!fs.existsSync(VI_DIR)) fs.mkdirSync(VI_DIR, { recursive: true });

  await preTranslateLocations();
  await preTranslateFestivals();

  console.log('\n✅ Pre-translation complete!');
  console.log('📁 JSON files saved to src/i18n/locales/');
}

main().catch(console.error);
```

### Using Pre-Translated NocoDB Data in Components

```typescript
// Example: Using location translations in a component
import { useTranslation } from 'react-i18next';

function LocationCard({ locationId }: { locationId: string }) {
  const { t } = useTranslation('locations');

  return (
    <View>
      <Text>{t(`${locationId}.name`)}</Text>
      <Text>{t(`${locationId}.description`)}</Text>
      <Text>{t(`${locationId}.address`)}</Text>
    </View>
  );
}

// Example: Using festival translations
function FestivalCard({ festivalId }: { festivalId: string }) {
  const { t } = useTranslation('festivals');

  return (
    <View>
      <Text>{t(`${festivalId}.name`)}</Text>
      <Text>{t(`${festivalId}.description`)}</Text>
      <Text>{t(`${festivalId}.event_time`)}</Text>
    </View>
  );
}
```

---

## Implementation Task List

### Phase 1: i18n Setup (Week 1-2)

#### Week 1: Foundation Setup

| # | Task | Description | Est. Time | Status |
|---|------|-------------|-----------|--------|
| 1.1 | [ ] Install dependencies | `npm install react-i18next i18next` | 0.5h | |
| 1.2 | [ ] Create folder structure | Create `src/i18n/locales/en/` and `src/i18n/locales/vi/` | 0.5h | |
| 1.3 | [ ] Configure i18next | Create `src/i18n/index.ts` with proper configuration | 2h | |
| 1.4 | [ ] Create TypeScript types | Create `src/i18n/types.d.ts` for type safety | 1h | |
| 1.5 | [ ] Extract static strings | Run Script 2 to extract all UI strings to `en/common.json` | 2h | |
| 1.6 | [ ] Review extracted strings | Verify all strings are correctly extracted | 1h | |

**Deliverables Week 1:**
- [ ] i18n library installed and configured
- [ ] `en/common.json` with all static UI strings
- [ ] TypeScript types for translation keys

#### Week 2: OpenAI Translation & Integration

| # | Task | Description | Est. Time | Status |
|---|------|-------------|-----------|--------|
| 2.1 | [ ] Set up OpenAI script | Configure `scripts/translate-i18n.ts` | 1h | |
| 2.2 | [ ] Run OpenAI translation | Generate `vi/common.json` from English source | 1h | |
| 2.3 | [ ] Human review (Vietnamese) | Native speaker reviews translations | 4h | |
| 2.4 | [ ] Fix translation issues | Correct any mistranslations | 2h | |
| 2.5 | [ ] Update TranslationContext | Integrate i18n with existing context | 3h | |
| 2.6 | [ ] Update components | Replace hardcoded strings with `t()` calls | 8h | |

**Deliverables Week 2:**
- [ ] `vi/common.json` with reviewed Vietnamese translations
- [ ] TranslationContext integrated with i18n
- [ ] All components using i18n keys

---

### Phase 2: NocoDB Pre-Translation (Week 3)

| # | Task | Description | Est. Time | Status |
|---|------|-------------|-----------|--------|
| 3.1 | [ ] Set up NocoDB script | Configure `scripts/pretranslate-nocodb-to-json.ts` | 2h | |
| 3.2 | [ ] Test with sample data | Run script on 5-10 locations first | 1h | |
| 3.3 | [ ] Run full Locations translation | Generate `locations.json` for both languages | 2h | |
| 3.4 | [ ] Run full Festivals translation | Generate `festivals.json` for both languages | 2h | |
| 3.5 | [ ] Human review (Locations) | Native speaker reviews location translations | 4h | |
| 3.6 | [ ] Human review (Festivals) | Native speaker reviews festival translations | 2h | |
| 3.7 | [ ] Fix translation issues | Correct any mistranslations | 2h | |
| 3.8 | [ ] Update i18n config | Add `locations` and `festivals` namespaces | 1h | |

**Deliverables Week 3:**
- [ ] `en/locations.json` and `vi/locations.json`
- [ ] `en/festivals.json` and `vi/festivals.json`
- [ ] All NocoDB data accessible via i18n

---

### Phase 3: Component Integration (Week 4)

| # | Task | Description | Est. Time | Status |
|---|------|-------------|-----------|--------|
| 4.1 | [ ] Update Location components | Use `t('locations:loc_X.name')` pattern | 4h | |
| 4.2 | [ ] Update Festival components | Use `t('festivals:fest_X.name')` pattern | 3h | |
| 4.3 | [ ] Update data fetching | Map NocoDB IDs to translation keys | 3h | |
| 4.4 | [ ] Handle missing translations | Fallback to Azure for new content | 2h | |
| 4.5 | [ ] Language switcher | Ensure smooth language switching | 2h | |
| 4.6 | [ ] Persist language preference | Save to AsyncStorage | 1h | |

**Deliverables Week 4:**
- [ ] All location/festival components using i18n
- [ ] Fallback mechanism for new content
- [ ] Language preference persistence

---

### Phase 4: Testing & Optimization (Week 5)

| # | Task | Description | Est. Time | Status |
|---|------|-------------|-----------|--------|
| 5.1 | [ ] Unit tests | Test translation functions | 4h | |
| 5.2 | [ ] Integration tests | Test language switching | 3h | |
| 5.3 | [ ] UI testing (Vietnamese) | Full app walkthrough in Vietnamese | 4h | |
| 5.4 | [ ] UI testing (English) | Full app walkthrough in English | 4h | |
| 5.5 | [ ] Performance testing | Measure translation latency | 2h | |
| 5.6 | [ ] Bundle size analysis | Check impact on app size | 1h | |
| 5.7 | [ ] Bug fixes | Fix any issues found | 4h | |
| 5.8 | [ ] Documentation | Update README and code comments | 2h | |

**Deliverables Week 5:**
- [ ] All tests passing
- [ ] Performance metrics documented
- [ ] Production-ready translation system

---

### Summary Checklist

#### Pre-Release Checklist

- [ ] All static UI strings in `common.json`
- [ ] All NocoDB locations in `locations.json`
- [ ] All NocoDB festivals in `festivals.json`
- [ ] Vietnamese translations reviewed by native speaker
- [ ] Language switching works correctly
- [ ] Offline mode works with bundled translations
- [ ] Azure fallback works for new content
- [ ] Performance targets met (0ms for bundled, <300ms for Azure)
- [ ] No untranslated strings visible to users

#### Files to Commit

```
src/i18n/
├── index.ts                    # i18n configuration
├── types.d.ts                  # TypeScript definitions
└── locales/
    ├── en/
    │   ├── common.json         # Static UI (English)
    │   ├── locations.json      # Locations (English)
    │   └── festivals.json      # Festivals (English)
    └── vi/
        ├── common.json         # Static UI (Vietnamese)
        ├── locations.json      # Locations (Vietnamese)
        └── festivals.json      # Festivals (Vietnamese)

scripts/
├── translate-i18n.ts           # OpenAI script for UI strings
├── extract-strings.ts          # Extract strings from codebase
└── pretranslate-nocodb-to-json.ts  # OpenAI script for NocoDB data
```

## Timeline & Phases

### Complete Implementation Timeline

```
Week 1-2: i18n Setup & OpenAI Pre-Translation
├── Day 1-2: Install react-i18next, create folder structure
├── Day 3-4: Extract all static strings to en/*.json files
├── Day 5-6: Run OpenAI script to generate vi/*.json files
├── Day 7-8: Human review of Vietnamese translations
├── Day 9-10: Integrate i18n with TranslationContext
└── Day 11-14: Update components to use i18n keys

Week 3: NocoDB Pre-Translation
├── Day 15-16: Run OpenAI script for Locations data
├── Day 17-18: Run OpenAI script for Festivals data
├── Day 19-20: Human review of NocoDB translations
└── Day 21: Import pre-translations to cache

Week 4: Azure Integration Optimization
├── Day 22-23: Enhance caching strategy
├── Day 24-25: Implement translation prefetching
├── Day 26-27: Add cache warming on app startup
└── Day 28: Performance testing

Week 5: Testing & QA
├── Day 29-30: Full UI testing in both languages
├── Day 31-32: Performance benchmarking
├── Day 33-34: Bug fixes and refinements
└── Day 35: Final review and documentation
```

### Deliverables by Phase

| Phase | Deliverables | Owner |
|-------|--------------|-------|
| **Phase 1** | i18n setup, en/*.json files | Dev Team |
| **Phase 2** | vi/*.json files (OpenAI generated) | Dev Team + QA |
| **Phase 3** | NocoDB pre-translations | Dev Team |
| **Phase 4** | Azure optimization | Dev Team |
| **Phase 5** | Tested, production-ready app | QA Team |

---

## Conclusion

### Final Recommendation

**Implement a Unified JSON Approach:**

1. **Primary: i18n (react-i18next)** for all pre-translated content
   - Zero latency (0ms)
   - Perfect translations (human-reviewed)
   - Full offline support
   - TypeScript safety
   - **Includes both static UI AND NocoDB data**

2. **Secondary: Azure Translator** for NEW dynamic content only
   - Only used for content added after pre-translation
   - Cost-effective ($10/1M chars + 2M free)
   - Fast response (50-200ms)
   - Existing caching system in place

3. **Development Tool: OpenAI API** for pre-translation (NOT runtime)
   - Generate high-quality i18n Vietnamese translations
   - Pre-translate ALL existing NocoDB data to JSON files
   - One-time cost during development phase
   - No AsyncStorage cache needed

### Why Unified JSON?

| Benefit | Description |
|---------|-------------|
| **Simplicity** | Single storage method (JSON files) for all translations |
| **Performance** | 0ms latency for ALL pre-translated content |
| **Reliability** | No risk of cache being cleared by user |
| **Offline** | 100% offline capability for bundled content |
| **Consistency** | Same `t()` function for UI and NocoDB data |

### Expected Outcomes

| Metric | Current | After Implementation |
|--------|---------|---------------------|
| Static content latency | 50-200ms | 0ms |
| NocoDB data latency | 50-200ms | 0ms (pre-translated) |
| Translation accuracy | 90% | 98%+ |
| Offline support | Partial | Full (all bundled) |
| Monthly API cost | ~$20-50 | ~$5-10 |
| User experience | Good | Excellent |

### Next Steps

1. ✅ Review and approve this document
2. 📋 Follow the Implementation Task List above
3. 🚀 Begin Phase 1: i18n setup
4. 📊 Set up translation analytics
5. 🔄 Iterate based on user feedback

---

## Implementation Status (Updated: January 5, 2026)

### ✅ Completed Components

| Component | Status | Notes |
|-----------|--------|-------|
| **i18n Setup** | ✅ Complete | react-i18next configured with 3 namespaces |
| **Translation Files** | ✅ Complete | All JSON files created (en/vi) |
| **TranslationContext** | ✅ Complete | Integrated with i18n, syncs language changes |
| **useTranslation Hook** | ✅ Complete | Provides `t()`, `translate()`, `setLanguage()` |
| **withAzureTranslation HOC** | ✅ Complete | For class components |
| **LanguageDropdown** | ✅ Complete | UI component for language switching |
| **Azure Translator Service** | ✅ Complete | For dynamic content translation |
| **Caching System** | ✅ Complete | Memory + AsyncStorage caching |
| **Pre-translation Scripts** | ✅ Complete | Scripts executed successfully |

### 📁 Key Files

```
src/i18n/
├── index.ts                    # i18n configuration
├── types.d.ts                  # TypeScript types
└── locales/
    ├── en/
    │   ├── common.json         # 263 UI translation keys
    │   ├── locations.json      # Pre-translated locations
    │   └── festivals.json      # Pre-translated festivals
    └── vi/
        ├── common.json         # Vietnamese UI strings
        ├── locations.json      # Vietnamese locations
        └── festivals.json      # Vietnamese festivals

src/context/TranslationContext.tsx  # Translation context with i18n integration
src/hooks/useTranslation.ts         # Translation hook
src/hoc/withAzureTranslation.tsx    # HOC for class components
src/component/LanguageDropdown.tsx  # Language switcher UI
```

### 🔧 Quick Usage Reference

```typescript
// Functional components
import { useTranslation } from '../hooks/useTranslation';

function MyComponent() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <View>
      <Text>{t('home.greeting')}</Text>
      <Text>{t('locations:loc_1.name')}</Text>
      <Text>{t('festivals:fest_1.name')}</Text>
    </View>
  );
}

// Class components
import { withAzureTranslation } from '../hoc/withAzureTranslation';

class MyClass extends React.Component {
  render() {
    return <Text>{this.props.t('common.save')}</Text>;
  }
}
export default withAzureTranslation(MyClass);

// Language switching
await setLanguage('en'); // Switch to English
await setLanguage('vi'); // Switch to Vietnamese
```

### ⚠️ Remaining Work

1. **Component Migration** - Many components still use hardcoded strings from `src/res/strings.tsx` instead of `t()` function
2. **Bottom Tab Bar** - Uses `strings.tsx` instead of translations (see `AppContainer.tsx` lines 134-214)
3. **Testing** - Full end-to-end testing of language switching across all screens

### 📝 Notes

- **Proper nouns** (place names, festival names) remain in Vietnamese in English JSON files - this is intentional
- **Default language** is Vietnamese (`vi`)
- **Fallback language** is Vietnamese (`vi`)
- **OpenAI API key** is available in `.env` for future translation tasks

---

**Document Status**: ✅ Implementation Complete
**Last Updated**: January 5, 2026

