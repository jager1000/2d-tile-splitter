import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  TileAtlas,
  GeneratedMap,
  PaintTool,
  StatusMessage,
  MapGenerationParams,
  TileClassification,
} from '@/types';

interface AppState {
  // Atlas state
  currentAtlas: TileAtlas | null;
  selectedTileIds: Set<string>;
  
  // Map state
  currentMap: GeneratedMap | null;
  mapParams: MapGenerationParams;
  
  // Paint tool state
  paintTool: PaintTool;
  
  // UI state
  isLoading: boolean;
  statusMessage: StatusMessage | null;
  
  // Actions
  setCurrentAtlas: (atlas: TileAtlas | null) => void;
  setSelectedTileIds: (ids: Set<string>) => void;
  toggleTileSelection: (id: string, multiSelect?: boolean) => void;
  clearTileSelection: () => void;
  
  setCurrentMap: (map: GeneratedMap | null) => void;
  updateMapParams: (params: Partial<MapGenerationParams>) => void;
  
  setPaintTool: (tool: Partial<PaintTool>) => void;
  togglePaintMode: () => void;
  
  setLoading: (loading: boolean) => void;
  setStatusMessage: (message: StatusMessage | null) => void;
  showStatus: (type: StatusMessage['type'], message: string, duration?: number) => void;
  
  updateTileClassification: (tileId: string, classification: TileClassification) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentAtlas: null,
      selectedTileIds: new Set(),
      currentMap: null,
      mapParams: {
        width: 32,
        height: 32,
        tileSize: 32,
        environmentType: 'auto',
        atlasId: '',
        enabledLayers: {
          floors: true,
          walls: true,
          decorations: true,
        },
      },
      paintTool: {
        selectedTileId: null,
        isActive: false,
        brushSize: 1,
        mode: 'paint',
      },
      isLoading: false,
      statusMessage: null,

      // Actions
      setCurrentAtlas: (atlas) => {
        set({ currentAtlas: atlas });
        if (atlas) {
          set((state) => ({
            mapParams: { ...state.mapParams, atlasId: atlas.id },
          }));
        }
      },

      setSelectedTileIds: (ids) => {
        set({ selectedTileIds: new Set(ids) });
      },

      toggleTileSelection: (id, multiSelect = false) => {
        set((state) => {
          const newSelected = new Set(state.selectedTileIds);
          
          if (!multiSelect) {
            newSelected.clear();
          }
          
          if (newSelected.has(id)) {
            newSelected.delete(id);
          } else {
            newSelected.add(id);
          }
          
          return { selectedTileIds: newSelected };
        });
      },

      clearTileSelection: () => {
        set({ selectedTileIds: new Set() });
      },

      setCurrentMap: (map) => {
        set({ currentMap: map });
      },

      updateMapParams: (params) => {
        set((state) => ({
          mapParams: { ...state.mapParams, ...params },
        }));
      },

      setPaintTool: (tool) => {
        set((state) => ({
          paintTool: { ...state.paintTool, ...tool },
        }));
      },

      togglePaintMode: () => {
        set((state) => ({
          paintTool: { ...state.paintTool, isActive: !state.paintTool.isActive },
        }));
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setStatusMessage: (message) => {
        set({ statusMessage: message });
      },

      showStatus: (type, message, duration = 3000) => {
        const statusMessage: StatusMessage = { type, message, duration };
        set({ statusMessage });
        
        if (duration > 0) {
          setTimeout(() => {
            if (get().statusMessage === statusMessage) {
              set({ statusMessage: null });
            }
          }, duration);
        }
      },

      updateTileClassification: (tileId, classification) => {
        set((state) => {
          if (!state.currentAtlas) return state;
          
          const updatedAtlas = {
            ...state.currentAtlas,
            tiles: state.currentAtlas.tiles.map((tile) =>
              tile.id === tileId ? { ...tile, classification } : tile
            ),
          };
          
          return { currentAtlas: updatedAtlas };
        });
      },
    }),
    {
      name: 'map-generator-store',
    }
  )
);
