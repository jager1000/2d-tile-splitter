import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileImage, Settings, Wand2, Download, HelpCircle } from 'lucide-react';

// Local types (simplified from shared/types.ts)
type TileClassification = 'floor' | 'wall' | 'decoration';
type EnvironmentType = 'auto' | 'nature' | 'dungeon' | 'city' | 'abstract';

interface Tile {
  id: string;
  imageData: string;
  classification: TileClassification;
  confidence?: number;
  metadata?: {
    sourceX: number;
    sourceY: number;
    width: number;
    height: number;
  };
}

interface TileAtlas {
  id: string;
  name: string;
  imageData: string;
  originalImage: { width: number; height: number };
  grid: { cols: number; rows: number; tileWidth: number; tileHeight: number };
  tiles: Tile[];
  createdAt: Date;
}

interface GridConfig {
  type: 'auto' | 'preset' | 'custom';
  cols?: number;
  rows?: number;
}

// Local constants
const GRID_PRESETS = [
  { label: 'Auto-detect', value: 'auto' },
  { label: '2×2', value: '2x2', cols: 2, rows: 2 },
  { label: '4×4', value: '4x4', cols: 4, rows: 4 },
  { label: '8×8', value: '8x8', cols: 8, rows: 8 },
  { label: '16×16', value: '16x16', cols: 16, rows: 16 },
  { label: '32×32', value: '32x32', cols: 32, rows: 32 },
  { label: 'Custom', value: 'custom' },
];

const MAP_SIZE_PRESETS = [
  { label: '16×16', value: 16 },
  { label: '32×32', value: 32 },
  { label: '64×64', value: 64 },
  { label: '128×128', value: 128 },
];

const ENVIRONMENT_TYPES = [
  { label: 'Auto-detect', value: 'auto' },
  { label: 'Nature', value: 'nature' },
  { label: 'Dungeon', value: 'dungeon' },
  { label: 'City', value: 'city' },
  { label: 'Abstract', value: 'abstract' },
];

// Inline UI Components
const Button: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}> = ({ onClick, disabled, children, className = '', variant = 'primary' }) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = variant === 'primary' 
    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
    : 'bg-gray-600 hover:bg-gray-700 text-white';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const Input: React.FC<{
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  className?: string;
}> = ({ type = 'text', value, onChange, placeholder, min, max, className = '' }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    min={min}
    max={max}
    className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${className}`}
  />
);

const Select: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}> = ({ value, onChange, options, className = '' }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 ${className}`}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  position?: string;
}> = ({ content, children }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
      {content}
    </div>
  </div>
);

