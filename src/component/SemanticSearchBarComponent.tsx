import FEATURE_FLAGS from '../config/featureFlags';
/**
 * SemanticSearchBarComponent
 * Enhanced search bar with semantic search support using AI
 * Uses semantic (AI) search by default for intelligent results
 */

import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Searchbar} from 'react-native-paper';
import Svg, {Circle, Line} from 'react-native-svg';
import {CloseSvg} from '../assets/ImageSvg';
import colors from '../common/colors';
import sizes from '../common/sizes';
import {searchCatalog} from '../utils/catalogSearch';
import {
  searchSemantic,
  EntityType,
  debounce,
} from '../services/semantic.api';

/**
 * Custom Search Icon Component using react-native-svg
 * Simple magnifying glass icon with circle and handle line
 */
const SearchIcon: React.FC<{color?: string; size?: number}> = ({
  color = colors.primary_950,
  size = 24,
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    {/* Magnifying glass circle */}
    <Circle
      cx="10"
      cy="10"
      r="7"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    {/* Handle line */}
    <Line
      x1="15.5"
      y1="15.5"
      x2="21"
      y2="21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

interface SemanticSearchBarComponentProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  onSearch: (filteredData: T[], searchValue: string, isSemanticSearch: boolean) => void;
  onSubmitSearch?: (filteredData: T[], searchValue: string, isSemanticSearch: boolean) => void; // Called when user explicitly submits
  placeholder?: string;
  containerStyle?: any;
  entityType: EntityType; // 'location' | 'festival' | 'item'
  idField?: keyof T; // Field to match entity_id from semantic search
  onQueryChange?: (text: string) => void; // P11.4: e.g. Home loads hotels on the first keystroke
}

// P11.4: hotels have their own ids (they collide with location ids) and are not in the semantic index,
// so they never match semantic results by id; they are added by keyword instead.
const isHotel = (item: unknown) => (item as {kind?: string} | null)?.kind === 'hotel';

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
      useSemanticSearch: FEATURE_FLAGS.ENABLE_AI, // Default to semantic search (AI-powered)
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

    return searchCatalog(data, searchValue, searchFields);
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
    if (!FEATURE_FLAGS.ENABLE_AI) {return this.filterDataKeyword(query);}
    const {data, entityType, idField = 'id' as keyof T} = this.props;


    if (!query || query.trim().length < 2) {
      this.setState({isSearching: false, lastFilteredData: data});
      return data;
    }

    this.setState({isSearching: true});
    try {

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


      if (response.success && response.results && response.results.length > 0) {
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
          if (isHotel(item)) {return;}
          const itemId = item[idField];
          const matchesNumber = resultIdSet.has(Number(itemId));
          const matchesString = resultIdSet.has(String(itemId));
          if (matchesNumber || matchesString) {
            const score = scoreMap.get(Number(itemId)) || 0;
            matchedWithScores.push({item, score});
          }
        });


        // Sort all matched items by score (highest first)
        matchedWithScores.sort((a, b) => b.score - a.score);

        // Apply filtering logic:
        // 1. Count items with score > threshold
        const aboveThreshold = matchedWithScores.filter(
          m => m.score > this.SIMILARITY_THRESHOLD
        );

        let finalResults: T[];

        if (aboveThreshold.length >= this.MIN_RESULTS_COUNT) {
          // PRIMARY RULE: Show all results above threshold
          finalResults = aboveThreshold.map(m => m.item);
        } else {
          // FALLBACK RULE: Show top MIN_RESULTS_COUNT results
          const topResults = matchedWithScores.slice(0, this.MIN_RESULTS_COUNT);
          finalResults = topResults.map(m => m.item);
        }

        // Hotels matching the words (keyword search) follow the semantic results.
        const hotels = searchCatalog(data.filter(isHotel), query, this.props.searchFields);
        finalResults = [...finalResults, ...hotels];

        this.setState({lastFilteredData: finalResults, isSearching: false});
        return finalResults;
      } else {
        const filtered = this.filterDataKeyword(query);
        this.setState({lastFilteredData: filtered, isSearching: false});
        return filtered;
      }
    } catch (error) {
      console.error('  ❌ Semantic search error:', error);
      const filtered = this.filterDataKeyword(query);
      this.setState({lastFilteredData: filtered, isSearching: false});
      return filtered;
    }
  };

  handleSearchChange = (text: string) => {
    const {data} = this.props;
    this.props.onQueryChange?.(text);
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


    // Don't submit if already searching
    if (isSearching) {
      return;
    }

    // For semantic search, always run a fresh search on submit to ensure results are current
    let results: T[];
    if (useSemanticSearch && searchValue.trim().length >= 2) {
      results = await this.performSemanticSearch(searchValue);
    } else {
      results = searchValue.trim() ? this.filterDataKeyword(searchValue) : data;
      this.setState({lastFilteredData: results});
    }


    // Call the submit callback if provided, otherwise fall back to onSearch
    if (onSubmitSearch) {
      onSubmitSearch(results, searchValue, useSemanticSearch);
    } else {
      onSearch(results, searchValue, useSemanticSearch);
    }
  };

  toggleSearchMode = () => {
    const {data, onSearch} = this.props;
    const newMode = FEATURE_FLAGS.ENABLE_AI && !this.state.useSemanticSearch;
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
          icon={() => <SearchIcon color={colors.primary_950} size={24} />}
          clearIcon={() => searchValue.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                this.setState({searchValue: ''});
                this.props.onSearch(this.props.data, '', this.state.useSemanticSearch);
              }}
              style={styles.clearButton}
            >
              <CloseSvg width={20} height={20} color={colors.primary_700} />
            </TouchableOpacity>
          ) : null}
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
  clearButton: {
    padding: sizes._4sdp,
    marginRight: sizes._4sdp,
  },
});

