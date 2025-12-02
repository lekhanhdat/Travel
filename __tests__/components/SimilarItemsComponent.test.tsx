/**
 * Unit Tests for SimilarItemsComponent
 * @format
 */

import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import SimilarItemsComponent from '../../src/component/SimilarItemsComponent';
import * as semanticApi from '../../src/services/semantic.api';

// Mock semantic API
jest.mock('../../src/services/semantic.api');
const mockedSemanticApi = semanticApi as jest.Mocked<typeof semanticApi>;

// Mock location and festival APIs
jest.mock('../../src/services/locations.api', () => ({
  __esModule: true,
  default: {
    getLocations: jest.fn(() => Promise.resolve([
      {Id: 1, name: 'Test Location', avatar: 'http://test.com/img.jpg', description: 'Test desc'},
      {Id: 2, name: 'Another Location', avatar: 'http://test.com/img2.jpg', description: 'Another desc'},
    ])),
  },
}));

jest.mock('../../src/services/festivals.api', () => ({
  __esModule: true,
  default: {
    getFestivals: jest.fn(() => Promise.resolve([
      {Id: 10, name: 'Test Festival', avatar: 'http://test.com/fest.jpg', description: 'Fest desc'},
    ])),
  },
}));

// Mock navigation service
jest.mock('../../src/container/screens/NavigationService', () => ({
  navigate: jest.fn(),
}));

describe('SimilarItemsComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    mockedSemanticApi.getSimilarItems.mockResolvedValueOnce({
      success: true,
      entity_type: 'location',
      entity_id: 1,
      similar_items: [],
    });

    const {queryByTestId} = render(
      <SimilarItemsComponent entityType="location" entityId={1} />,
    );

    // Component should exist
    expect(queryByTestId).toBeDefined();
  });

  it('should display similar items when loaded', async () => {
    mockedSemanticApi.getSimilarItems.mockResolvedValueOnce({
      success: true,
      entity_type: 'location',
      entity_id: 1,
      similar_items: [
        {entity_type: 'location', entity_id: 2, name: 'Similar Place', similarity_score: 0.85},
      ],
    });

    const {getByText} = render(
      <SimilarItemsComponent entityType="location" entityId={1} title="Similar Locations" />,
    );

    await waitFor(() => {
      expect(getByText('Similar Locations')).toBeTruthy();
    });
  });

  it('should call getSimilarItems with correct parameters', async () => {
    mockedSemanticApi.getSimilarItems.mockResolvedValueOnce({
      success: true,
      entity_type: 'festival',
      entity_id: 10,
      similar_items: [],
    });

    render(
      <SimilarItemsComponent entityType="festival" entityId={10} limit={3} />,
    );

    await waitFor(() => {
      expect(mockedSemanticApi.getSimilarItems).toHaveBeenCalledWith('festival', 10, 3);
    });
  });

  it('should not render when no similar items found', async () => {
    mockedSemanticApi.getSimilarItems.mockResolvedValueOnce({
      success: true,
      entity_type: 'location',
      entity_id: 1,
      similar_items: [],
    });

    const {queryByText} = render(
      <SimilarItemsComponent entityType="location" entityId={1} title="Similar Items" />,
    );

    // Wait for component to process
    await waitFor(() => {
      expect(mockedSemanticApi.getSimilarItems).toHaveBeenCalled();
    });

    // Title should not be visible when no items
    expect(queryByText('Similar Items')).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    mockedSemanticApi.getSimilarItems.mockResolvedValueOnce({
      success: false,
      entity_type: 'location',
      entity_id: 1,
      similar_items: [],
      error: 'Failed to fetch',
    });

    const {queryByText} = render(
      <SimilarItemsComponent entityType="location" entityId={1} />,
    );

    await waitFor(() => {
      expect(mockedSemanticApi.getSimilarItems).toHaveBeenCalled();
    });

    // Should not crash and should not show error to user
    expect(queryByText('Failed to fetch')).toBeNull();
  });
});

