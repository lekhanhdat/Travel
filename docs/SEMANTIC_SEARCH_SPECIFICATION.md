# Semantic Search System - Technical Specification

## Document Information
- **Version**: 1.1.0
- **Date**: 2025-11-30
- **Author**: August (Multi-Language Specification-Driven Development Agent)
- **Last Updated By**: Augment Agent (Troubleshooting Guide Addition)
- **Status**: Active

### Changelog
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-28 | August | Initial specification |
| 1.1.0 | 2025-11-30 | Augment Agent | Added Section 15: Troubleshooting Guide with issue history, debugging checklist, API contract documentation, and configuration reference |

---

## 1. Executive Summary

This specification defines the implementation of a Semantic Search system for the Travel mobile application, enabling natural language queries, context-aware responses, personalized recommendations, and multi-modal search capabilities (text-to-text, text-to-image, image-to-text).

### 1.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRAVEL APP ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐         ┌──────────────────────────────────────┐  │
│  │   MOBILE APP         │         │   FASTAPI BACKEND                    │  │
│  │   (React Native)     │◄───────►│   (Python 3.8+)                      │  │
│  │                      │  REST   │                                      │  │
│  │  • ChatbotScreen     │   API   │  ┌────────────────────────────────┐  │  │
│  │  • SearchComponent   │         │  │  SEMANTIC SEARCH ENGINE        │  │  │
│  │  • RecommendWidget   │         │  │  ├─ CLIP Embeddings            │  │  │
│  │                      │         │  │  ├─ OpenAI text-embedding-3    │  │  │
│  └──────────────────────┘         │  │  └─ FAISS Vector Index         │  │  │
│                                   │  └────────────────────────────────┘  │  │
│                                   │                                      │  │
│                                   │  ┌────────────────────────────────┐  │  │
│                                   │  │  MEMORY MANAGEMENT             │  │  │
│                                   │  │  ├─ Long-term (NocoDB)         │  │  │
│                                   │  │  └─ Short-term (Session)       │  │  │
│                                   │  └────────────────────────────────┘  │  │
│                                   │                                      │  │
│                                   │  ┌────────────────────────────────┐  │  │
│                                   │  │  LLM INTEGRATION               │  │  │
│                                   │  │  └─ OpenAI GPT-4o-mini         │  │  │
│                                   │  └────────────────────────────────┘  │  │
│                                   └──────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         NOCODB DATABASE                               │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │   │
│  │  │  Locations  │ │  Festivals  │ │  Accounts   │ │  Embeddings     │ │   │
│  │  │  (existing) │ │  (existing) │ │  (existing) │ │  (NEW)          │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘ │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────────────┐ │   │
│  │  │  Items      │ │  Reviews    │ │  UserMemory (NEW)               │ │   │
│  │  │  (existing) │ │  (existing) │ │  ConversationHistory (NEW)      │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Current System Analysis

### 2.1 Existing Frontend Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | React Native 0.74.2 | Cross-platform mobile development |
| Language | TypeScript | Type-safe JavaScript |
| Navigation | React Navigation (Stack, Bottom Tabs) | Screen navigation |
| State | AsyncStorage + LocalStorageCommon | Local data persistence |
| HTTP Client | Axios | API communication with NocoDB |
| Chatbot | ChatbotScreen.tsx | Current AI chat interface |
| Search | SearchBarComponent.tsx | Keyword-based search with Vietnamese normalization |

### 2.2 Existing Backend Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | FastAPI 0.108.0+ | Python web framework |
| Server | Uvicorn/Gunicorn | ASGI/WSGI server |
| AI | OpenAI GPT-4o-mini | Vision and chat capabilities |
| Deployment | Digital Ocean App Platform | Cloud hosting |
| Endpoints | `/detect`, `/payments/*` | Current API routes |

### 2.3 Existing Database Schema (NocoDB)

| Table | ID | Fields |
|-------|-----|--------|
| Accounts | `mad8fvjhd0ba1bk` | Id, userName, password, fullName, email, avatar, balance |
| Locations | `mfz84cb0t9a84jt` | Id, name, avatar, address, description, lat, long, types, reviews, voiceName, images, videos |
| Items | `m0s4uwjesun4rl9` | Id, name, description, video, images, location |
| Festivals | `mktzgff8mpu2c32` | Id, name, types, description, event_time, location, price_level, rating, reviews, images |

### 2.4 Current Chatbot Flow

```
User Input → ChatbotScreen → chatbot.api.ts → OpenAI API (Direct) → Response
                                    ↓
                            AsyncStorage (Chat History)
```

**Limitations Identified:**
1. No vector database for semantic search
2. No context retrieval from location/festival data
3. Chat history stored locally only (not synced across devices)
4. No personalization based on user preferences
5. No similar item suggestions
6. Direct OpenAI calls from frontend (no backend proxy for RAG)

---

## 3. Requirements Specification (EARS Notation)

### 3.1 Functional Requirements

#### FR-001: Semantic Search - Text-to-Text
**EARS**: When the user enters a natural language query, the system shall search the vector database and return the top-k most semantically similar locations/festivals/items.

| Attribute | Value |
|-----------|-------|
| Priority | HIGH |
| Input | Natural language query (Vietnamese/English) |
| Output | Ranked list of matching entities with similarity scores |
| Performance | Response time < 2 seconds |

