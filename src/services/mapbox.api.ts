import axios from 'axios';

const MAPBOX_ACCESS_TOKEN = 'sk.eyJ1IjoibGVraGFuaGRhdCIsImEiOiJjbWdsdTdpOXIwOW43MmpyNTB3cGhyNWd0In0.Ddl4CSNIDIjkqGMEz-cS4A';
const MAPBOX_BASE_URL = 'https://api.mapbox.com';

interface DirectionsParams {
  profile: 'driving' | 'driving-traffic' | 'walking' | 'cycling';
  coordinates: string; // "long1,lat1;long2,lat2"
  geometries?: 'geojson' | 'polyline' | 'polyline6';
  overview?: 'full' | 'simplified' | 'false';
  steps?: boolean;
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
    } = params;

    const url = `${MAPBOX_BASE_URL}/directions/v5/mapbox/${profile}/${coordinates}`;

    try {
      console.log('🗺️ Mapbox Directions API Request:', url);
      
      const response = await axios.get(url, {
        params: {
          access_token: MAPBOX_ACCESS_TOKEN,
          geometries,
          overview,
          steps,
        },
      });

      console.log('✅ Mapbox Directions API Response:', response.data);
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
}

export default new MapboxApi();

