import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileImage, Settings, Wand2, Download, HelpCircle } from 'lucide-react';
import type { 
  Tile, 
  TileAtlas, 
  TileClassification, 
  EnvironmentType, 
  GridConfig,
  APIResponse 
} from '../../shared/types';
import { 
  GRID_PRESETS, 
  MAP_SIZE_PRESETS, 
  ENVIRONMENT_TYPES,
  APP_CONFIG 
} from '../../shared/constants';

// UI Components
const Button = ({ 
  variant = 'primary', 
  className = '', 
  children, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white'
  };
  
  const finalClassName = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();
  
  return (
    <button className={finalClassName} {...props}>
      {children}
    </button>
  );
};

const Input = ({ 
  className = '', 
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement>) => {
  const baseClasses = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500';
  const finalClassName = `${baseClasses} ${className}`.trim();
  
  return <input className={finalClassName} {...props} />;
};

const Select = ({ value, onChange, options, className = '' }: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 ${className}`}
  >
    {options.map(({ value, label }) => (
      <option key={value} value={value}>{label}</option>
    ))}
  </select>
);

const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
      {content}
    </div>
  </div>
);

// Generic API wrapper
const createAPI = (baseURL = '/api') => {
  const request = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    console.log(`Making API request to: ${baseURL}${endpoint}`);
    console.log('Request options:', options);
    
    try {
      const response = await fetch(`${baseURL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
      
      console.log(`API response status: ${response.status}`);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API response:', result);
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  return {
    extractTiles: (formData: FormData) => {
      console.log('Extracting tiles with FormData');
      console.log('FormData entries:', Array.from(formData.entries()));
      return fetch(`${baseURL}/extract-tiles`, { 
        method: 'POST', 
        body: formData 
      }).then(response => {
        console.log(`Extract tiles response status: ${response.status}`);
        console.log('Extract tiles response headers:', Object.fromEntries(response.headers.entries()));
        if (!response.ok) {
          return response.text().then(text => {
            console.error('Extract tiles error response:', text);
            throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
          });
        }
        return response.json();
      }).then(result => {
        console.log('Extract tiles response:', result);
        return result;
      }).catch(error => {
        console.error('Extract tiles request failed:', error);
        throw error;
      });
    },
    generateMap: (data: any) => {
      console.log('Generating map with data:', data);
      return request('/generate-map', { method: 'POST', body: JSON.stringify(data) });
    },
  };
};

const api = createAPI();

// State management with useReducer
interface AppState {
  tileAtlas: TileAtlas | null;
  selectedTiles: Set<string>;
  tileClassifications: Map<string, TileClassification>;
  isExtracting: boolean;
  isGenerating: boolean;
  generatedMapData: string | null;
  error: string | null;
  isDragging: boolean;
  config: {
    grid: GridConfig;
    selectedPreset: string;
    tileSize: number;
    mapSize: number;
    environmentType: string;
  };
}

type AppAction = 
  | { type: 'SET_EXTRACTING'; payload: boolean }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TILE_ATLAS'; payload: TileAtlas }
  | { type: 'SET_SELECTED_TILES'; payload: Set<string> }
  | { type: 'SET_TILE_CLASSIFICATIONS'; payload: Map<string, TileClassification> }
  | { type: 'SET_GENERATED_MAP'; payload: string | null }
  | { type: 'SET_DRAGGING'; payload: boolean }
  | { type: 'UPDATE_CONFIG'; payload: Partial<AppState['config']> };

const initialState: AppState = {
  tileAtlas: null,
  selectedTiles: new Set(),
  tileClassifications: new Map(),
  isExtracting: false,
  isGenerating: false,
  generatedMapData: null,
  error: null,
  isDragging: false,
  config: {
    grid: { type: 'auto' },
    selectedPreset: 'auto',
    tileSize: APP_CONFIG.DEFAULT_TILE_SIZE,
    mapSize: APP_CONFIG.DEFAULT_MAP_SIZE,
    environmentType: 'auto',
  },
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_EXTRACTING':
      return { ...state, isExtracting: action.payload };
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TILE_ATLAS':
      return { ...state, tileAtlas: action.payload };
    case 'SET_SELECTED_TILES':
      return { ...state, selectedTiles: action.payload };
    case 'SET_TILE_CLASSIFICATIONS':
      return { ...state, tileClassifications: action.payload };
    case 'SET_GENERATED_MAP':
      return { ...state, generatedMapData: action.payload };
    case 'SET_DRAGGING':
      return { ...state, isDragging: action.payload };
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    default:
      return state;
  }
};

// Main App Component
export default function App() {
  const [state, dispatch] = React.useReducer(appReducer, initialState);
  const { tileAtlas, selectedTiles, tileClassifications, isExtracting, isGenerating, generatedMapData, error, isDragging, config } = state;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test API connectivity on component mount
  React.useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('/api/');
        const data = await response.json();
        console.log('Backend connection test successful:', data);
      } catch (err) {
        console.error('Backend connection test failed:', err);
        dispatch({ type: 'SET_ERROR', payload: 'Cannot connect to backend server' });
      }
    };
    
    testConnection();
  }, []);

  const handleGridConfigChange = (value: string) => {
    const newConfig: Partial<AppState['config']> = { selectedPreset: value };
    
    if (value === 'auto') {
      newConfig.grid = { type: 'auto' };
    } else if (value === 'custom') {
      newConfig.grid = { type: 'custom' };
    } else {
      const preset = GRID_PRESETS.find(p => p.value === value);
      if (preset && 'cols' in preset && 'rows' in preset) {
        newConfig.grid = { type: 'preset', cols: preset.cols, rows: preset.rows };
      }
    }
    
    dispatch({ type: 'UPDATE_CONFIG', payload: newConfig });
    
    // Re-extract tiles if an image is already uploaded
    if (fileInputRef.current?.files?.[0] && newConfig.grid) {
      setTimeout(() => {
        const file = fileInputRef.current!.files![0];
        extractTiles(file, newConfig.grid, config.tileSize);
      }, 100);
    }
  };

  const extractTiles = useCallback(async (file: File, gridConfig?: GridConfig, tileSize?: number) => {
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_EXTRACTING', payload: true });

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('gridConfig', JSON.stringify(gridConfig || config.grid));
      formData.append('tileSize', (tileSize || config.tileSize).toString());

      const result = await api.extractTiles(formData);
      
      if (result.success && result.data) {
        dispatch({ type: 'SET_TILE_ATLAS', payload: result.data });
        
        // Auto-select all tiles and use their classifications
        const allTileIds = new Set<string>(result.data.tiles.map((tile: Tile) => tile.id));
        dispatch({ type: 'SET_SELECTED_TILES', payload: allTileIds });
        
        const classifications = new Map();
        result.data.tiles.forEach((tile: Tile) => {
          classifications.set(tile.id, tile.classification);
        });
        dispatch({ type: 'SET_TILE_CLASSIFICATIONS', payload: classifications });
      } else {
        throw new Error(result.error || 'Failed to extract tiles');
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to extract tiles' });
    } finally {
      dispatch({ type: 'SET_EXTRACTING', payload: false });
    }
  }, [config.grid, config.tileSize]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await extractTiles(file);
  }, [extractTiles]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch({ type: 'SET_DRAGGING', payload: true });
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      dispatch({ type: 'SET_DRAGGING', payload: false });
    }
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch({ type: 'SET_DRAGGING', payload: false });

    const files = Array.from(event.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      // Update the file input to reflect the dropped file
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(imageFile);
        fileInputRef.current.files = dataTransfer.files;
      }
      
      await extractTiles(imageFile);
    } else {
      dispatch({ type: 'SET_ERROR', payload: 'Please drop an image file (PNG, JPG, WebP, GIF)' });
    }
  }, [extractTiles]);

  const handleTileClick = (tileId: string, event: React.MouseEvent) => {
    const newSelected = new Set(selectedTiles);
    
    if (event.ctrlKey || event.metaKey) {
      if (newSelected.has(tileId)) {
        newSelected.delete(tileId);
      } else {
        newSelected.add(tileId);
      }
    } else {
      newSelected.clear();
      newSelected.add(tileId);
    }
    
    dispatch({ type: 'SET_SELECTED_TILES', payload: newSelected });
  };

  const updateTileClassification = (classification: TileClassification) => {
    if (selectedTiles.size === 0) {
      dispatch({ type: 'SET_ERROR', payload: 'Please select tiles first' });
      return;
    }

    const newClassifications = new Map(tileClassifications);
    selectedTiles.forEach(tileId => {
      newClassifications.set(tileId, classification);
    });
    dispatch({ type: 'SET_TILE_CLASSIFICATIONS', payload: newClassifications });
    dispatch({ type: 'SET_SELECTED_TILES', payload: new Set() });
  };

  const generateMap = async () => {
    console.log('Generate map button clicked');
    console.log('Current tileAtlas:', tileAtlas);
    console.log('Current tileClassifications:', tileClassifications);
    console.log('Current config:', config);

    if (!tileAtlas) {
      dispatch({ type: 'SET_ERROR', payload: 'Please upload and extract tiles first' });
      return;
    }

    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_GENERATING', payload: true });

    try {
      const tilesByType: Record<TileClassification, string[]> = {
        floor: [],
        wall: [],
        decoration: [],
      };

      tileAtlas.tiles.forEach(tile => {
        const classification = tileClassifications.get(tile.id) || tile.classification;
        tilesByType[classification].push(tile.id);
      });

      console.log('Tiles by type:', tilesByType);

      const requestData = {
        atlasId: tileAtlas.id,
        width: config.mapSize,
        height: config.mapSize,
        tileSize: config.tileSize,
        environmentType: config.environmentType,
        tilesByType,
      };

      console.log('Sending request data:', requestData);

      const result = await api.generateMap(requestData);

      console.log('API response received:', result);

      if (result.success && result.data) {
        console.log('Map generation successful, rendering to canvas');
        renderMapToCanvas(result.data);
      } else {
        throw new Error(result.error || 'Failed to generate map');
      }
    } catch (err) {
      console.error('Map generation error:', err);
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to generate map' });
    } finally {
      dispatch({ type: 'SET_GENERATING', payload: false });
    }
  };

  const renderMapToCanvas = (mapData: any) => {
    console.log('renderMapToCanvas called with:', mapData);
    
    const canvas = canvasRef.current;
    if (!canvas || !tileAtlas) {
      console.log('Canvas or tileAtlas not available:', { canvas: !!canvas, tileAtlas: !!tileAtlas });
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Could not get canvas context');
      return;
    }

    console.log('Setting canvas dimensions:', mapData.width * mapData.tileSize, 'x', mapData.height * mapData.tileSize);
    canvas.width = mapData.width * mapData.tileSize;
    canvas.height = mapData.height * mapData.tileSize;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the actual map
    if (mapData.cells && Array.isArray(mapData.cells)) {
      console.log('Rendering map with cells:', mapData.cells.length);
      
      // Create a map of tile IDs to their image data
      const tileMap = new Map();
      tileAtlas.tiles.forEach(tile => {
        tileMap.set(tile.id, tile.imageData);
      });

      console.log('Created tile map with', tileMap.size, 'tiles');

      // Render each cell
      for (let y = 0; y < mapData.cells.length; y++) {
        for (let x = 0; x < mapData.cells[y].length; x++) {
          const cell = mapData.cells[y][x];
          
          if (cell.tileId) {
            const tileImageData = tileMap.get(cell.tileId);
            if (tileImageData) {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(
                  img,
                  x * mapData.tileSize,
                  y * mapData.tileSize,
                  mapData.tileSize,
                  mapData.tileSize
                );
              };
              img.src = tileImageData;
            } else {
              // Fallback: draw colored square
              const tile = tileAtlas.tiles.find(t => t.id === cell.tileId);
              if (tile) {
                let color = '#333';
                switch (tile.classification) {
                  case 'floor': color = '#8b5a2b'; break;
                  case 'wall': color = '#666'; break;
                  case 'decoration': color = '#4ade80'; break;
                }
                ctx.fillStyle = color;
                ctx.fillRect(
                  x * mapData.tileSize,
                  y * mapData.tileSize,
                  mapData.tileSize,
                  mapData.tileSize
                );
              }
            }
          }
        }
      }
    } else {
      // Fallback display
      console.log('No cells found in map data, showing fallback');
      ctx.fillStyle = '#666';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Map structure not recognized', canvas.width/2, canvas.height/2);
      console.warn('Map data structure unexpected:', mapData);
    }
    
    // Update the data URL after a short delay to allow images to load
    setTimeout(() => {
      console.log('Setting generated map data URL');
      dispatch({ type: 'SET_GENERATED_MAP', payload: canvas.toDataURL() });
    }, 500);
  };

  const exportMap = () => {
    if (!generatedMapData) {
      dispatch({ type: 'SET_ERROR', payload: 'No map to export' });
      return;
    }

    const link = document.createElement('a');
    link.download = 'generated-map.png';
    link.href = generatedMapData;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Smart 2D Map Generator</h1>
          <p className="text-gray-400 mb-4">AI-powered tile classification and intelligent map generation</p>
          <div className="flex justify-center items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-400">Frontend Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-400">Backend: {window.location.protocol}//{window.location.hostname}:8891</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* File Upload */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                1. Upload Tileset
              </h3>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 group ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-500/10 scale-105 shadow-lg shadow-blue-500/25' 
                    : 'border-gray-600 hover:border-blue-400 hover:bg-gray-700/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileImage className={`w-12 h-12 mx-auto mb-4 transition-all duration-300 ${
                  isDragging 
                    ? 'text-blue-400 scale-110' 
                    : 'text-gray-400 group-hover:text-blue-400'
                }`} />
                <p className={`mb-2 font-medium transition-colors duration-300 ${
                  isDragging ? 'text-blue-300' : ''
                }`}>
                  {isDragging 
                    ? 'Drop your texture atlas here!' 
                    : 'Click to select or drag & drop a texture atlas'
                  }
                </p>
                <p className={`text-sm transition-colors duration-300 ${
                  isDragging ? 'text-blue-200' : 'text-gray-400'
                }`}>
                  PNG, JPG, WebP, GIF (max 10MB)
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  Supports automatic tile detection or custom grid configurations
                </div>
              </div>

              {/* Grid Configuration */}
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    Grid Configuration
                    <Tooltip content="Choose how to split your tileset image into individual tiles">
                      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </label>
                  <Select
                    value={config.selectedPreset}
                    onChange={handleGridConfigChange}
                    options={GRID_PRESETS.map(preset => ({ 
                      value: preset.value, 
                      label: preset.label 
                    }))}
                  />
                </div>
                
                {config.selectedPreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Columns"
                      value={config.grid.cols || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newCols = parseInt(e.target.value) || undefined;
                        const newGrid = { ...config.grid, cols: newCols };
                        dispatch({ 
                          type: 'UPDATE_CONFIG', 
                          payload: { 
                            grid: newGrid
                          } 
                        });
                        // Re-extract tiles if an image is already uploaded
                        if (fileInputRef.current?.files?.[0] && newCols) {
                          setTimeout(() => {
                            const file = fileInputRef.current!.files![0];
                            extractTiles(file, newGrid, config.tileSize);
                          }, 500);
                        }
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Rows"
                      value={config.grid.rows || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newRows = parseInt(e.target.value) || undefined;
                        const newGrid = { ...config.grid, rows: newRows };
                        dispatch({ 
                          type: 'UPDATE_CONFIG', 
                          payload: { 
                            grid: newGrid
                          } 
                        });
                        // Re-extract tiles if an image is already uploaded
                        if (fileInputRef.current?.files?.[0] && newRows) {
                          setTimeout(() => {
                            const file = fileInputRef.current!.files![0];
                            extractTiles(file, newGrid, config.tileSize);
                          }, 500);
                        }
                      }}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    Tile Size
                    <Tooltip content="The size in pixels for each individual tile">
                      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </label>
                  <Input
                    type="number"
                    value={config.tileSize}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newTileSize = parseInt(e.target.value) || APP_CONFIG.DEFAULT_TILE_SIZE;
                      dispatch({ 
                        type: 'UPDATE_CONFIG', 
                        payload: { tileSize: newTileSize } 
                      });
                      // Re-extract tiles if an image is already uploaded
                      if (fileInputRef.current?.files?.[0]) {
                        setTimeout(() => {
                          const file = fileInputRef.current!.files![0];
                          extractTiles(file, config.grid, newTileSize);
                        }, 500);
                      }
                    }}
                    min={APP_CONFIG.MIN_TILE_SIZE}
                    max={APP_CONFIG.MAX_TILE_SIZE}
                  />
                </div>
              </div>
            </div>

            {/* Tile Classification */}
            {tileAtlas && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  2. Classify Tiles
                </h3>
                
                <p className="text-sm text-gray-400 mb-4">
                  Select tiles and assign classifications. Ctrl+Click for multiple selection.
                </p>

                <div className="mb-4 space-y-2">
                  <Button 
                    onClick={() => updateTileClassification('floor')}
                    disabled={selectedTiles.size === 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Mark as Floor ({selectedTiles.size} selected)
                  </Button>
                  <Button 
                    onClick={() => updateTileClassification('wall')}
                    disabled={selectedTiles.size === 0}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    Mark as Wall ({selectedTiles.size} selected)
                  </Button>
                  <Button 
                    onClick={() => updateTileClassification('decoration')}
                    disabled={selectedTiles.size === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Mark as Decoration ({selectedTiles.size} selected)
                  </Button>
                </div>

                {/* Tiles Grid */}
                <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto bg-gray-700 p-2 rounded">
                  {tileAtlas.tiles.map((tile) => (
                    <div
                      key={tile.id}
                      className={`relative border-2 rounded cursor-pointer transition-all hover:scale-110 ${
                        selectedTiles.has(tile.id)
                          ? selectedTiles.size > 1
                            ? 'border-green-400 shadow-lg shadow-green-400/50'
                            : 'border-blue-400 shadow-lg shadow-blue-400/50'
                          : 'border-transparent hover:border-gray-400'
                      }`}
                      onClick={(e) => handleTileClick(tile.id, e)}
                    >
                      <img 
                        src={tile.imageData} 
                        alt={`Tile ${tile.id}`}
                        className="w-full h-full object-cover rounded"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-xs text-center py-0.5 rounded-b">
                        {tileClassifications.get(tile.id) || tile.classification}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map Generation Settings */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                3. Generate Map
              </h3>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    Map Size
                    <Tooltip content="The dimensions of the generated map in tiles">
                      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </label>
                  <Select
                    value={config.mapSize.toString()}
                    onChange={(value) => dispatch({ 
                      type: 'UPDATE_CONFIG', 
                      payload: { mapSize: parseInt(value) } 
                    })}
                    options={MAP_SIZE_PRESETS.map(preset => ({ 
                      value: preset.value.toString(), 
                      label: preset.label 
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    Environment Type
                    <Tooltip content="The style of map to generate">
                      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help" />
                    </Tooltip>
                  </label>
                  <Select
                    value={config.environmentType}
                    onChange={(value) => dispatch({ 
                      type: 'UPDATE_CONFIG', 
                      payload: { environmentType: value } 
                    })}
                    options={ENVIRONMENT_TYPES.map(type => ({ 
                      value: type.value, 
                      label: type.label 
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={generateMap}
                  disabled={!tileAtlas || isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      Generate Map
                    </div>
                  )}
                </Button>

                <Button
                  onClick={exportMap}
                  disabled={!generatedMapData}
                  variant="secondary"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export as PNG
                </Button>

                {/* Debug Button for Testing */}
                <Button
                  onClick={() => {
                    console.log('=== DEBUG INFO ===');
                    console.log('tileAtlas:', tileAtlas);
                    console.log('selectedTiles:', selectedTiles);
                    console.log('tileClassifications:', tileClassifications);
                    console.log('config:', config);
                    console.log('isGenerating:', isGenerating);
                    console.log('generatedMapData:', !!generatedMapData);
                    console.log('error:', error);
                    
                    if (tileAtlas) {
                      const tilesByType: Record<TileClassification, string[]> = {
                        floor: [],
                        wall: [],
                        decoration: [],
                      };

                      tileAtlas.tiles.forEach(tile => {
                        const classification = tileClassifications.get(tile.id) || tile.classification;
                        tilesByType[classification].push(tile.id);
                      });

                      console.log('tilesByType would be:', tilesByType);
                    }
                  }}
                  variant="secondary"
                  className="w-full text-xs bg-gray-700 hover:bg-gray-600"
                >
                  🐛 Debug Info
                </Button>
              </div>
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 h-full">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                {!tileAtlas ? 'Upload Preview' : !generatedMapData ? 'Tileset Preview' : 'Generated Map'}
                {tileAtlas && !generatedMapData && (
                  <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded text-xs ml-auto">
                    {tileAtlas.tiles.length} tiles
                  </span>
                )}
                {generatedMapData && (
                  <span className="text-sm bg-green-600 text-white px-2 py-1 rounded text-xs ml-auto">
                    Ready
                  </span>
                )}
              </h3>
              
              <div className="flex justify-center items-center bg-gray-700 rounded-lg p-4 min-h-96 relative">
                {!tileAtlas ? (
                  <div className="text-center text-gray-400">
                    <FileImage className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No tileset uploaded yet</p>
                    <p className="text-sm">Upload a tileset to see the extracted tiles here</p>
                  </div>
                ) : !generatedMapData ? (
                  <div className="w-full">
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-medium text-gray-300 mb-2">Extracted Tiles Preview</h4>
                      <p className="text-sm text-gray-400">
                        {tileAtlas.tiles.length} tiles extracted • Ready for classification and map generation
                      </p>
                    </div>
                    
                    {/* Tileset Preview Grid */}
                    <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-8 gap-2">
                        {tileAtlas.tiles.map((tile, index) => (
                          <div
                            key={tile.id}
                            className="relative border border-gray-600 rounded hover:border-gray-400 transition-colors group"
                          >
                            <img 
                              src={tile.imageData} 
                              alt={`Tile ${index + 1}`}
                              className="w-full h-full object-cover rounded"
                              style={{ imageRendering: 'pixelated' }}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {tileClassifications.get(tile.id) || tile.classification}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-400">
                        Classify tiles on the left, then generate your map!
                      </p>
                    </div>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    className="border-2 border-gray-600 rounded max-w-full max-h-full shadow-lg"
                    style={{ imageRendering: 'pixelated' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-md z-50 animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="text-red-200">⚠️</div>
              <div className="flex-1">
                <div className="font-medium text-sm">Error</div>
                <div className="text-red-100 text-sm">{error}</div>
              </div>
              <button 
                onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
                className="text-red-200 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading States */}
        {(isExtracting || isGenerating) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-600 shadow-2xl">
              <div className="w-12 h-12 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-lg font-medium mb-2">
                {isExtracting ? 'Extracting tiles from image...' : 'Generating map...'}
              </div>
              <div className="text-sm text-gray-400">
                {isExtracting ? 'Analyzing tileset and classifying tiles' : 'Creating procedural map layout'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