#### FR-002: Semantic Search - Text-to-Image
**EARS**: When the user enters a text description, the system shall return images that semantically match the description using CLIP embeddings.

| Attribute | Value |
|-----------|-------|
| Priority | MEDIUM |
| Input | Text description (e.g., "beach sunset Da Nang") |
| Output | Ranked list of matching images |
| Performance | Response time < 3 seconds |

#### FR-003: Semantic Search - Image-to-Text
**EARS**: When the user uploads an image, the system shall identify the location/item and return relevant textual information.

| Attribute | Value |
|-----------|-------|
| Priority | MEDIUM |
| Input | Image file (JPEG, PNG) |
| Output | Location/item identification with description |
| Performance | Response time < 5 seconds |

#### FR-004: Context-Aware Question Answering
**EARS**: When the user asks a question in the chatbot, the system shall retrieve relevant context from the vector database and generate an informed response using RAG.

| Attribute | Value |
|-----------|-------|
| Priority | HIGH |
| Input | User question + conversation history |
| Output | Contextually relevant answer with source citations |
| Performance | Response time < 4 seconds |

#### FR-005: Similar Suggestions
**EARS**: When the user views a location/festival, the system shall display similar items based on vector similarity.

| Attribute | Value |
|-----------|-------|
| Priority | MEDIUM |
| Input | Current entity ID |
| Output | List of 5-10 similar entities |
| Performance | Response time < 2 seconds |

#### FR-006: Personalized Recommendations
**EARS**: When the user opens the app, the system shall display personalized recommendations based on their interaction history and preferences.

| Attribute | Value |
|-----------|-------|
| Priority | MEDIUM |
| Input | User ID, interaction history |
| Output | Personalized list of locations/festivals |
| Performance | Response time < 3 seconds |

#### FR-007: Long-term Memory Storage
**EARS**: When the user interacts with the chatbot, the system shall store relevant user preferences and facts in NocoDB for future personalization.

| Attribute | Value |
|-----------|-------|
| Priority | HIGH |
| Input | Extracted user preferences from conversations |
| Output | Persistent user profile in database |
| Storage | NocoDB UserMemory table |

#### FR-008: Short-term Memory (Conversation Context)
**EARS**: While the user is in a conversation session, the system shall maintain conversation context for coherent multi-turn dialogue.

| Attribute | Value |
|-----------|-------|
| Priority | HIGH |
| Input | Current session messages |
| Output | Context-aware responses |
| Storage | NocoDB ConversationHistory table |

### 3.2 Non-Functional Requirements

#### NFR-001: Scalability
**EARS**: The system shall support up to 10,000 concurrent users without degradation in response time.

#### NFR-002: Cost Optimization
**EARS**: The system shall use OpenAI text-embedding-3-small for embeddings to minimize API costs while maintaining quality.

#### NFR-003: Offline Fallback
**EARS**: When the device is offline, the system shall provide cached responses and queue requests for later processing.

#### NFR-004: Security
**EARS**: The system shall not expose API keys in the frontend; all AI operations shall be proxied through the backend.

#### NFR-005: APK Size
**EARS**: The mobile app APK size shall not increase by more than 5MB due to semantic search features.

---

## 4. API Specification

### 4.1 New Backend Endpoints

#### 4.1.1 POST /api/v1/search/semantic

**Purpose**: Perform semantic search across all entities

**Request**:
```json
{
  "query": "string",
  "search_type": "text" | "image",
  "entity_types": ["locations", "festivals", "items"],
  "top_k": 10,
  "user_id": "optional_string"
}
```

**Response**:
```json
{
  "results": [
    {
      "entity_type": "location",
      "entity_id": 123,
      "name": "Cầu Rồng",
      "description": "...",
      "similarity_score": 0.92,
      "images": ["url1", "url2"]
    }
  ],
  "query_embedding_time_ms": 45,
  "search_time_ms": 12
}
```

#### 4.1.2 POST /api/v1/chat/rag

**Purpose**: RAG-enhanced chatbot with vector context

**Request**:
```json
{
  "message": "string",
  "conversation_id": "uuid",
  "user_id": "optional_string",
  "include_images": false,
  "image_base64": "optional_string"
}
```

**Response**:
```json
{
  "response": "string",
  "sources": [
    {
      "entity_type": "location",
      "entity_id": 123,
      "name": "Cầu Rồng",
      "relevance_score": 0.89
    }
  ],
  "conversation_id": "uuid",
  "suggested_actions": ["view_location", "get_directions"]
}
```

#### 4.1.3 GET /api/v1/recommendations/{user_id}

**Purpose**: Get personalized recommendations

**Response**:
```json
{
  "recommendations": [
    {
      "entity_type": "location",
      "entity_id": 123,
      "name": "Bà Nà Hills",
      "reason": "Based on your interest in mountain destinations",
      "score": 0.85
    }
  ]
}
```

#### 4.1.4 GET /api/v1/similar/{entity_type}/{entity_id}

**Purpose**: Get similar entities

**Response**:
```json
{
  "similar_items": [
    {
      "entity_type": "location",
      "entity_id": 456,
      "name": "Ngũ Hành Sơn",
      "similarity_score": 0.78
    }
  ]
}
```

