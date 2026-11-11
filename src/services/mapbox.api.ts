import axios from 'axios';
import {env} from '../utils/env';

const MAPBOX_ACCESS_TOKEN = env.MAPBOX_ACCESS_TOKEN || '';
const MAPBOX_BASE_URL = 'https://api.mapbox.com';

interface DirectionsParams {
  profile: 'driving' | 'driving-traffic' | 'walking' | 'cycling';
  coordinates: string; // "long1,lat1;long2,lat2"
  geometries?: 'geojson' | 'polyline' | 'polyline6';
  overview?: 'full' | 'simplified' | 'false';
  steps?: boolean;
  alternatives?: boolean;
  banner_instructions?: boolean;
  voice_instructions?: boolean;
}

class MapboxApi {
  /**
   * Get directions between two points using Mapbox Directions API
   * @param params DirectionsParams
   * @returns Promise with route data
   */
  async getDirections(params: DirectionsParams) {
    const {
      profile = 'driving',
      coordinates,
      geometries = 'geojson',
      overview = 'full',
      steps = false,
      alternatives = false,
      banner_instructions = false,
      voice_instructions = false,
    } = params;

    const url = `${MAPBOX_BASE_URL}/directions/v5/mapbox/${profile}/${coordinates}`;

    try {

      const response = await axios.get(url, {
        params: {
          access_token: MAPBOX_ACCESS_TOKEN,
          geometries,
          overview,
          steps,
          alternatives,
          banner_instructions,
          voice_instructions,
        },
      });



      return response.data;
    } catch (error: any) {
      console.error('❌ Mapbox Directions API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Convert Mapbox GeoJSON coordinates to array of {latitude, longitude} objects
   * @param coordinates Array of [longitude, latitude] from Mapbox
   * @returns Array of {latitude, longitude} objects
   */
  convertGeoJSONToCoordinates(coordinates: number[][]): {latitude: number; longitude: number}[] {
    return coordinates.map(coord => ({
      longitude: coord[0],
      latitude: coord[1],
    }));
  }

  /**
   * Format distance from meters to human-readable string
   * @param meters Distance in meters
   * @returns Formatted string (e.g., "1.5 km" or "500 m")
   */
  formatDistance(meters: number | null | undefined): string {
    if (meters == null || isNaN(meters)) {
      return '0 m';
    }
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  }

  /**
   * Format duration from seconds to human-readable string
   * @param seconds Duration in seconds
   * @returns Formatted string (e.g., "1 giờ 30 phút" or "45 phút")
   */
  formatDuration(seconds: number | null | undefined): string {
    if (seconds == null || isNaN(seconds)) {
      return '0 giây';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      if (minutes > 0) {
        return `${hours} giờ ${minutes} phút`;
      }
      return `${hours} giờ`;
    }

    if (minutes > 0) {
      return `${minutes} phút`;
    }

    return `${Math.round(seconds)} giây`;
  }
}

export default new MapboxApi();

