import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Searchbar} from 'react-native-paper';
import colors from '../common/colors';
import sizes from '../common/sizes';
import {convertCitationVietnameseUnsigned} from '../utils/Utils';

interface SearchBarComponentProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  onSearch: (filteredData: T[], searchValue: string) => void;
  placeholder?: string;
  containerStyle?: any;
  searchbarStyle?: any;
  inputStyle?: any;
}

interface SearchBarComponentState {
  searchValue: string;
}

/**
 * Reusable SearchBar component that filters data based on multiple fields
 * with Vietnamese diacritics-insensitive search
 *
 * @template T - The type of data being searched
 * @param data - Array of data to search through
 * @param searchFields - Array of field names to search in
 * @param onSearch - Callback function that receives filtered data and search value
 * @param placeholder - Placeholder text for the search bar
 * @param containerStyle - Custom styles for the container
 * @param searchbarStyle - Custom styles for the searchbar
 * @param inputStyle - Custom styles for the input
 */
export default class SearchBarComponent<T> extends React.PureComponent<
  SearchBarComponentProps<T>,
  SearchBarComponentState
> {
  constructor(props: SearchBarComponentProps<T>) {
    super(props);
    this.state = {
      searchValue: '',
    };
  }

  /**
   * Filters data based on search value across multiple fields
   * Supports Vietnamese diacritics-insensitive search
   */
  filterData = (searchValue: string): T[] => {
    const {data, searchFields} = this.props;

    // If search is empty, return all data
    if (!searchValue || searchValue.trim().length === 0) {
      return data;
    }

    const normalizedSearch = convertCitationVietnameseUnsigned(searchValue)
      ?.toLowerCase()
      .trim();

    const filtered = data.filter(item => {
      // Check if any of the specified fields match the search
      return searchFields.some(field => {
        const fieldValue = item[field];

        // Handle null/undefined values
        if (fieldValue === null || fieldValue === undefined) {
          return false;
        }

        // Convert field value to string and normalize
        const normalizedFieldValue = convertCitationVietnameseUnsigned(
          String(fieldValue),
        )?.toLowerCase();

        return normalizedFieldValue?.includes(normalizedSearch);
      });
    });

    // 🔍 DEBUG: Log search results (only in development)
    if (__DEV__) {
      console.log('========================================');
      console.log(`✅ Search results: ${filtered.length} items found`);
      if (filtered.length > 0 && filtered.length <= 5) {
        console.log('📋 Results:', filtered.map((item: any) => item.name || item.toString()).join(', '));
      }
      console.log('========================================');
    }

    return filtered;
  };

  /**
   * Handles search text change
   */
  handleSearchChange = (text: string) => {
    this.setState({searchValue: text});
  };

  /**
   * Handles search icon press
   */
  handleSearchPress = () => {
    const filteredData = this.filterData(this.state.searchValue);
    this.props.onSearch(filteredData, this.state.searchValue);
  };

  /**
   * Resets the search
   */
  resetSearch = () => {
    this.setState({searchValue: ''});
  };

  /**
   * Gets the current search value
   */
  getSearchValue = (): string => {
    return this.state.searchValue;
  };

  render() {
    const {
      placeholder = 'Tìm kiếm...',
      containerStyle,
      searchbarStyle,
      inputStyle,
    } = this.props;

    return (
      <View style={[styles.defaultContainer, containerStyle]}>
        <Searchbar
          value={this.state.searchValue}
          onChangeText={this.handleSearchChange}
          placeholder={placeholder}
          style={[styles.defaultSearchbar, searchbarStyle]}
          inputStyle={[styles.defaultInput, inputStyle]}
          onIconPress={this.handleSearchPress}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  defaultContainer: {
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
  defaultSearchbar: {
    backgroundColor: colors.primary_200,
    color: colors.black,
    flex: 1,
  },
  defaultInput: {
    color: colors.black,
    fontFamily: 'GoogleSans_Regular',
  },
});