#### 4.1.5 POST /api/v1/memory/store

**Purpose**: Store user memory/preferences

**Request**:
```json
{
  "user_id": "string",
  "memory_type": "preference" | "fact" | "interaction",
  "content": "string",
  "metadata": {}
}
```

---

## 5. Database Schema (New Tables)

### 5.1 Embeddings Table

**Table Name**: `Embeddings`
**Purpose**: Store vector embeddings for all searchable entities

| Field | Type | Description |
|-------|------|-------------|
| Id | Integer (PK) | Auto-increment primary key |
| entity_type | String | "location" \| "festival" \| "item" |
| entity_id | Integer | Foreign key to source table |
| embedding_type | String | "text" \| "image" \| "combined" |
| embedding_vector | Text (JSON) | Serialized float array (1536 dimensions for text-embedding-3-small) |
| embedding_model | String | Model used (e.g., "text-embedding-3-small", "clip-vit-base-patch32") |
| content_hash | String | MD5 hash of source content for change detection |
| CreatedAt | DateTime | Timestamp |
| UpdatedAt | DateTime | Timestamp |

### 5.2 UserMemory Table

**Table Name**: `UserMemory`
**Purpose**: Store long-term user preferences and facts

| Field | Type | Description |
|-------|------|-------------|
| Id | Integer (PK) | Auto-increment primary key |
| user_id | Integer | Foreign key to Accounts table |
| memory_type | String | "preference" \| "fact" \| "interaction" |
| content | Text | Memory content |
| importance_score | Float | 0.0 - 1.0 importance ranking |
| embedding_vector | Text (JSON) | For semantic retrieval of memories |
| metadata | Text (JSON) | Additional context |
| CreatedAt | DateTime | Timestamp |
| last_accessed | DateTime | For memory decay/cleanup |

### 5.3 ConversationHistory Table

**Table Name**: `ConversationHistory`
**Purpose**: Store conversation sessions for context

| Field | Type | Description |
|-------|------|-------------|
| Id | Integer (PK) | Auto-increment primary key |
| conversation_id | String (UUID) | Unique session identifier |
| user_id | Integer | Foreign key to Accounts table (nullable for anonymous) |
| messages | Text (JSON) | Array of message objects |
| summary | Text | AI-generated conversation summary |
| CreatedAt | DateTime | Session start time |
| UpdatedAt | DateTime | Last message time |
| is_active | Boolean | Whether session is still active |

---

## 6. Technical Implementation Details

### 6.1 Embedding Strategy

#### Text Embeddings (OpenAI text-embedding-3-small)
- **Dimensions**: 1536 (can be reduced to 512 for cost optimization)
- **Cost**: $0.00002 per 1K tokens
- **Use Case**: Location descriptions, festival info, user queries

#### Image Embeddings (CLIP ViT-B/32)
- **Dimensions**: 512
- **Model**: `openai/clip-vit-base-patch32` (open-source, free)
- **Use Case**: Image-to-text search, text-to-image search

### 6.2 FAISS Index Configuration

```python
# Index type: IVF (Inverted File) with Flat quantizer
# Suitable for 10K-100K vectors with good recall

import faiss

# For text embeddings (1536 dimensions)
text_index = faiss.IndexIVFFlat(
    faiss.IndexFlatIP(1536),  # Inner product for cosine similarity
    1536,  # dimension
    100,   # nlist (number of clusters)
    faiss.METRIC_INNER_PRODUCT
)

# For image embeddings (512 dimensions)
image_index = faiss.IndexIVFFlat(
    faiss.IndexFlatIP(512),
    512,
    50,
    faiss.METRIC_INNER_PRODUCT
)
```

### 6.3 RAG Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RAG PIPELINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. QUERY PROCESSING                                             │
│     ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│     │ User Query   │───►│ Embed Query  │───►│ Query Vector │    │
│     └──────────────┘    └──────────────┘    └──────────────┘    │
│                                                                  │
│  2. RETRIEVAL                                                    │
│     ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│     │ Query Vector │───►│ FAISS Search │───►│ Top-K Docs   │    │
│     └──────────────┘    └──────────────┘    └──────────────┘    │
│                                                                  │
│  3. CONTEXT BUILDING                                             │
│     ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│     │ Top-K Docs   │───►│ Rerank       │───►│ Context      │    │
│     │ + User Memory│    │ (optional)   │    │ Window       │    │
│     └──────────────┘    └──────────────┘    └──────────────┘    │
│                                                                  │
│  4. GENERATION                                                   │
│     ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│     │ Context +    │───►│ GPT-4o-mini  │───►│ Response     │    │
│     │ Query        │    │              │    │              │    │
│     └──────────────┘    └──────────────┘    └──────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Memory Management Strategy

#### Long-term Memory (NocoDB)
- **Storage**: UserMemory table
- **Retrieval**: Semantic search on memory embeddings
- **Decay**: Memories not accessed in 90 days are archived
- **Extraction**: LLM extracts key facts from conversations

#### Short-term Memory (Session)
- **Storage**: ConversationHistory table
- **Window**: Last 10 messages + summary of older messages
- **Summarization**: Every 20 messages, generate summary

### 6.5 Cost Optimization Strategies

