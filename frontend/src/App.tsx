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

// Add custom styles
const customStyles = `
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes pulse-slow {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 2s ease-in-out infinite;
  }
  
  /* Custom scrollbar for tile grids */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #374151;
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #6b7280;
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

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
    try {
      const response = await fetch(`${baseURL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    extractTiles: (formData: FormData) => {
      return fetch(`${baseURL}/extract-tiles`, { 
        method: 'POST', 
        body: formData 
      }).then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
          });
        }
        return response.json();
      }).then(result => {
        return result;
      }).catch(error => {
        throw error;
      });
    },
    generateMap: (data: any) => {
      console.log('API: Sending map generation request:', data);
      return request('/generate-map', { method: 'POST', body: JSON.stringify(data) }).then(result => {
        console.log('API: Map generation response:', result);
        return result;
      }).catch(error => {
        console.error('API: Map generation error:', error);
        throw error;
      });
    },
  };
};

const api = createAPI('http://localhost:8891');

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
        const response = await fetch('http://localhost:8891/');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        console.log('Backend connected:', data);
        
        // Show a brief success message
        setTimeout(() => {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: '✅ Backend connected successfully!' 
          });
          setTimeout(() => {
            dispatch({ type: 'SET_ERROR', payload: null });
          }, 2000);
        }, 500);
        
      } catch (err) {
        console.error('Backend connection failed:', err);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: `Cannot connect to backend server: ${err instanceof Error ? err.message : 'Unknown error'}` 
        });
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
    if (!tileAtlas) {
      dispatch({ type: 'SET_ERROR', payload: 'Please upload and extract tiles first' });
      return;
    }

    console.log('Starting map generation...');
    console.log('TileAtlas:', tileAtlas);
    console.log('TileClassifications:', Object.fromEntries(tileClassifications));
    console.log('Config:', config);

    // Build tiles by type using current classifications
    const tilesByType: Record<TileClassification, string[]> = {
      floor: [],
      wall: [],
      decoration: [],
    };

    // Use current tile classifications or fall back to original
    tileAtlas.tiles.forEach(tile => {
      const classification = tileClassifications.get(tile.id) || tile.classification;
      tilesByType[classification].push(tile.id);
    });

    console.log('Tiles by type:', tilesByType);

    // Ensure we have at least floor tiles
    if (tilesByType.floor.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: 'Please classify at least one tile as "Floor"' });
      return;
    }

    // Use floor tiles as fallback for missing types
    if (tilesByType.wall.length === 0) {
      tilesByType.wall = [...tilesByType.floor];
    }
    if (tilesByType.decoration.length === 0) {
      tilesByType.decoration = [...tilesByType.floor];
    }

    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_GENERATING', payload: true });

    try {
      const requestData = {
        atlasId: tileAtlas.id,
        width: config.mapSize,
        height: config.mapSize,
        tileSize: config.tileSize,
        environmentType: config.environmentType,
        tilesByType,
      };

      console.log('Sending request:', requestData);

      const result = await api.generateMap(requestData);
      console.log('Received result:', result);

      if (result.success && result.data) {
        console.log('Map data received, rendering...');
        await renderMapToCanvas(result.data);
      } else {
        throw new Error(result.error || 'Failed to generate map');
      }
    } catch (err) {
      console.error('Map generation error:', err);
      dispatch({ type: 'SET_ERROR', payload: `Map generation failed: ${err instanceof Error ? err.message : 'Unknown error'}` });
    } finally {
      dispatch({ type: 'SET_GENERATING', payload: false });
    }
  };

  const renderMapToCanvas = async (mapData: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !tileAtlas) {
      console.error('Canvas or tileAtlas missing');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    // Set canvas size
    const cellSize = 32; // Fixed cell size for testing
    canvas.width = mapData.width * cellSize;
    canvas.height = mapData.height * cellSize;

    console.log('Rendering map:', {
      mapWidth: mapData.width,
      mapHeight: mapData.height,
      canvasSize: `${canvas.width}x${canvas.height}`,
      cellsData: mapData.cells?.length
    });

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simple rendering - just draw colored squares for now
    if (mapData.cells && Array.isArray(mapData.cells)) {
      for (let y = 0; y < mapData.cells.length; y++) {
        for (let x = 0; x < mapData.cells[y].length; x++) {
          const cell = mapData.cells[y][x];
          
          let color = '#333333'; // default
          if (cell && cell.layer) {
            switch (cell.layer) {
              case 'floor': color = '#8B4513'; break; // brown
              case 'wall': color = '#666666'; break;  // gray
              case 'decoration': color = '#228B22'; break; // green
            }
          }
          
          ctx.fillStyle = color;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          
          // Add border for visibility
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
      
      console.log('Map rendered successfully');
      dispatch({ type: 'SET_GENERATED_MAP', payload: canvas.toDataURL() });
      dispatch({ type: 'SET_ERROR', payload: '✅ Map generated successfully!' });
      setTimeout(() => dispatch({ type: 'SET_ERROR', payload: null }), 2000);
      
    } else {
      console.error('Invalid map data:', mapData);
      // Draw error pattern
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Map Data Error', canvas.width/2, canvas.height/2);
      
      dispatch({ type: 'SET_ERROR', payload: 'Invalid map data structure' });
    }
  };

  const exportMap = () => {
    if (!generatedMapData) {
      dispatch({ type: 'SET_ERROR', payload: 'No map to export' });
      return;
    }

    try {
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      link.download = `map-${config.mapSize}x${config.mapSize}-${timestamp}.png`;
      link.href = generatedMapData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      dispatch({ type: 'SET_ERROR', payload: '✅ Map exported successfully!' });
      setTimeout(() => {
        dispatch({ type: 'SET_ERROR', payload: null });
      }, 2000);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to export map' });
    }
  };

  // Test canvas functionality
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && !generatedMapData) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Initialize canvas with a simple test pattern
        canvas.width = 200;
        canvas.height = 200;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a simple grid pattern to show canvas is working
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        for (let i = 0; i < 200; i += 20) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 200);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(200, i);
          ctx.stroke();
        }
        
        // Add text
        ctx.fillStyle = '#666';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Ready for', 100, 90);
        ctx.fillText('map generation', 100, 110);
      }
    }
  }, [generatedMapData]);
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + G for Generate Map
      if ((event.ctrlKey || event.metaKey) && event.key === 'g' && !isGenerating && tileAtlas) {
        event.preventDefault();
        generateMap();
      }
      
      // Ctrl/Cmd + E for Export
      if ((event.ctrlKey || event.metaKey) && event.key === 'e' && generatedMapData) {
        event.preventDefault();
        exportMap();
      }
      
      // Escape to clear errors
      if (event.key === 'Escape' && error) {
        dispatch({ type: 'SET_ERROR', payload: null });
      }
      
      // Ctrl/Cmd + A to select all tiles (when tiles are available)
      if ((event.ctrlKey || event.metaKey) && event.key === 'a' && tileAtlas) {
        event.preventDefault();
        const allTileIds = new Set(tileAtlas.tiles.map(tile => tile.id));
        dispatch({ type: 'SET_SELECTED_TILES', payload: allTileIds });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, tileAtlas, generatedMapData, error, generateMap, exportMap]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Smart 2D Map Generator
            </h1>
          </div>
          <p className="text-gray-400 mb-6 text-lg">AI-powered tile classification and intelligent map generation</p>
          
          <div className="flex justify-center items-center gap-6 text-sm bg-gray-800 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">Frontend Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-400 font-medium">Backend Connected</span>
            </div>
            
            {/* Keyboard shortcuts help */}
            <Tooltip content="Ctrl+G: Generate Map, Ctrl+E: Export, Ctrl+A: Select All Tiles, ESC: Close Error">
              <div className="flex items-center gap-1 text-gray-400 hover:text-gray-300 cursor-help">
                <span className="text-xs">⌨️</span>
                <span className="text-xs">Shortcuts</span>
              </div>
            </Tooltip>
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
                  <div className="text-xs text-gray-400 mb-3">
                    Selected: {selectedTiles.size} tile{selectedTiles.size !== 1 ? 's' : ''}
                    {selectedTiles.size > 0 && (
                      <span className="ml-2 text-blue-400">
                        (Use Ctrl+Click for multiple selection)
                      </span>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => updateTileClassification('floor')}
                    disabled={selectedTiles.size === 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white transition-all duration-200 transform hover:scale-105"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-green-300 rounded"></div>
                      Mark as Floor
                      {selectedTiles.size > 0 && (
                        <span className="bg-green-800 px-2 py-1 rounded text-xs">
                          {selectedTiles.size}
                        </span>
                      )}
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => updateTileClassification('wall')}
                    disabled={selectedTiles.size === 0}
                    className="w-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 transform hover:scale-105"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-red-300 rounded"></div>
                      Mark as Wall
                      {selectedTiles.size > 0 && (
                        <span className="bg-red-800 px-2 py-1 rounded text-xs">
                          {selectedTiles.size}
                        </span>
                      )}
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => updateTileClassification('decoration')}
                    disabled={selectedTiles.size === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 transform hover:scale-105"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-blue-300 rounded"></div>
                      Mark as Decoration
                      {selectedTiles.size > 0 && (
                        <span className="bg-blue-800 px-2 py-1 rounded text-xs">
                          {selectedTiles.size}
                        </span>
                      )}
                    </div>
                  </Button>
                  
                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">Quick Actions:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => {
                          const allTileIds = new Set(tileAtlas!.tiles.map(tile => tile.id));
                          dispatch({ type: 'SET_SELECTED_TILES', payload: allTileIds });
                        }}
                        variant="secondary"
                        className="text-xs py-1"
                      >
                        Select All
                      </Button>
                      <Button
                        onClick={() => dispatch({ type: 'SET_SELECTED_TILES', payload: new Set() })}
                        variant="secondary"
                        className="text-xs py-1"
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tiles Grid */}
                <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto bg-gray-700 p-3 rounded-lg border border-gray-600 custom-scrollbar">
                  {tileAtlas.tiles.map((tile) => {
                    const classification = tileClassifications.get(tile.id) || tile.classification;
                    const isSelected = selectedTiles.has(tile.id);
                    
                    return (
                      <div
                        key={tile.id}
                        className={`relative border-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 ${
                          isSelected
                            ? selectedTiles.size > 1
                              ? 'border-green-400 shadow-lg shadow-green-400/50 ring-2 ring-green-400/30'
                              : 'border-blue-400 shadow-lg shadow-blue-400/50 ring-2 ring-blue-400/30'
                            : 'border-gray-500 hover:border-gray-300'
                        }`}
                        onClick={(e) => handleTileClick(tile.id, e)}
                      >
                        <img 
                          src={tile.imageData} 
                          alt={`Tile ${tile.id}`}
                          className="w-full h-full object-cover rounded-lg"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        
                        {/* Classification Badge */}
                        <div className={`absolute bottom-0 left-0 right-0 text-xs text-center py-1 rounded-b-lg font-medium ${
                          classification === 'floor' 
                            ? 'bg-green-600/90 text-green-100' 
                            : classification === 'wall'
                            ? 'bg-red-600/90 text-red-100'
                            : 'bg-blue-600/90 text-blue-100'
                        }`}>
                          {classification}
                        </div>
                        
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          </div>
                        )}
                        
                        {/* Tile ID on hover */}
                        <div className="absolute top-1 left-1 bg-black/80 text-white text-xs px-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                          {tile.id}
                        </div>
                      </div>
                    );
                  })}
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
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating Map...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Wand2 className="w-5 h-5" />
                      Generate Map
                    </div>
                  )}
                </Button>

                {/* Test Canvas Button */}
                <Button
                  onClick={() => {
                    // Test canvas with dummy data
                    const dummyMapData = {
                      width: 10,
                      height: 10,
                      cells: Array(10).fill(null).map((_, y) => 
                        Array(10).fill(null).map((_, x) => ({
                          x, y,
                          tileId: 'test',
                          layer: (x === 0 || x === 9 || y === 0 || y === 9) ? 'wall' : 
                                (Math.random() > 0.8) ? 'decoration' : 'floor'
                        }))
                      )
                    };
                    renderMapToCanvas(dummyMapData);
                  }}
                  variant="secondary"
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  🧪 Test Canvas Rendering
                </Button>

                <Button
                  onClick={exportMap}
                  disabled={!generatedMapData}
                  variant="secondary"
                  className="w-full bg-gray-700 hover:bg-gray-600 transition-all duration-200"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Export as PNG
                  </div>
                </Button>

                {/* Generation Statistics */}
                {tileAtlas && (
                  <div className="mt-4 p-3 bg-gray-700 rounded-lg text-sm">
                    <div className="text-gray-300 font-medium mb-2">Tile Statistics:</div>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      {(['floor', 'wall', 'decoration'] as const).map(type => {
                        const count = tileAtlas.tiles.filter(tile => 
                          (tileClassifications.get(tile.id) || tile.classification) === type
                        ).length;
                        const color = type === 'floor' ? 'text-green-400' : type === 'wall' ? 'text-red-400' : 'text-blue-400';
                        
                        return (
                          <div key={type} className="text-center">
                            <div className={`font-medium ${color}`}>{count}</div>
                            <div className="text-gray-400 capitalize">{type}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-2 border-t border-gray-600 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>Total Tiles:</span>
                        <span className="text-white font-medium">{tileAtlas.tiles.length}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Map Cells:</span>
                        <span className="text-white font-medium">{config.mapSize * config.mapSize}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <FileImage className="w-5 h-5" />
                  {!tileAtlas ? 'Upload Preview' : !generatedMapData ? 'Tileset Preview' : 'Generated Map'}
                </h3>
                
                <div className="flex items-center gap-2">
                  {tileAtlas && !generatedMapData && (
                    <span className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full">
                      {tileAtlas.tiles.length} tiles
                    </span>
                  )}
                  {generatedMapData && (
                    <span className="text-sm bg-green-600 text-white px-3 py-1 rounded-full">
                      Map Ready
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-center items-center bg-gray-700 rounded-lg p-4 min-h-96 relative overflow-auto">
                {!tileAtlas ? (
                  <div className="text-center text-gray-400 py-16">
                    <div className="relative">
                      <FileImage className="w-24 h-24 mx-auto mb-6 opacity-30" />
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-xl"></div>
                    </div>
                    <h4 className="text-xl font-medium mb-3 text-gray-300">No tileset uploaded yet</h4>
                    <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                      Upload a tileset image to see the extracted tiles here. 
                      Supports PNG, JPG, WebP, and GIF formats.
                    </p>
                    
                    {/* Map Size Preview Grid */}
                    <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-600 max-w-md mx-auto">
                      <div className="text-center mb-4">
                        <h5 className="text-md font-medium text-gray-300 mb-2">Target Map Size</h5>
                        <p className="text-sm text-gray-400">
                          {config.mapSize}x{config.mapSize} grid ({config.mapSize * config.mapSize} total cells)
                        </p>
                      </div>
                      
                      {/* Grid visualization */}
                      <div className="flex justify-center">
                        <div 
                          className="grid gap-px bg-gray-600 p-1 rounded"
                          style={{
                            gridTemplateColumns: `repeat(${Math.min(config.mapSize, 16)}, 1fr)`,
                            width: '200px',
                            height: '200px'
                          }}
                        >
                          {Array.from({ length: Math.min(config.mapSize * config.mapSize, 256) }, (_, i) => (
                            <div
                              key={i}
                              className="bg-gray-700"
                              style={{ minWidth: '1px', minHeight: '1px' }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {config.mapSize > 16 && (
                        <p className="text-xs text-gray-500 text-center mt-3">
                          Preview limited to 16x16 for display • Actual map will be {config.mapSize}x{config.mapSize}
                        </p>
                      )}
                    </div>
                  </div>
                ) : !generatedMapData ? (
                  <div className="w-full">
                    <div className="text-center mb-6">
                      <h4 className="text-lg font-medium text-gray-300 mb-2">Extracted Tiles Preview</h4>
                      <p className="text-sm text-gray-400">
                        {tileAtlas.tiles.length} tiles extracted • Ready for classification and map generation
                      </p>
                    </div>
                    
                    {/* Tileset Preview Grid */}
                    <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto border border-gray-600 custom-scrollbar">
                      <div className="grid grid-cols-8 gap-2">
                        {tileAtlas.tiles.map((tile, index) => {
                          const classification = tileClassifications.get(tile.id) || tile.classification;
                          
                          return (
                            <div
                              key={tile.id}
                              className="relative border border-gray-600 rounded-lg hover:border-gray-400 transition-all duration-200 group overflow-hidden"
                            >
                              <img 
                                src={tile.imageData} 
                                alt={`Tile ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                                style={{ imageRendering: 'pixelated' }}
                              />
                              
                              {/* Hover overlay with classification */}
                              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                  <div className={`text-xs font-medium mb-1 ${
                                    classification === 'floor' ? 'text-green-400' :
                                    classification === 'wall' ? 'text-red-400' : 'text-blue-400'
                                  }`}>
                                    {classification}
                                  </div>
                                  <div className="text-xs text-gray-300">{tile.id}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Map Size Grid Preview */}
                    <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-600">
                      <div className="text-center mb-4">
                        <h5 className="text-md font-medium text-gray-300 mb-2">Map Preview Grid</h5>
                        <p className="text-sm text-gray-400">
                          {config.mapSize}x{config.mapSize} grid ({config.mapSize * config.mapSize} total cells)
                        </p>
                      </div>
                      
                      {/* Grid visualization */}
                      <div className="flex justify-center mb-4">
                        <div 
                          className="grid gap-px bg-gray-600 p-1 rounded"
                          style={{
                            gridTemplateColumns: `repeat(${Math.min(config.mapSize, 20)}, 1fr)`,
                            maxWidth: '300px',
                            aspectRatio: '1'
                          }}
                        >
                          {Array.from({ length: Math.min(config.mapSize * config.mapSize, 400) }, (_, i) => (
                            <div
                              key={i}
                              className="bg-gray-700 aspect-square"
                              style={{ minWidth: '2px', minHeight: '2px' }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {config.mapSize > 20 && (
                        <p className="text-xs text-gray-500 text-center mb-3">
                          Grid preview limited to 20x20 for display • Actual map will be {config.mapSize}x{config.mapSize}
                        </p>
                      )}
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-400 mb-2">
                          💡 <strong>Tip:</strong> Classify tiles on the left, then generate your map!
                        </p>
                        <p className="text-xs text-gray-500">
                          Use Ctrl+Click to select multiple tiles for batch classification
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="relative mb-4">
                      <canvas
                        ref={canvasRef}
                        className="border-2 border-gray-600 rounded-lg shadow-2xl max-w-full max-h-[70vh] object-contain bg-gray-900"
                        style={{ 
                          imageRendering: 'pixelated',
                          minWidth: '200px',
                          minHeight: '200px',
                          display: 'block'
                        }}
                      />
                      
                      {/* Debug overlay to show canvas state */}
                      {canvasRef.current && (
                        <div className="absolute top-0 left-0 bg-black/70 text-green-400 text-xs p-1 rounded">
                          Canvas: {canvasRef.current.width}x{canvasRef.current.height}
                        </div>
                      )}
                      
                      {/* Canvas controls overlay */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={() => {
                            if (canvasRef.current) {
                              const canvas = canvasRef.current;
                              const currentStyle = canvas.style.imageRendering;
                              canvas.style.imageRendering = currentStyle === 'auto' ? 'pixelated' : 'auto';
                            }
                          }}
                          className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-all duration-200"
                          title="Toggle pixelated rendering"
                        >
                          🔍
                        </button>
                        <button
                          onClick={exportMap}
                          className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-all duration-200"
                          title="Download map"
                        >
                          📥
                        </button>
                      </div>
                      
                      {/* Map info overlay */}
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                        Map: {config.mapSize}x{config.mapSize} • Tile Size: {config.tileSize}px
                        {canvasRef.current && (
                          <div className="text-xs text-gray-300 mt-1">
                            Canvas: {canvasRef.current.width}x{canvasRef.current.height}px
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Canvas status info */}
                    <div className="text-center text-gray-400 text-sm">
                      <p className="mb-2">✅ Map canvas ready for rendering</p>
                      <p className="text-xs text-gray-500">Generated maps will appear above</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md z-50 animate-slide-up border border-red-500">
            <div className="flex items-start gap-3">
              <div className="text-red-200 flex-shrink-0 mt-0.5">
                ⚠️
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm mb-1">Error</div>
                <div className="text-red-100 text-sm break-words">{error}</div>
              </div>
              <button 
                onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
                className="text-red-200 hover:text-white text-xl leading-none flex-shrink-0 transition-colors duration-200"
                title="Dismiss error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Loading States */}
        {(isExtracting || isGenerating) && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-600 shadow-2xl max-w-md mx-4">
              {/* Animated Icon */}
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {isExtracting ? (
                    <FileImage className="w-6 h-6 text-blue-400" />
                  ) : (
                    <Wand2 className="w-6 h-6 text-purple-400" />
                  )}
                </div>
              </div>
              
              {/* Loading Text */}
              <div className="text-lg font-medium mb-3 text-white">
                {isExtracting ? 'Extracting tiles from image...' : 'Generating map...'}
              </div>
              
              <div className="text-sm text-gray-400 mb-4">
                {isExtracting 
                  ? 'Analyzing tileset structure and classifying tiles using AI' 
                  : 'Creating procedural map layout with intelligent tile placement'
                }
              </div>
              
              {/* Progress Animation */}
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              </div>
              
              <div className="text-xs text-gray-500 mt-3">
                This may take a few moments...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
