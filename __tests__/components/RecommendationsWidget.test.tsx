/**
 * Unit Tests for RecommendationsWidget
 * @format
 */

import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import RecommendationsWidget from '../../src/component/RecommendationsWidget';
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

describe('RecommendationsWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch recommendations on mount', async () => {
    mockedSemanticApi.getRecommendations.mockResolvedValueOnce({
      success: true,
      user_id: 1,
      recommendations: [
        {entity_type: 'location', entity_id: 1, name: 'Rec Place', reason: 'Based on interests', score: 0.9},
      ],
    });

    render(<RecommendationsWidget userId={1} />);

    await waitFor(() => {
      expect(mockedSemanticApi.getRecommendations).toHaveBeenCalledWith(1, 10);
    });
  });

  it('should display title when provided', async () => {
    mockedSemanticApi.getRecommendations.mockResolvedValueOnce({
      success: true,
      user_id: 1,
      recommendations: [
        {entity_type: 'location', entity_id: 1, name: 'Test', reason: 'Test reason', score: 0.9},
      ],
    });

    const {getByText} = render(
      <RecommendationsWidget userId={1} title="Recommended for You" />,
    );

    await waitFor(() => {
      expect(getByText('Recommended for You')).toBeTruthy();
    });
  });

  it('should use custom limit parameter', async () => {
    mockedSemanticApi.getRecommendations.mockResolvedValueOnce({
      success: true,
      user_id: 1,
      recommendations: [],
    });

    render(<RecommendationsWidget userId={1} limit={5} />);

    await waitFor(() => {
      expect(mockedSemanticApi.getRecommendations).toHaveBeenCalledWith(1, 5);
    });
  });

  it('should handle refresh button press', async () => {
    mockedSemanticApi.getRecommendations
      .mockResolvedValueOnce({
        success: true,
        user_id: 1,
        recommendations: [{entity_type: 'location', entity_id: 1, name: 'First', reason: 'R1', score: 0.9}],
      })
      .mockResolvedValueOnce({
        success: true,
        user_id: 1,
        recommendations: [{entity_type: 'location', entity_id: 2, name: 'Second', reason: 'R2', score: 0.8}],
      });

    const {getByTestId} = render(<RecommendationsWidget userId={1} />);

    await waitFor(() => {
      expect(mockedSemanticApi.getRecommendations).toHaveBeenCalledTimes(1);
    });

    // Find and press refresh button
    const refreshButton = getByTestId('refresh-button');
    fireEvent.press(refreshButton);

    await waitFor(() => {
      expect(mockedSemanticApi.getRecommendations).toHaveBeenCalledTimes(2);
    });
  });

  it('should not render when no recommendations', async () => {
    mockedSemanticApi.getRecommendations.mockResolvedValueOnce({
      success: true,
      user_id: 1,
      recommendations: [],
    });

    const {queryByText} = render(
      <RecommendationsWidget userId={1} title="Recommendations" />,
    );

    await waitFor(() => {
      expect(mockedSemanticApi.getRecommendations).toHaveBeenCalled();
    });

    // Title should not be visible when no recommendations
    expect(queryByText('Recommendations')).toBeNull();
  });

  it('should handle API errors', async () => {
    mockedSemanticApi.getRecommendations.mockResolvedValueOnce({
      success: false,
      user_id: 1,
      recommendations: [],
      error: 'Server error',
    });

    const {queryByText} = render(<RecommendationsWidget userId={1} />);

    await waitFor(() => {
      expect(mockedSemanticApi.getRecommendations).toHaveBeenCalled();
    });

    // Should not crash
    expect(queryByText('Server error')).toBeNull();
  });
});