| Strategy | Implementation | Savings |
|----------|----------------|---------|
| Batch Embeddings | Process in batches of 100 | 20% API cost reduction |
| Caching | Cache embeddings in NocoDB | Avoid re-computation |
| Dimension Reduction | Use 512 dims instead of 1536 | 66% storage reduction |
| Query Caching | Cache frequent query results | 30% API cost reduction |
| Tiered Models | Use GPT-4o-mini for most queries | 90% vs GPT-4 |

---

## 7. Frontend Integration

### 7.1 New TypeScript Interfaces

```typescript
// src/common/types.tsx - Add these interfaces

export interface ISemanticSearchResult {
  entity_type: 'location' | 'festival' | 'item';
  entity_id: number;
  name: string;
  description: string;
  similarity_score: number;
  images?: string[];
}

export interface IRAGChatResponse {
  response: string;
  sources: Array<{
    entity_type: string;
    entity_id: number;
    name: string;
    relevance_score: number;
  }>;
  conversation_id: string;
  suggested_actions?: string[];
}

export interface IUserMemory {
  Id?: number;
  user_id: number;
  memory_type: 'preference' | 'fact' | 'interaction';
  content: string;
  importance_score: number;
  metadata?: Record<string, any>;
  CreatedAt?: string;
}

export interface IRecommendation {
  entity_type: 'location' | 'festival' | 'item';
  entity_id: number;
  name: string;
  reason: string;
  score: number;
  images?: string[];
}
```

### 7.2 New API Service

```typescript
// src/services/semantic.api.ts

import axios from 'axios';
import { env } from '../utils/env';

const BACKEND_URL = env.SERVER_URL;

export const semanticApi = {
  search: async (query: string, entityTypes?: string[], topK = 10) => {
    const response = await axios.post(`${BACKEND_URL}/api/v1/search/semantic`, {
      query,
      search_type: 'text',
      entity_types: entityTypes || ['locations', 'festivals', 'items'],
      top_k: topK,
    });
    return response.data;
  },

  chatRAG: async (message: string, conversationId?: string, userId?: string) => {
    const response = await axios.post(`${BACKEND_URL}/api/v1/chat/rag`, {
      message,
      conversation_id: conversationId,
      user_id: userId,
    });
    return response.data;
  },

  getRecommendations: async (userId: string) => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/recommendations/${userId}`);
    return response.data;
  },

  getSimilar: async (entityType: string, entityId: number) => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/similar/${entityType}/${entityId}`);
    return response.data;
  },
};
```

### 7.3 ChatbotScreen Modifications

Key changes to `ChatbotScreen.tsx`:
1. Replace direct OpenAI calls with backend RAG endpoint
2. Display source citations in responses
3. Show suggested actions as quick replies
4. Sync conversation history to NocoDB
5. Display personalized recommendations on empty state

---

## 8. Backend Implementation

### 8.1 New Python Modules

```
backend/
├── app.py                    # Main FastAPI app (existing)
├── routers/
│   ├── __init__.py
│   ├── search.py             # Semantic search endpoints
│   ├── chat.py               # RAG chat endpoints
│   ├── recommendations.py    # Recommendation endpoints
│   └── memory.py             # Memory management endpoints
├── services/
│   ├── __init__.py
│   ├── embedding_service.py  # OpenAI/CLIP embedding generation
│   ├── faiss_service.py      # FAISS index management
│   ├── rag_service.py        # RAG pipeline orchestration
│   ├── memory_service.py     # User memory management
│   └── nocodb_service.py     # NocoDB integration (existing)
├── models/
│   ├── __init__.py
│   ├── search.py             # Pydantic models for search
│   ├── chat.py               # Pydantic models for chat
│   └── memory.py             # Pydantic models for memory
└── utils/
    ├── __init__.py
    └── config.py             # Configuration management
```

### 8.2 Dependencies (requirements.txt additions)

```
# Vector Search
faiss-cpu==1.7.4
sentence-transformers==2.2.2

# CLIP Model
transformers==4.35.0
torch==2.1.0
Pillow==10.1.0

# OpenAI
openai==1.51.0

# Utilities
numpy==1.24.0
scikit-learn==1.3.0
```

### 8.3 FAISS Index Persistence

```python
# services/faiss_service.py

import faiss
import numpy as np
import os

class FAISSService:
    def __init__(self, index_path: str = "./faiss_indexes"):
        self.index_path = index_path
        self.text_index = None
        self.image_index = None
        self._load_or_create_indexes()

    def _load_or_create_indexes(self):
        text_index_file = os.path.join(self.index_path, "text_index.faiss")
        if os.path.exists(text_index_file):
            self.text_index = faiss.read_index(text_index_file)
        else:
            self.text_index = faiss.IndexFlatIP(1536)

    def save_indexes(self):
        os.makedirs(self.index_path, exist_ok=True)
        faiss.write_index(self.text_index,
                          os.path.join(self.index_path, "text_index.faiss"))

    def search(self, query_vector: np.ndarray, top_k: int = 10):
        distances, indices = self.text_index.search(
            query_vector.reshape(1, -1).astype('float32'),
            top_k
        )
        return distances[0], indices[0]
```

---

## 9. Deployment Considerations

### 9.1 Digital Ocean App Platform Updates

