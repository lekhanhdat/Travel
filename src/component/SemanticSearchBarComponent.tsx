/**
 * SemanticSearchBarComponent
 * Enhanced search bar with semantic search support using AI
 * Uses semantic (AI) search by default for intelligent results
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Searchbar} from 'react-native-paper';
import colors from '../common/colors';
import sizes from '../common/sizes';
import {convertCitationVietnameseUnsigned} from '../utils/Utils';
import {
  searchSemantic,
  EntityType,
  debounce,
} from '../services/semantic.api';

interface SemanticSearchBarComponentProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  onSearch: (filteredData: T[], searchValue: string, isSemanticSearch: boolean) => void;
  onSubmitSearch?: (filteredData: T[], searchValue: string, isSemanticSearch: boolean) => void; // Called when user explicitly submits
  placeholder?: string;
  containerStyle?: any;
  entityType: EntityType; // 'location' | 'festival' | 'item'
  idField?: keyof T; // Field to match entity_id from semantic search
}

interface SemanticSearchBarComponentState<T> {
  searchValue: string;
  useSemanticSearch: boolean;
  isSearching: boolean;
  lastFilteredData: T[]; // Store last filtered results for submit
}

export default class SemanticSearchBarComponent<T> extends React.PureComponent<
  SemanticSearchBarComponentProps<T>,
  SemanticSearchBarComponentState<T>
> {
  private debouncedSearch: ReturnType<typeof debounce> | null = null;

  constructor(props: SemanticSearchBarComponentProps<T>) {
    super(props);
    this.state = {
      searchValue: '',
      useSemanticSearch: true, // Default to semantic search (AI-powered)
      isSearching: false,
      lastFilteredData: props.data, // Initialize with all data
    };
  }

  componentDidMount() {
    // Create debounced search function for semantic search
    this.debouncedSearch = debounce(this.performSemanticSearch, 500);
  }

  // Keyword-based filtering (existing logic)
  filterDataKeyword = (searchValue: string): T[] => {
    const {data, searchFields} = this.props;
    if (!searchValue || searchValue.trim().length === 0) {return data;}

    const normalizedSearch = convertCitationVietnameseUnsigned(searchValue)
      ?.toLowerCase()
      .trim();

    return data.filter(item => {
      return searchFields.some(field => {
        const fieldValue = item[field];
        if (fieldValue === null || fieldValue === undefined) {return false;}
        const normalizedFieldValue = convertCitationVietnameseUnsigned(
          String(fieldValue),
        )?.toLowerCase();
        return normalizedFieldValue?.includes(normalizedSearch);
      });
    });
  };

  /**
   * Similarity Score Filtering Logic:
   *
   * PRIMARY RULE: Display ALL results with similarity score > 0.5, sorted descending
   * FALLBACK RULE: If fewer than 10 results have score > 0.5, display top 10 results
   *                with highest similarity scores (even if below 0.5)
   *
   * Examples:
   * - 15 results with score > 0.5 → display all 15
   * - 5 results with score > 0.5 → display top 10 overall (5 above + 5 below 0.5)
   * - 0 results with score > 0.5 → display top 10 with highest scores
   */
  private readonly SIMILARITY_THRESHOLD = 0.5;
  private readonly MIN_RESULTS_COUNT = 10;

  // Semantic search using AI - returns results and stores in state
  performSemanticSearch = async (query: string): Promise<T[]> => {
    const {data, entityType, idField = 'Id' as keyof T} = this.props;

    console.log('🔍 [SemanticSearch] Starting search...');
    console.log('  📋 Query:', query);
    console.log('  📋 Entity type:', entityType);
    console.log('  📋 ID field:', String(idField));
    console.log('  📋 Data count:', data.length);

    if (!query || query.trim().length < 2) {
      console.log('  ⚠️ Query too short, returning all data');
      this.setState({isSearching: false, lastFilteredData: data});
      return data;
    }

    this.setState({isSearching: true});
    try {
      console.log('  🌐 Calling semantic search API...');

      /**
       * Semantic Search Strategy:
       *
       * We request MORE results from backend with LOW min_score (0.1) to ensure
       * we have enough candidates for our frontend filtering logic.
       *
       * Frontend applies the actual filtering:
       * - All results with score > 0.5 are shown
       * - If fewer than 10 above threshold, show top 10 overall
       */
      const response = await searchSemantic({
        query: query.trim(),
        entity_types: [entityType],
        top_k: 50,        // Request more results to ensure we have enough candidates
        min_score: 0.1,   // Low threshold - let frontend handle filtering
      });

      console.log('  📊 API Response:', {
        success: response.success,
        resultsCount: response.results?.length || 0,
        topScores: response.results?.slice(0, 3).map(r => r.score.toFixed(2)),
        error: response.error,
      });

      if (response.success && response.results && response.results.length > 0) {
        // Log API result IDs - Backend returns "id", NOT "entity_id"
        const apiResultIds = response.results.map(r => r.id);
        console.log('  🔢 API returned IDs:', apiResultIds);

        // Log local data IDs for comparison
        const localIds = data.slice(0, 5).map(item => {
          const id = item[idField] || (item as any).id || (item as any).Id;
          return { id, type: typeof id };
        });
        console.log('  📋 Local data IDs (first 5):', localIds);

        // Create score map for all results
        const scoreMap = new Map(response.results.map(r => [r.id, r.score]));

        // Create a Set with both number and string versions for robust matching
        const resultIdSet = new Set<number | string>();
        response.results.forEach(r => {
          resultIdSet.add(r.id);
          resultIdSet.add(String(r.id));
        });

        // Match local data with API results and attach scores
        const matchedWithScores: Array<{item: T; score: number}> = [];
        data.forEach(item => {
          const itemId = item[idField] || (item as any).id || (item as any).Id;
          const matchesNumber = resultIdSet.has(Number(itemId));
          const matchesString = resultIdSet.has(String(itemId));
          if (matchesNumber || matchesString) {
            const score = scoreMap.get(Number(itemId)) || 0;
            matchedWithScores.push({item, score});
          }
        });

        console.log('  📊 Total matched items:', matchedWithScores.length);

        // Sort all matched items by score (highest first)
        matchedWithScores.sort((a, b) => b.score - a.score);

        // Apply filtering logic:
        // 1. Count items with score > threshold
        const aboveThreshold = matchedWithScores.filter(
          m => m.score > this.SIMILARITY_THRESHOLD
        );
        console.log(`  📊 Items above ${this.SIMILARITY_THRESHOLD} threshold:`, aboveThreshold.length);

        let finalResults: T[];

        if (aboveThreshold.length >= this.MIN_RESULTS_COUNT) {
          // PRIMARY RULE: Show all results above threshold
          console.log(`  ✅ Using PRIMARY rule: ${aboveThreshold.length} results above threshold`);
          finalResults = aboveThreshold.map(m => m.item);
        } else {
          // FALLBACK RULE: Show top MIN_RESULTS_COUNT results
          const topResults = matchedWithScores.slice(0, this.MIN_RESULTS_COUNT);
          console.log(`  ⚡ Using FALLBACK rule: showing top ${topResults.length} results`);
          finalResults = topResults.map(m => m.item);
        }

        // Log final results with scores
        if (finalResults.length > 0) {
          console.log('  📊 Final results sorted by relevance:');
          finalResults.slice(0, 5).forEach((item, i) => {
            const id = Number((item[idField] || (item as any).id || (item as any).Id));
            const name = (item as any).name || (item as any).Name || 'Unknown';
            const score = scoreMap.get(id) || 0;
            console.log(`    ${i + 1}. "${name}" (score: ${score.toFixed(2)})`);
          });
        }

        this.setState({lastFilteredData: finalResults, isSearching: false});
        return finalResults;
      } else {
        console.log('  ⚠️ No semantic results, falling back to keyword search');
        const filtered = this.filterDataKeyword(query);
        console.log('  📝 Keyword search results:', filtered.length);
        this.setState({lastFilteredData: filtered, isSearching: false});
        return filtered;
      }
    } catch (error) {
      console.error('  ❌ Semantic search error:', error);
      const filtered = this.filterDataKeyword(query);
      console.log('  📝 Fallback keyword results:', filtered.length);
      this.setState({lastFilteredData: filtered, isSearching: false});
      return filtered;
    }
  };

  handleSearchChange = (text: string) => {
    const {data} = this.props;
    const {useSemanticSearch} = this.state;
    this.setState({searchValue: text});

    if (useSemanticSearch) {
      // Debounced semantic search - stores results but doesn't navigate
      if (this.debouncedSearch) {
        this.debouncedSearch(text);
      }
    } else {
      // Keyword search - update filtered data in state
      const filtered = text.trim() ? this.filterDataKeyword(text) : data;
      this.setState({lastFilteredData: filtered});
    }
  };

  // Called when user explicitly submits (presses Enter or search button)
  handleSubmitSearch = async () => {
    const {onSubmitSearch, onSearch, data} = this.props;
    const {searchValue, useSemanticSearch, isSearching} = this.state;

    console.log('🚀 [Submit] handleSubmitSearch called');
    console.log('  📋 searchValue:', searchValue);
    console.log('  📋 useSemanticSearch:', useSemanticSearch);
    console.log('  📋 isSearching:', isSearching);
    console.log('  📋 data.length:', data.length);

    // Don't submit if already searching
    if (isSearching) {
      console.log('  ⏳ Search in progress, waiting...');
      return;
    }

    // For semantic search, always run a fresh search on submit to ensure results are current
    let results: T[];
    if (useSemanticSearch && searchValue.trim().length >= 2) {
      console.log('  🧠 Running semantic search...');
      results = await this.performSemanticSearch(searchValue);
    } else {
      console.log('  🔤 Running keyword search...');
      results = searchValue.trim() ? this.filterDataKeyword(searchValue) : data;
      this.setState({lastFilteredData: results});
    }

    console.log('  📤 Final results to submit:', results.length);
    console.log('  📋 First result:', results[0] ? JSON.stringify(results[0]).substring(0, 100) : 'none');

    // Call the submit callback if provided, otherwise fall back to onSearch
    if (onSubmitSearch) {
      console.log('  ➡️ Calling onSubmitSearch callback');
      onSubmitSearch(results, searchValue, useSemanticSearch);
    } else {
      console.log('  ➡️ Calling onSearch callback (fallback)');
      onSearch(results, searchValue, useSemanticSearch);
    }
  };

  toggleSearchMode = () => {
    const {data, onSearch} = this.props;
    const newMode = !this.state.useSemanticSearch;
    this.setState({useSemanticSearch: newMode, searchValue: ''});
    onSearch(data, '', newMode); // Reset results
  };

  /**
   * Resets the search - public method called by parent components
   */
  resetSearch = () => {
    this.setState({searchValue: '', isSearching: false});
  };

  /**
   * Gets the current search value - public method called by parent components
   */
  getSearchValue = (): string => {
    return this.state.searchValue;
  };

  render() {
    const {placeholder = 'Tìm kiếm...', containerStyle} = this.props;
    const {searchValue, isSearching} = this.state;

    return (
      <View style={[styles.container, containerStyle]}>
        <Searchbar
          value={searchValue}
          onChangeText={this.handleSearchChange}
          onSubmitEditing={this.handleSubmitSearch}
          onIconPress={this.handleSubmitSearch}
          placeholder={placeholder}
          style={styles.searchbar}
          inputStyle={styles.input}
          loading={isSearching}
          iconColor={colors.primary_950}
          placeholderTextColor={colors.primary_600}
        />
      </View>
    );
  }
}

// Match original SearchBarComponent styles
const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: sizes._16sdp,
    marginHorizontal: sizes._16sdp,
    backgroundColor: '#fff',
    borderRadius: 30,
    elevation: 7,
  },
  searchbar: {
    backgroundColor: colors.primary_200,
    color: colors.black,
    flex: 1,
  },
  input: {
    color: colors.black,
    fontFamily: 'GoogleSans_Regular',
  },
});

