# 🔄 Azure Translator Migration Plan

> **Document Version:** 1.0  
> **Created:** December 16, 2024  
> **Project:** Travel Da Nang Mobile App  
> **Platform:** React Native (iOS & Android)  
> **Migration Type:** Complete i18n System Replacement

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current System Analysis](#2-current-system-analysis)
3. [Target Architecture](#3-target-architecture)
4. [Migration Strategy](#4-migration-strategy)
5. [Detailed Task List](#5-detailed-task-list)
6. [Risk Assessment](#6-risk-assessment)
7. [Rollback Plan](#7-rollback-plan)
8. [Testing Strategy](#8-testing-strategy)
9. [Cost Projections](#9-cost-projections)

---

## 1. Executive Summary

### 1.1 Migration Objective

**Complete replacement** of the current custom React Context-based i18n system with Microsoft Azure Translator API for all multilingual translation needs.

### 1.2 Scope

| Aspect | Current State | Target State |
|--------|---------------|--------------|
| **Translation Source** | Local JSON objects in `src/i18n/index.tsx` | Azure Translator API |
| **Translation Method** | Static key-value lookup | Real-time API translation |
| **Supported Languages** | Vietnamese, English (hardcoded) | Any language (dynamic) |
| **Offline Support** | Full (bundled translations) | Cached translations + fallback |
| **API Dependency** | None | Azure Cognitive Services |

### 1.3 Effort Summary

| Phase | Tasks | Estimated Time | Risk Level |
|-------|-------|----------------|------------|
| Phase 0: Preparation | 6 tasks | 8-12 hours | Low |
| Phase 1: Core Infrastructure | 8 tasks | 16-24 hours | Medium |
| Phase 2: Component Migration | 12 tasks | 24-40 hours | High |
| Phase 3: Testing & Validation | 6 tasks | 12-16 hours | Medium |
| Phase 4: Deployment | 4 tasks | 4-8 hours | Medium |
| **Total** | **36 tasks** | **64-100 hours** | - |

**Estimated Timeline:** 3-5 weeks (1 developer)

---

## 2. Current System Analysis

### 2.1 i18n System Architecture

```
Current i18n Architecture
┌─────────────────────────────────────────────────────────────┐
│                      AppContainer.tsx                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              LanguageProvider (Context)              │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │           translations object               │    │    │
│  │  │  ├── vi: { common, home, settings, ... }   │    │    │
│  │  │  └── en: { common, home, settings, ... }   │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  Provides: { language, setLanguage, t() }           │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│           ┌───────────────┼───────────────┐                 │
│           ▼               ▼               ▼                 │
│    useLanguage()    withTranslation()   LanguageDropdown   │
│    (Functional)     (Class Components)   (UI Selector)     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Files Using i18n System

| File | Usage Type | Translation Calls | Complexity |
|------|------------|-------------------|------------|
| `src/i18n/index.tsx` | Core Provider | N/A (source) | High |
| `src/i18n/withTranslation.tsx` | HOC Definition | N/A (source) | Medium |
| `src/container/AppContainer.tsx` | LanguageProvider wrapper | 1 import | Low |
| `src/component/LanguageDropdown.tsx` | useLanguage hook | 3 calls | Medium |
| `src/container/screens/Home/HomeScreen.tsx` | withTranslation HOC | 1 t() call | Medium |
| `src/container/screens/Profile/Settings.tsx` | withTranslation HOC | 25+ t() calls | High |

### 2.3 Translation Keys Inventory

**Total Translation Keys: ~150 keys across 10 categories**

| Category | Key Count | Example Keys |
|----------|-----------|--------------|
| `common` | 17 | `back`, `save`, `cancel`, `loading` |
| `home` | 11 | `greeting`, `popularPlaces`, `searchPlaceholder` |
| `navigation` | 5 | `home`, `newFeed`, `map`, `camera`, `profile` |
| `profile` | 16 | `title`, `settings`, `logout`, `editProfile` |
| `settings` | 24 | `notifications`, `darkMode`, `clearCache` |
| `faq` | 9 | `title`, `searchFaq`, `categories.*` |
| `policy` | 8 | `title`, `privacy`, `terms`, `security` |
| `about` | 14 | `version`, `developer`, `rateApp` |
| `newFeed` | 15 | `addReview`, `rating`, `comments` |
| `map` | 14 | `myLocation`, `directions`, `distance` |
| `camera` | 10 | `takePhoto`, `gallery`, `flash` |

### 2.4 Current Translation Flow

```
User Action → t('settings.title') → translations[language]['settings']['title'] → "Cài đặt"
                                                    ↓
                                          Synchronous lookup
                                          No network required
                                          ~0ms latency
```

---

## 3. Target Architecture

### 3.1 New Azure Translator Architecture

```
Target Azure Translator Architecture
┌─────────────────────────────────────────────────────────────────────┐
│                         AppContainer.tsx                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                 TranslationProvider (Context)                  │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │              TranslationService                          │  │  │
│  │  │  ├── Azure Translator API Client                        │  │  │
│  │  │  ├── Multi-layer Cache (Memory → AsyncStorage)          │  │  │
│  │  │  ├── Offline Fallback (Pre-cached base translations)    │  │  │
│  │  │  └── Request Queue & Batching                           │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  Provides: { language, setLanguage, translate(), isLoading }  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│          ┌───────────────────┼───────────────────┐                  │
│          ▼                   ▼                   ▼                  │
│   useTranslation()    withAzureTranslation()  LanguageSelector     │
│   (Functional)        (Class Components)       (UI Selector)       │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Translation Flow (New)

```
User Action → translate('Settings') → Check Memory Cache
                                              ↓ miss
                                      Check AsyncStorage Cache
                                              ↓ miss
                                      Azure Translator API
                                              ↓
                                      Cache Response (Memory + Storage)
                                              ↓
                                      Return "Cài đặt"
                                      
Latency: 0ms (cache hit) / 100-300ms (API call)
```

### 3.3 Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Source Text Language** | English | More universal, better API support |
| **Translation Direction** | EN → Target Language | Consistent source for all translations |
| **Caching Strategy** | 3-layer (Memory → AsyncStorage → API) | Balance speed and offline support |
| **Batch Translations** | Yes, max 100 texts per request | Reduce API calls, lower costs |
| **Offline Fallback** | Pre-cached essential translations | Ensure app usability without network |
| **Error Handling** | Return source text on failure | Graceful degradation |

---

## 4. Migration Strategy

### 4.1 Migration Approach: Parallel Implementation

```
Migration Timeline
Week 1          Week 2          Week 3          Week 4          Week 5
│               │               │               │               │
├── Phase 0 ────┤               │               │               │
│  Preparation  │               │               │               │
│               ├── Phase 1 ────┤               │               │
│               │  Core Infra   │               │               │
│               │               ├── Phase 2 ────┤               │
│               │               │  Migration    │               │
│               │               │               ├── Phase 3 ────┤
│               │               │               │  Testing      │
│               │               │               │               ├── Phase 4
│               │               │               │               │  Deploy
▼               ▼               ▼               ▼               ▼
```

### 4.2 Feature Flag Strategy

```typescript
// src/config/featureFlags.ts
export const FEATURE_FLAGS = {
  USE_AZURE_TRANSLATOR: false, // Toggle during migration
};
```

This allows:
- Gradual rollout
- Quick rollback if issues occur
- A/B testing translation quality
- Side-by-side comparison during development

---

## 5. Detailed Task List

### Phase 0: Preparation (Prerequisites)

| Task ID | Task Name | Description | Dependencies | Complexity | Est. Time | Risk |
|---------|-----------|-------------|--------------|------------|-----------|------|
| P0.1 | Create Azure Account | Set up Azure account and subscription | None | Low | 1h | Low |
| P0.2 | Create Translator Resource | Create Azure Cognitive Services Translator resource in Southeast Asia region | P0.1 | Low | 30m | Low |
| P0.3 | Obtain API Keys | Get subscription key and endpoint URL | P0.2 | Low | 15m | Low |
| P0.4 | Create Feature Branch | Create `feature/azure-translator-migration` branch | None | Low | 15m | Low |
| P0.5 | Set Up Environment Variables | Add Azure credentials to `.env` file | P0.3 | Low | 30m | Low |
| P0.6 | Document Current Translations | Export all current translation keys to reference document | None | Medium | 2h | Low |

**Phase 0 Deliverables:**
- [ ] Azure Translator resource created
- [ ] API keys secured in environment variables
- [ ] Feature branch created
- [ ] Translation keys documented

---

### Phase 1: Core Infrastructure

| Task ID | Task Name | Description | Dependencies | Complexity | Est. Time | Risk |
|---------|-----------|-------------|--------------|------------|-----------|------|
| P1.1 | Create Azure Translator Service | Implement `src/services/AzureTranslatorService.ts` with translate, translateBatch, detectLanguage methods | P0.5 | High | 4h | Medium |
| P1.2 | Implement Memory Cache | Create LRU cache for in-memory translation storage | P1.1 | Medium | 2h | Low |
| P1.3 | Implement Persistent Cache | Create AsyncStorage-based cache with TTL | P1.2 | Medium | 2h | Low |
| P1.4 | Create Translation Queue | Implement request batching and queue management | P1.1 | Medium | 3h | Medium |
| P1.5 | Create TranslationProvider | New React Context provider replacing LanguageProvider | P1.1-P1.4 | High | 4h | Medium |
| P1.6 | Create useTranslation Hook | New hook replacing useLanguage | P1.5 | Medium | 2h | Low |
| P1.7 | Create withAzureTranslation HOC | New HOC replacing withTranslation | P1.5 | Medium | 2h | Low |
| P1.8 | Create Offline Fallback System | Pre-cache essential translations for offline use | P1.3 | Medium | 3h | Medium |

**Phase 1 File Structure:**
```
src/
├── services/
│   └── translation/
│       ├── AzureTranslatorService.ts    # P1.1
│       ├── TranslationCache.ts          # P1.2, P1.3
│       ├── TranslationQueue.ts          # P1.4
│       └── index.ts                     # Exports
├── context/
│   └── TranslationContext.tsx           # P1.5
├── hooks/
│   └── useTranslation.ts                # P1.6
└── hoc/
    └── withAzureTranslation.tsx         # P1.7
```

**Phase 1 Deliverables:**
- [ ] Azure Translator API integration working
- [ ] Caching system implemented
- [ ] New TranslationProvider created
- [ ] New hooks and HOCs ready

---

### Phase 2: Component Migration

#### 2A: Core Files Migration

| Task ID | Task Name | Description | Dependencies | Complexity | Est. Time | Risk |
|---------|-----------|-------------|--------------|------------|-----------|------|
| P2.1 | Update AppContainer.tsx | Replace LanguageProvider with TranslationProvider | P1.5 | Medium | 2h | High |
| P2.2 | Update LanguageDropdown.tsx | Replace useLanguage with useTranslation | P1.6 | Medium | 2h | Medium |
| P2.3 | Create LanguageSelector.tsx | New language selector component with Azure support | P1.6 | Medium | 3h | Low |

#### 2B: Screen Migration

| Task ID | Task Name | Description | Dependencies | Complexity | Est. Time | Risk |
|---------|-----------|-------------|--------------|------------|-----------|------|
| P2.4 | Migrate HomeScreen.tsx | Replace withTranslation HOC, update t() calls | P1.7 | Medium | 3h | Medium |
| P2.5 | Migrate Settings.tsx | Replace withTranslation HOC, update 25+ t() calls | P1.7 | High | 4h | High |
| P2.6 | Audit Other Screens | Check and update any other screens using translations | P2.4, P2.5 | Medium | 2h | Medium |

#### 2C: Translation Content Migration

| Task ID | Task Name | Description | Dependencies | Complexity | Est. Time | Risk |
|---------|-----------|-------------|--------------|------------|-----------|------|
| P2.7 | Create Base Translations File | Create English source text file for all UI strings | P0.6 | Medium | 3h | Low |
| P2.8 | Pre-translate Essential Strings | Batch translate and cache essential UI strings | P2.7, P1.1 | Medium | 2h | Medium |
| P2.9 | Create Translation Mapping | Map old i18n keys to new source texts | P2.7 | Medium | 2h | Low |

#### 2D: Cleanup

| Task ID | Task Name | Description | Dependencies | Complexity | Est. Time | Risk |
|---------|-----------|-------------|--------------|------------|-----------|------|
| P2.10 | Remove Old i18n Files | Delete `src/i18n/index.tsx` and `withTranslation.tsx` | P2.1-P2.6 | Low | 30m | Medium |
| P2.11 | Update Imports | Update all import statements across codebase | P2.10 | Low | 1h | Low |
| P2.12 | Remove Unused Dependencies | Clean up any unused i18n-related packages | P2.11 | Low | 30m | Low |

**Phase 2 Deliverables:**
- [ ] All components migrated to new translation system
- [ ] Old i18n system removed
- [ ] All imports updated
- [ ] No TypeScript errors

---

### Phase 3: Testing & Validation

| Task ID | Task Name | Description | Dependencies | Complexity | Est. Time | Risk |
|---------|-----------|-------------|--------------|------------|-----------|------|
| P3.1 | Unit Test Translation Service | Test AzureTranslatorService methods | P1.1 | Medium | 3h | Low |
| P3.2 | Unit Test Caching | Test cache hit/miss scenarios | P1.2, P1.3 | Medium | 2h | Low |
| P3.3 | Integration Test Provider | Test TranslationProvider with components | P1.5 | Medium | 2h | Medium |
| P3.4 | E2E Test Language Switching | Test full language switch flow | P2.1-P2.6 | Medium | 2h | Medium |
| P3.5 | Offline Mode Testing | Test app behavior without network | P1.8 | Medium | 2h | High |
| P3.6 | Performance Testing | Measure translation latency and cache performance | All P2 | Medium | 2h | Medium |

**Phase 3 Test Scenarios:**

```
Test Matrix
┌─────────────────────────────────────────────────────────────┐
│ Scenario                    │ Expected Result              │
├─────────────────────────────┼──────────────────────────────┤
│ First load (no cache)       │ API call, cache populated    │
│ Second load (cached)        │ Instant from cache           │
│ Language switch             │ New translations fetched     │
│ Offline mode                │ Fallback translations shown  │
│ API error                   │ Source text displayed        │
│ Rate limit hit              │ Queue and retry              │
│ Long text translation       │ Chunked and reassembled      │
│ Batch translation           │ Single API call for multiple │
└─────────────────────────────┴──────────────────────────────┘
```

**Phase 3 Deliverables:**
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Offline mode verified
- [ ] Performance benchmarks documented

---

### Phase 4: Deployment

| Task ID | Task Name | Description | Dependencies | Complexity | Est. Time | Risk |
|---------|-----------|-------------|--------------|------------|-----------|------|
| P4.1 | Enable Feature Flag | Set `USE_AZURE_TRANSLATOR: true` | All P3 | Low | 15m | Medium |
| P4.2 | Beta Testing | Deploy to beta testers for validation | P4.1 | Medium | 2-3 days | Medium |
| P4.3 | Monitor API Usage | Track Azure Translator API usage and costs | P4.2 | Low | Ongoing | Low |
| P4.4 | Production Release | Full production deployment | P4.2 | Medium | 2h | High |

**Phase 4 Deliverables:**
- [ ] Feature flag enabled
- [ ] Beta testing completed
- [ ] API usage within budget
- [ ] Production deployment successful

---

## 6. Risk Assessment

### 6.1 High-Impact Risks

| Risk ID | Risk | Probability | Impact | Mitigation |
|---------|------|-------------|--------|------------|
| R1 | **API Unavailability** | Low | High | Implement robust offline fallback with pre-cached translations |
| R2 | **Translation Quality Issues** | Medium | High | Human review of critical translations, custom terminology |
| R3 | **Cost Overrun** | Medium | Medium | Aggressive caching, usage monitoring, alerts at 80% budget |
| R4 | **Performance Degradation** | Medium | High | Multi-layer caching, batch requests, lazy loading |
| R5 | **Breaking Changes During Migration** | Medium | High | Feature flag, parallel systems, comprehensive testing |

### 6.2 Risk Response Matrix

```
Risk Response Actions
┌─────────────────────────────────────────────────────────────────┐
│ If API unavailable for > 5 minutes:                             │
│   → Automatically switch to offline fallback                    │
│   → Log incident for review                                     │
│   → Notify development team                                     │
├─────────────────────────────────────────────────────────────────┤
│ If translation quality complaint received:                      │
│   → Add to custom terminology glossary                          │
│   → Override with manual translation in cache                   │
│   → Review similar translations                                 │
├─────────────────────────────────────────────────────────────────┤
│ If API costs exceed 80% of monthly budget:                      │
│   → Alert development team                                      │
│   → Review caching effectiveness                                │
│   → Consider reducing translation frequency                     │
├─────────────────────────────────────────────────────────────────┤
│ If performance issues detected (latency > 500ms):               │
│   → Increase cache TTL                                          │
│   → Pre-fetch more translations                                 │
│   → Review batch size optimization                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Rollback Plan

### 7.1 Rollback Triggers

- API failure rate > 5% for 10+ minutes
- Translation quality complaints from > 10% of users
- Performance degradation > 50% (measured by screen load time)
- Cost exceeds 150% of projected budget

### 7.2 Rollback Procedure

```
Rollback Steps (Estimated Time: 15 minutes)
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Disable Feature Flag (2 min)                            │
│   → Set USE_AZURE_TRANSLATOR = false                            │
│   → Push config change                                          │
├─────────────────────────────────────────────────────────────────┤
│ Step 2: Verify Old System Active (5 min)                        │
│   → Test language switching                                     │
│   → Verify translations display correctly                       │
├─────────────────────────────────────────────────────────────────┤
│ Step 3: Notify Stakeholders (3 min)                             │
│   → Send rollback notification                                  │
│   → Document reason for rollback                                │
├─────────────────────────────────────────────────────────────────┤
│ Step 4: Post-Mortem (5 min initial)                             │
│   → Identify root cause                                         │
│   → Plan remediation                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Rollback Prerequisites

To enable quick rollback, maintain during migration:
- [ ] Keep old i18n files in codebase until Phase 4 complete
- [ ] Feature flag implemented and tested
- [ ] Both systems can coexist
- [ ] Clear documentation of rollback steps

---

## 8. Testing Strategy

### 8.1 Testing Pyramid

```
                    ▲
                   /│\
                  / │ \     E2E Tests (10%)
                 /  │  \    - Full user flows
                /───│───\   - Language switching
               /    │    \  
              /     │     \ Integration Tests (30%)
             /      │      \- Provider + Components
            /───────│───────\- Cache + API
           /        │        \
          /         │         \ Unit Tests (60%)
         /          │          \- Service methods
        /           │           \- Cache logic
       ─────────────┴────────────- Queue management
```

### 8.2 Test Coverage Requirements

| Component | Min Coverage | Critical Paths |
|-----------|--------------|----------------|
| AzureTranslatorService | 90% | translate(), translateBatch() |
| TranslationCache | 85% | get(), set(), invalidate() |
| TranslationProvider | 80% | Context value updates |
| useTranslation hook | 80% | translate function |
| withAzureTranslation HOC | 75% | Props injection |

### 8.3 Manual Testing Checklist

```
Pre-Release Manual Testing
□ Fresh install - translations load correctly
□ Language switch VI → EN - all text updates
□ Language switch EN → VI - all text updates
□ Airplane mode - fallback translations work
□ Slow network (3G) - loading states appear
□ API error simulation - graceful degradation
□ App backgrounded/foregrounded - state preserved
□ App killed and reopened - language preference saved
□ All screens visited - no missing translations
□ Long text content - properly translated
□ Special characters - handled correctly
□ RTL languages (if supported) - layout correct
```

---

## 9. Cost Projections

### 9.1 Azure Translator Pricing

| Tier | Price | Included |
|------|-------|----------|
| Free (F0) | $0/month | 2M characters |
| Standard (S1) | $10/1M characters | Pay as you go |

### 9.2 Estimated Usage

**Assumptions:**
- ~150 unique translation keys
- Average 20 characters per translation
- 2 languages (VI, EN)
- 1,000 daily active users
- 5 screen views per user per day

**Monthly Calculation:**

| Scenario | Calculation | Characters/Month |
|----------|-------------|------------------|
| **Best Case** (95% cache hit) | 150 × 20 × 1000 × 30 × 0.05 | 4.5M |
| **Expected** (80% cache hit) | 150 × 20 × 1000 × 30 × 0.20 | 18M |
| **Worst Case** (50% cache hit) | 150 × 20 × 1000 × 30 × 0.50 | 45M |

### 9.3 Monthly Cost Estimate

| Scenario | Characters | Cost |
|----------|------------|------|
| Best Case | 4.5M | $25 |
| Expected | 18M | $160 |
| Worst Case | 45M | $430 |

### 9.4 Cost Optimization Strategies

1. **Aggressive Caching** - Target 90%+ cache hit rate
2. **Batch Translations** - Reduce API calls by 80%
3. **Pre-translate Static Content** - One-time cost for UI strings
4. **Smart Invalidation** - Only refresh stale translations
5. **Usage Monitoring** - Alert at 80% budget threshold

---

## Appendix A: File Changes Summary

### Files to Create

| File | Purpose |
|------|---------|
| `src/services/translation/AzureTranslatorService.ts` | API client |
| `src/services/translation/TranslationCache.ts` | Caching logic |
| `src/services/translation/TranslationQueue.ts` | Request batching |
| `src/context/TranslationContext.tsx` | React context |
| `src/hooks/useTranslation.ts` | Translation hook |
| `src/hoc/withAzureTranslation.tsx` | HOC for class components |
| `src/data/baseTranslations.ts` | English source texts |
| `src/config/featureFlags.ts` | Feature toggles |

### Files to Modify

| File | Changes |
|------|---------|
| `src/container/AppContainer.tsx` | Replace LanguageProvider |
| `src/component/LanguageDropdown.tsx` | Update hook usage |
| `src/container/screens/Home/HomeScreen.tsx` | Replace HOC and t() calls |
| `src/container/screens/Profile/Settings.tsx` | Replace HOC and t() calls |
| `.env` | Add Azure credentials |

### Files to Delete

| File | Reason |
|------|--------|
| `src/i18n/index.tsx` | Replaced by new system |
| `src/i18n/withTranslation.tsx` | Replaced by new HOC |

---

## Appendix B: API Reference

### Azure Translator API

```typescript
// Translate endpoint
POST https://api.cognitive.microsofttranslator.com/translate
  ?api-version=3.0
  &from=en
  &to=vi

Headers:
  Ocp-Apim-Subscription-Key: <API_KEY>
  Ocp-Apim-Subscription-Region: southeastasia
  Content-Type: application/json

Body:
[
  { "text": "Settings" },
  { "text": "Save" },
  { "text": "Cancel" }
]

Response:
[
  { "translations": [{ "text": "Cài đặt", "to": "vi" }] },
  { "translations": [{ "text": "Lưu", "to": "vi" }] },
  { "translations": [{ "text": "Hủy", "to": "vi" }] }
]
```

---

> **Document prepared for:** Travel Da Nang Development Team  
> **Last updated:** December 16, 2024  
> **Status:** Ready for Review and Approval