```yaml
# app.yaml additions
services:
  - name: api
    environment_slug: python
    instance_size_slug: professional-xs  # Upgrade for ML workloads
    envs:
      - key: OPENAI_API_KEY
        type: SECRET
      - key: FAISS_INDEX_PATH
        value: /app/faiss_indexes
    # Add persistent storage for FAISS indexes
    volumes:
      - name: faiss-storage
        mount_path: /app/faiss_indexes
        size_gb: 1
```

### 9.2 Startup Sequence

1. Load FAISS indexes from persistent storage
2. Verify NocoDB connection
3. Warm up embedding models (optional)
4. Start FastAPI server

### 9.3 Index Rebuild Strategy

- **Trigger**: Manual or scheduled (daily at 3 AM)
- **Process**:
  1. Fetch all entities from NocoDB
  2. Generate embeddings in batches
  3. Build new FAISS index
  4. Atomic swap with old index
  5. Update Embeddings table in NocoDB

---

## 10. Testing Strategy

### 10.1 Unit Tests

| Component | Test Cases |
|-----------|------------|
| EmbeddingService | Generate text embedding, Generate image embedding, Batch processing |
| FAISSService | Index creation, Search accuracy, Index persistence |
| RAGService | Context retrieval, Response generation, Source citation |
| MemoryService | Store memory, Retrieve relevant memories, Memory decay |

### 10.2 Integration Tests

| Test | Description |
|------|-------------|
| End-to-end search | Query → Embedding → FAISS → Results |
| RAG chat flow | Message → Context → LLM → Response |
| Memory persistence | Store → Retrieve → Verify |

### 10.3 Performance Benchmarks

| Metric | Target | Measurement |
|--------|--------|-------------|
| Search latency (p95) | < 200ms | FAISS search time |
| Embedding generation | < 500ms | OpenAI API call |
| RAG response time | < 4s | End-to-end |
| Index load time | < 5s | Startup |

---

## 11. Implementation Task List

### Phase 1: Backend Foundation (Week 1-2)

- [ ] **Task 1.1**: Set up new backend project structure
  - Create routers/, services/, models/ directories
  - Add new dependencies to requirements.txt

- [ ] **Task 1.2**: Implement EmbeddingService
  - OpenAI text-embedding-3-small integration
  - CLIP model integration for images
  - Batch processing support

- [ ] **Task 1.3**: Implement FAISSService
  - Index creation and management
  - Search functionality
  - Persistence (save/load)

- [ ] **Task 1.4**: Create NocoDB tables
  - Embeddings table
  - UserMemory table
  - ConversationHistory table

### Phase 2: Core Features (Week 3-4)

- [ ] **Task 2.1**: Implement semantic search endpoint
  - POST /api/v1/search/semantic
  - Text-to-text search
  - Text-to-image search

- [ ] **Task 2.2**: Implement RAG chat endpoint
  - POST /api/v1/chat/rag
  - Context retrieval
  - Response generation with sources

- [ ] **Task 2.3**: Implement similar items endpoint
  - GET /api/v1/similar/{entity_type}/{entity_id}

- [ ] **Task 2.4**: Implement recommendations endpoint
  - GET /api/v1/recommendations/{user_id}

### Phase 3: Memory System (Week 5)

- [ ] **Task 3.1**: Implement MemoryService
  - Long-term memory storage
  - Memory retrieval
  - Memory extraction from conversations

- [ ] **Task 3.2**: Implement memory endpoints
  - POST /api/v1/memory/store
  - GET /api/v1/memory/{user_id}

- [ ] **Task 3.3**: Implement conversation history sync
  - Store conversations in NocoDB
  - Session management

### Phase 4: Frontend Integration (Week 6-7)

- [ ] **Task 4.1**: Create semantic.api.ts service
  - All new API endpoints
  - Error handling

- [ ] **Task 4.2**: Update ChatbotScreen
  - Replace direct OpenAI calls with RAG endpoint
  - Display source citations
  - Show suggested actions

- [ ] **Task 4.3**: Add SimilarItemsComponent
  - Display on DetailLocation and DetailFestival screens

- [ ] **Task 4.4**: Add RecommendationsWidget
  - Display on HomeScreen
  - Personalized content

### Phase 5: Testing & Optimization (Week 8)

- [ ] **Task 5.1**: Write unit tests
  - Backend services
  - Frontend API calls

- [ ] **Task 5.2**: Performance optimization
  - Query caching
  - Batch processing
  - Index optimization

- [ ] **Task 5.3**: Cost monitoring
  - OpenAI usage tracking
  - Alert thresholds

### Phase 6: Deployment (Week 9)

- [ ] **Task 6.1**: Update Digital Ocean configuration
  - Add persistent storage
  - Update environment variables

- [ ] **Task 6.2**: Initial data indexing
  - Generate embeddings for all entities
  - Build FAISS indexes

- [ ] **Task 6.3**: Production deployment
  - Deploy backend updates
  - Deploy frontend updates
  - Monitor and verify

---

## 12. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OpenAI API rate limits | Medium | High | Implement retry logic, caching |
| FAISS index corruption | Low | High | Regular backups, atomic updates |
| High API costs | Medium | Medium | Cost monitoring, dimension reduction |
| Slow response times | Medium | Medium | Caching, index optimization |
| Vietnamese text quality | Medium | Medium | Test with Vietnamese queries, fine-tune prompts |

