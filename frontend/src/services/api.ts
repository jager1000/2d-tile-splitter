import axios, { AxiosResponse } from 'axios';
import { APP_CONFIG } from '@/constants';
import type {
  APIResponse,
  TileAtlas,
  TileExtractionParams,
  TileClassificationResult,
  MapGenerationParams,
  GeneratedMap,
} from '@/types';

const api = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse<APIResponse>) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export class TileAtlasService {
  static async extractTiles(params: TileExtractionParams): Promise<TileAtlas> {
    const formData = new FormData();
    formData.append('image', params.imageFile);
    formData.append('gridConfig', JSON.stringify(params.gridConfig));
    formData.append('tileSize', params.tileSize.toString());

    const response = await api.post<APIResponse<TileAtlas>>(
      '/tiles/extract',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to extract tiles');
    }

    return response.data.data;
  }

  static async classifyTiles(atlasId: string): Promise<TileClassificationResult[]> {
    const response = await api.post<APIResponse<TileClassificationResult[]>>(
      '/tiles/classify',
      { atlasId }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to classify tiles');
    }

    return response.data.data;
  }

  static async updateTileClassification(
    tileId: string,
    classification: string
  ): Promise<void> {
    const response = await api.patch<APIResponse>(
      `/tiles/${tileId}/classification`,
      { classification }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update classification');
    }
  }

  static async getAtlas(id: string): Promise<TileAtlas> {
    const response = await api.get<APIResponse<TileAtlas>>(`/atlases/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get atlas');
    }

    return response.data.data;
  }

  static async listAtlases(): Promise<TileAtlas[]> {
    const response = await api.get<APIResponse<TileAtlas[]>>('/atlases');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to list atlases');
    }

    return response.data.data;
  }
}

export class MapGenerationService {
  static async generateMap(params: MapGenerationParams): Promise<GeneratedMap> {
    const response = await api.post<APIResponse<GeneratedMap>>(
      '/maps/generate',
      params
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to generate map');
    }

    return response.data.data;
  }

  static async getMap(id: string): Promise<GeneratedMap> {
    const response = await api.get<APIResponse<GeneratedMap>>(`/maps/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get map');
    }

    return response.data.data;
  }

  static async saveMap(map: GeneratedMap): Promise<GeneratedMap> {
    const response = await api.post<APIResponse<GeneratedMap>>('/maps', map);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to save map');
    }

    return response.data.data;
  }

  static async listMaps(): Promise<GeneratedMap[]> {
    const response = await api.get<APIResponse<GeneratedMap[]>>('/maps');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to list maps');
    }

    return response.data.data;
  }
}

export default api;