// API Functions
const api = {
  extractTiles: async (data: FormData) => {
    const response = await fetch('/api/extract-tiles', {
      method: 'POST',
      body: data,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  generateMap: async (data: any) => {
    const response = await fetch('/api/generate-map', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
};

// Main App Component
export default function App() {
  const [tileAtlas, setTileAtlas] = useState<TileAtlas | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<Set<string>>(new Set());
  const [tileClassifications, setTileClassifications] = useState<Map<string, TileClassification>>(new Map());
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMapData, setGeneratedMapData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Configuration state
  const [gridConfig, setGridConfig] = useState<GridConfig>({ type: 'auto' });
  const [selectedPreset, setSelectedPreset] = useState('auto');
  const [tileSize, setTileSize] = useState(32);
  const [mapSize, setMapSize] = useState(32);
  const [environmentType, setEnvironmentType] = useState('auto');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGridConfigChange = (value: string) => {
    setSelectedPreset(value);
    
    if (value === 'auto') {
      setGridConfig({ type: 'auto' });
    } else if (value === 'custom') {
      setGridConfig({ type: 'custom' });
    } else {
      const preset = GRID_PRESETS.find(p => p.value === value);
      if (preset && 'cols' in preset && 'rows' in preset) {
        setGridConfig({ 
          type: 'preset', 
          cols: preset.cols, 
          rows: preset.rows 
        });
      }
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsExtracting(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('gridConfig', JSON.stringify(gridConfig));
      formData.append('tileSize', tileSize.toString());

      const result = await api.extractTiles(formData);
      
      if (result.success && result.data) {
        setTileAtlas(result.data);
        
        // Auto-select all tiles and use their classifications
        const allTileIds = new Set<string>(result.data.tiles.map((tile: Tile) => tile.id));
        setSelectedTiles(allTileIds);
        
        const classifications = new Map();
        result.data.tiles.forEach((tile: Tile) => {
          classifications.set(tile.id, tile.classification);
        });
        setTileClassifications(classifications);
      } else {
        throw new Error(result.error || 'Failed to extract tiles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract tiles');
    } finally {
      setIsExtracting(false);
    }
  }, [gridConfig, tileSize]);

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
    
    setSelectedTiles(newSelected);
  };

  const updateTileClassification = (classification: TileClassification) => {
    if (selectedTiles.size === 0) {
      setError('Please select tiles first');
      return;
    }

    const newClassifications = new Map(tileClassifications);
    selectedTiles.forEach(tileId => {
      newClassifications.set(tileId, classification);
    });
    setTileClassifications(newClassifications);
    
    setSelectedTiles(new Set());
  };

  const generateMap = async () => {
    if (!tileAtlas) {
      setError('Please upload and extract tiles first');
      return;
    }

    setError(null);
    setIsGenerating(true);

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

      const result = await api.generateMap({
        atlasId: tileAtlas.id,
        width: mapSize,
        height: mapSize,
        tileSize: tileSize,
        environmentType: environmentType,
        tilesByType,
      });

      if (result.success && result.data) {
        renderMapToCanvas(result.data);
      } else {
        throw new Error(result.error || 'Failed to generate map');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate map');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMapToCanvas = (mapData: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !tileAtlas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = mapSize * tileSize;
    canvas.height = mapSize * tileSize;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simple placeholder rendering
    ctx.fillStyle = '#333';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Generated map will appear here', canvas.width/2, canvas.height/2);
    
    console.log('Map data received:', mapData);
    
    setGeneratedMapData(canvas.toDataURL());
  };

  const exportMap = () => {
    if (!generatedMapData) {
      setError('No map to export');
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
          <p className="text-gray-400">AI-powered tile classification and intelligent map generation</p>
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
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileImage className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="mb-2">Click to select a texture atlas</p>
                <p className="text-sm text-gray-400">PNG, JPG, WebP, GIF (max 10MB)</p>
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
                    value={selectedPreset}
                    onChange={handleGridConfigChange}
                    options={GRID_PRESETS.map(preset => ({ 
                      value: preset.value, 
                      label: preset.label 
                    }))}
                  />
                </div>
                
                {selectedPreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Columns"
                      value={gridConfig.cols || ''}
                      onChange={(e) => setGridConfig({ 
                        ...gridConfig, 
                        cols: parseInt(e.target.value) || undefined 
                      })}
                    />
                    <Input
                      type="number"
                      placeholder="Rows"
                      value={gridConfig.rows || ''}
                      onChange={(e) => setGridConfig({ 
                        ...gridConfig, 
                        rows: parseInt(e.target.value) || undefined 
                      })}
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
                    value={tileSize}
                    onChange={(e) => setTileSize(parseInt(e.target.value) || 32)}
                    min={8}
                    max={128}
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
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Mark as Floor ({selectedTiles.size} selected)
                  </Button>
                  <Button 
                    onClick={() => updateTileClassification('wall')}
                    disabled={selectedTiles.size === 0}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    Mark as Wall ({selectedTiles.size} selected)
                  </Button>
                  <Button 
                    onClick={() => updateTileClassification('decoration')}
                    disabled={selectedTiles.size === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700"
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
                    value={mapSize.toString()}
                    onChange={(value) => setMapSize(parseInt(value))}
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
                    value={environmentType}
                    onChange={setEnvironmentType}
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
                  className="w-full"
                >
                  {isGenerating ? 'Generating...' : 'Generate Map'}
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
              </div>
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 h-full">
              <h3 className="text-xl font-semibold mb-4">Generated Map</h3>
              
              <div className="flex justify-center items-center bg-gray-700 rounded-lg p-4 min-h-96">
                <canvas
                  ref={canvasRef}
                  className="border-2 border-gray-600 rounded max-w-full max-h-full"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-200 hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading States */}
        {(isExtracting || isGenerating) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>{isExtracting ? 'Extracting tiles...' : 'Generating map...'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