---

## 13. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Search relevance | > 80% user satisfaction | User feedback surveys |
| Response accuracy | > 85% correct answers | Manual evaluation |
| Response time | < 4 seconds (p95) | APM monitoring |
| User engagement | +20% chat interactions | Analytics |
| Cost per query | < $0.01 | OpenAI billing |

---

## 14. Appendix

### A. Vietnamese Text Handling

The system must handle Vietnamese diacritics properly:
- Use UTF-8 encoding throughout
- Normalize text before embedding (NFC normalization)
- Test with common Vietnamese queries

### B. Offline Fallback

When offline:
1. Use cached search results (last 100 queries)
2. Use local chat history
3. Queue new queries for later processing
4. Display "offline mode" indicator

### C. Security Considerations

1. All API keys stored in environment variables
2. Backend proxies all AI API calls
3. User data encrypted at rest in NocoDB
4. Rate limiting on all endpoints
5. Input validation and sanitization

---

## 15. Troubleshooting Guide

This section documents common issues encountered during semantic search development, their root causes, and solutions.

### 15.1 Issue History & Fixes

#### Issue #1: `entity_id` vs `id` Field Mismatch (CRITICAL - FIXED)

**Symptom**: Semantic search returns 0 results despite API returning 10+ successful results.

**Console Logs**:
```
LOG  📊 API Response: {"success": true, "resultsCount": 10}
LOG  🔢 API returned IDs: [undefined, undefined, undefined, undefined, ...]
LOG  ✅ Filtered results: 0
```

**Root Cause**: Field name mismatch between backend and frontend.

| Field | Backend (Python) | Frontend (TypeScript) - WRONG | Frontend - CORRECT |
|-------|-----------------|-------------------------------|-------------------|
| Entity ID | `id` | `entity_id` ❌ | `id` ✅ |
| Total count | `total_count` | `total` ❌ | `total_count` ✅ |

**Backend Response Structure** (`models/search.py`):
```python
class SemanticSearchResult(BaseModel):
    id: int = Field(..., description="Entity ID")  # Returns "id", NOT "entity_id"
    entity_type: EntityType
    title: str
    description: Optional[str]
    score: float
    metadata: Dict[str, Any]
```

**Files Changed**:
- `Travel/src/services/semantic.api.ts` - Changed `entity_id` → `id` in `SearchResult` interface
- `Travel/src/component/SemanticSearchBarComponent.tsx` - Changed `r.entity_id` → `r.id` in all map/filter operations

**Solution Code**:
```typescript
// BEFORE (BROKEN):
const apiResultIds = response.results.map(r => r.entity_id);  // Returns [undefined, ...]

// AFTER (FIXED):
const apiResultIds = response.results.map(r => r.id);  // Returns [1, 5, 12, ...]
```

---

#### Issue #2: Search Mode Toggle Not Working (FIXED)

**Symptom**: UI toggle between semantic/keyword search modes doesn't change actual search behavior.

**Root Cause**: HomeScreen and FestivalsScreen were not using `filteredData` from the search component correctly.

**Files Changed**:
- `Travel/src/container/screens/Home/HomeScreen.tsx`
- `Travel/src/container/screens/Festival/FestivalsScreen.tsx`

---

#### Issue #3: `min_score` Too Permissive (FIXED)

**Symptom**: Semantic search returns irrelevant results.

**Root Cause**: Frontend was using `min_score: 0.1`, which allows results with only 10% similarity.

**Solution**: Changed to `min_score: 0.5` to match backend default.

```typescript
// BEFORE:
const response = await searchSemantic({
  query: query.trim(),
  entity_types: [entityType],
  limit: 20,
  min_score: 0.1,  // Too permissive - allows irrelevant results
});

// AFTER:
const response = await searchSemantic({
  query: query.trim(),
  entity_types: [entityType],
  limit: 15,
  min_score: 0.5,  // Balanced precision/recall (matches backend default)
});
```

---

#### Issue #4: RAG Chat HTTP 422 Error (FIXED)

**Symptom**: Chatbot returns HTTP 422 Unprocessable Entity error.

**Root Cause**: Frontend was sending `query` field but backend expected `message` field.

**Files Changed**: `Travel/src/services/semantic.api.ts`

```typescript
// BEFORE (BROKEN):
const response = await axios.post(`${BACKEND_URL}/api/v1/chat/rag`, {
  query: message,  // Wrong field name
});

// AFTER (FIXED):
const response = await axios.post(`${BACKEND_URL}/api/v1/chat/rag`, {
  message: message,  // Correct field name
});
```

---

#### Issue #5: Clear Chat Session HTTP 422 Error (FIXED)

**Symptom**: Clearing chat session fails with HTTP 422 error.

**Root Cause**: Backend expected `session_id` as query parameter, not in request body.

---

### 15.2 Debugging Console Logs Reference

The `SemanticSearchBarComponent` outputs detailed debug logs. Here's how to interpret them:

#### Log Message Reference

| Log Icon | Message | Meaning | What to Check |
|----------|---------|---------|---------------|
| 🔍 | `[SemanticSearch] Starting search...` | Search initiated | Query text is being processed |
| 📋 | `Query: [text]` | Query text | Verify query is not empty |
| 🌐 | `Calling semantic search API...` | API call starting | Network connectivity |
| 📊 | `API Response: {...}` | API returned | Check `success`, `resultsCount`, `topScores` |
| 🔢 | `API returned IDs: [...]` | IDs from backend | **CRITICAL**: Should be numbers, not `undefined` |
| 📋 | `Local data IDs (first 5): [...]` | Frontend data IDs | Verify IDs match type (number vs string) |
| ✓ | `Match: "Name" (ID=X, score=Y)` | Match found | Verify score is reasonable (> 0.5) |
| ✅ | `Filtered results: N` | Final count | Should match API count if all IDs match |
| 📊 | `Results sorted by relevance:` | Sort confirmation | Results ordered high→low score |
| ⚠️ | `No semantic results, falling back...` | Fallback triggered | API returned no results, using keyword search |
| ❌ | `Semantic search error:` | Error occurred | Check error details for cause |

#### Healthy vs Unhealthy Logs

**✅ Healthy Logs (Working)**:
```
LOG  🔍 [SemanticSearch] Starting search...
LOG    📋 Query: bãi biển đẹp
LOG    🌐 Calling semantic search API...
LOG    📊 API Response: {"success": true, "resultsCount": 8, "topScores": ["0.78", "0.72", "0.68"]}
LOG    🔢 API returned IDs: [5, 12, 3, 8, 15, 22, 7, 18]
LOG    📋 Local data IDs (first 5): [{"id": 1, "type": "number"}, ...]
LOG      ✓ Match: "Bãi biển Mỹ Khê" (ID=3, score=0.68)
LOG      ✓ Match: "Cầu Rồng" (ID=5, score=0.78)
LOG    ✅ Filtered results: 8
LOG    📊 Results sorted by relevance:
LOG      1. "Cầu Rồng" (score: 0.78)
LOG      2. "Bà Nà Hills" (score: 0.72)
```

**❌ Unhealthy Logs (Issue #1 - Field Mismatch)**:
```
LOG  🔍 [SemanticSearch] Starting search...
LOG    📋 Query: bãi biển đẹp
LOG    🌐 Calling semantic search API...
LOG    📊 API Response: {"success": true, "resultsCount": 10}
LOG    🔢 API returned IDs: [undefined, undefined, undefined, ...]  ⚠️ PROBLEM!
LOG    📋 Local data IDs (first 5): [{"id": 1, "type": "number"}, ...]
LOG    ✅ Filtered results: 0  ⚠️ No matches because IDs are undefined!
```

**❌ Unhealthy Logs (API Error)**:
```
LOG  🔍 [SemanticSearch] Starting search...
LOG    📋 Query: test
LOG    🌐 Calling semantic search API...
LOG    📊 API Response: {"success": false, "resultsCount": 0, "error": "Service unavailable"}
LOG    ⚠️ No semantic results, falling back to keyword search
```

---

### 15.3 Step-by-Step Debugging Checklist

When semantic search returns 0 results, follow this checklist:

#### Step 1: Check API Response
```
Look for: 📊 API Response: {"success": true, "resultsCount": X}
```
- [ ] Is `success` = `true`?
- [ ] Is `resultsCount` > 0?
- [ ] Is there an `error` message?

**If API fails**: Check backend logs, verify server is running, check network connectivity.

#### Step 2: Check ID Extraction
```
Look for: 🔢 API returned IDs: [...]
```
- [ ] Are IDs actual numbers (e.g., `[1, 5, 12]`)?
- [ ] Or are they `undefined` (e.g., `[undefined, undefined]`)?

**If IDs are undefined**: Field name mismatch. Check `semantic.api.ts` interface matches backend response.

#### Step 3: Check ID Type Matching
```
Look for: 📋 Local data IDs (first 5): [{"id": 1, "type": "number"}, ...]
```
- [ ] Are local IDs the same type as API IDs?
- [ ] Are local IDs `number` or `string`?

**If types mismatch**: The code handles both via `resultIdSet.add(r.id)` and `resultIdSet.add(String(r.id))`.

#### Step 4: Check Filtering Results
```
Look for: ✅ Filtered results: N
```
- [ ] Does the count match `resultsCount` from API?
- [ ] Are there any `✓ Match:` lines before this?

**If no matches**: IDs in API response don't exist in local data. Verify local data is loaded.

#### Step 5: Check Score Threshold
```
Look for: topScores: ["0.78", "0.72", "0.68"]
```
- [ ] Are scores > 0.5 (minimum threshold)?
- [ ] If all scores are < 0.5, results will be empty.

**If scores too low**: Query may be too vague. Try more specific search terms.

---

### 15.4 Known Issues & Solutions Reference

| # | Symptom | Possible Cause | How to Verify | Solution |
|---|---------|---------------|---------------|----------|
| 1 | Returns 0 results, API shows 10+ | Field name mismatch (`entity_id` vs `id`) | Check log: `🔢 API returned IDs: [undefined, ...]` | Update `semantic.api.ts` interface to match backend |
| 2 | Returns 0 results, API shows 0 | `min_score` too high | Check log: `topScores` values | Lower `min_score` in API call (try 0.3) |
| 3 | Returns 0 results, API error | Backend service down | Check log: `"error": "..."` | Check backend server status |
| 4 | Returns irrelevant results | `min_score` too low | Check log: scores < 0.3 | Increase `min_score` to 0.5+ |
| 5 | Results not sorted | Score map issue | Check sorted results order | Verify `scoreMap.get()` uses correct ID field |
| 6 | HTTP 422 on search | Request payload mismatch | Check network tab in debugger | Verify request fields match backend Pydantic model |
| 7 | Slow search (> 5s) | Large dataset or slow network | Measure API response time | Add timeout, reduce `limit` parameter |
| 8 | Type mismatch warnings | ID field type inconsistency | TypeScript compiler warnings | Use `Number()` and `String()` coercion |

---

### 15.5 API Contract Documentation

#### Semantic Search Endpoint

**Endpoint**: `POST /api/v1/search/semantic`

**Request** (TypeScript → Python):
```typescript
interface SemanticSearchRequest {
  query: string;           // Required: Search query text
  entity_types?: string[]; // Optional: ["location", "festival"]
  limit?: number;          // Optional: Max results (default: 10)
  min_score?: number;      // Optional: Minimum similarity (default: 0.5)
}
```

**Response** (Python → TypeScript):
```typescript
interface SemanticSearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  total_count: number;      // ⚠️ Backend sends "total_count", NOT "total"
  search_time_ms: number;
  search_type: string;
  error?: string;
}

interface SearchResult {
  id: number;              // ⚠️ Backend sends "id", NOT "entity_id"
  entity_type: string;     // "location" | "festival"
  title: string;
  description?: string;
  score: number;           // Cosine similarity: 0.0 - 1.0
  metadata: {
    title?: string;
    description?: string;
    image_url?: string;
    [key: string]: any;
  };
  image_url?: string;
  location?: string;
}
```

#### Score Interpretation

The `score` field represents cosine similarity between query embedding and entity embedding:

| Score Range | Interpretation | Recommendation |
|-------------|----------------|----------------|
| 0.8 - 1.0 | Excellent match | Highly relevant, show first |
| 0.6 - 0.8 | Good match | Relevant, include in results |
| 0.5 - 0.6 | Fair match | Marginally relevant, include with caution |
| 0.3 - 0.5 | Weak match | Loosely related, usually exclude |
| 0.0 - 0.3 | Poor match | Likely irrelevant, exclude |

---

### 15.6 Configuration Reference

#### SemanticSearchBarComponent Parameters

Located in `Travel/src/component/SemanticSearchBarComponent.tsx`:

```typescript
const response = await searchSemantic({
  query: query.trim(),
  entity_types: [entityType],
  limit: 15,       // ← CONFIGURABLE
  min_score: 0.5,  // ← CONFIGURABLE
});
```

| Parameter | Default | Range | Description | When to Adjust |
|-----------|---------|-------|-------------|----------------|
| `limit` | 15 | 1-100 | Maximum number of results | Increase for comprehensive search, decrease for faster response |
| `min_score` | 0.5 | 0.0-1.0 | Minimum similarity threshold | Increase (0.7) for precision, decrease (0.3) for recall |
| `entity_types` | Dynamic | `["location"]`, `["festival"]` | Entity type filter | Based on current screen context |

#### Recommended Configurations

| Use Case | `limit` | `min_score` | Rationale |
|----------|---------|-------------|-----------|
| Default search | 15 | 0.5 | Balanced precision/recall |
| Quick suggestions | 5 | 0.6 | Fast, highly relevant |
| Comprehensive research | 30 | 0.3 | More results, broader coverage |
| Precise matching | 10 | 0.7 | Only very relevant results |
| Similar items | 5-10 | 0.5 | Moderate relevance, limited count |

---

### 15.7 Backend Model Reference

For reference, here are the exact Pydantic models from the backend:

**`models/search.py`**:
```python
class SemanticSearchResult(BaseModel):
    id: int = Field(..., description="Entity ID")
    entity_type: EntityType
    title: str = Field(..., description="Entity title")
    description: Optional[str] = Field(None, description="Entity description")
    score: float = Field(..., ge=0.0, le=1.0, description="Similarity score")
    metadata: Dict[str, Any] = Field(default_factory=dict)
    image_url: Optional[str] = None
    location: Optional[str] = None

class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    search_type: str = Field(default="text")
    entity_types: Optional[List[EntityType]] = None
    top_k: int = Field(default=10, ge=1, le=100, alias="limit")
    min_score: float = Field(default=0.5, ge=0.0, le=1.0)
    user_id: Optional[int] = None

class SemanticSearchResponse(BaseModel):
    success: bool
    query: str
    results: List[SemanticSearchResult]
    total_count: int
    search_time_ms: float
    search_type: str
    error: Optional[str] = None
```

**`models/chat.py`** (for RAG chat):
```python
class ChatSource(BaseModel):
    entity_id: int  # ⚠️ Note: Chat sources use "entity_id", search results use "id"
    entity_type: str
    title: str
    relevance_score: float
    snippet: Optional[str] = None

class RAGChatRequest(BaseModel):
    message: str  # ⚠️ Required field name is "message", not "query"
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    include_sources: bool = True
    max_context_items: int = 5
```

---

*End of Specification Document*


