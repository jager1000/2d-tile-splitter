import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Tooltip } from './ui/tooltip';
import { Upload, FileImage, Settings, Wand2, Download, HelpCircle } from 'lucide-react';
import { TileAtlasService, MapGenerationService } from '../services/api';
import { GRID_PRESETS, ENVIRONMENT_TYPES, MAP_SIZE_PRESETS } from '../constants';
import type { TileAtlas, GridConfig, TileClassification } from '../types';

export const MapGeneratorApp: React.FC = () => {
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

  const handleGridConfigChange = (value: string) => {
    setSelectedPreset(value);
    
    if (value === 'auto') {
      setGridConfig({ type: 'auto' });
    } else if (value === 'custom') {
      setGridConfig({ type: 'custom' });
    } else {
      // It's a preset like "4x4"
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setIsExtracting(true);

    try {
      const extractedAtlas = await TileAtlasService.extractTiles({
        imageFile: file,
        gridConfig,
        tileSize,
      });
      
      setTileAtlas(extractedAtlas);
      
      // Auto-select all tiles and use their classifications
      const allTileIds = new Set(extractedAtlas.tiles.map(tile => tile.id));
      setSelectedTiles(allTileIds);
      
      const classifications = new Map();
      extractedAtlas.tiles.forEach(tile => {
        classifications.set(tile.id, tile.classification);
      });
      setTileClassifications(classifications);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract tiles');
    } finally {
      setIsExtracting(false);
    }
  }, [gridConfig, tileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    multiple: false,
  });

  const handleTileClick = (tileId: string, event: React.MouseEvent) => {
    const newSelected = new Set(selectedTiles);
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      if (newSelected.has(tileId)) {
        newSelected.delete(tileId);
      } else {
        newSelected.add(tileId);
      }
    } else {
      // Single select
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
    
    // Clear selection after classification
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
      // Group tiles by classification
      const tilesByType: Record<TileClassification, string[]> = {
        floor: [],
        wall: [],
        decoration: [],
      };

      tileAtlas.tiles.forEach(tile => {
        const classification = tileClassifications.get(tile.id) || tile.classification;
        tilesByType[classification].push(tile.id);
      });

      const generatedMap = await MapGenerationService.generateMap({
        atlasId: tileAtlas.id,
        width: mapSize,
        height: mapSize,
        tileSize: tileSize,
        environmentType: environmentType as any,
        tilesByType,
      });

      // Render the map to canvas
      renderMapToCanvas(generatedMap);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate map');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMapToCanvas = (mapData: any) => {
    // TODO: Implement actual map rendering based on mapData
    const canvas = canvasRef.current;
    if (!canvas || !tileAtlas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = mapSize * tileSize;
    canvas.height = mapSize * tileSize;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // This would be implemented based on the actual map generation response format
    // For now, just show a placeholder
    ctx.fillStyle = '#333';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Generated map will appear here', canvas.width/2, canvas.height/2);
    
    // Log mapData for debugging
    console.log('Map data received:', mapData);
    
    // Convert canvas to data URL for export
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
    <div className="min-h-screen bg-dark-200 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Smart 2D Map Generator</h1>
          <p className="text-gray-400">AI-powered tile classification and intelligent map generation</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* File Upload */}
            <div className="bg-dark-100 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                1. Upload Tileset
              </h3>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-primary-400 bg-primary-500/10' 
                    : 'border-gray-600 hover:border-primary-400'
                }`}
              >
                <input {...getInputProps()} />
                <FileImage className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                {isDragActive ? (
                  <p>Drop the texture atlas here...</p>
                ) : (
                  <div>
                    <p className="mb-2">Drag & drop a texture atlas, or click to select</p>
                    <p className="text-sm text-gray-400">PNG, JPG, WebP, GIF (max 10MB)</p>
                  </div>
                )}
              </div>

              {/* Grid Configuration */}
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    Grid Configuration
                    <Tooltip 
                      content="Choose how to split your tileset image into individual tiles. Auto detects grid automatically, presets offer common grid sizes, or use custom for specific dimensions."
                      position="right"
                    >
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
                    <Tooltip 
                      content="The size in pixels for each individual tile. This should match the actual tile dimensions in your texture atlas. Common sizes are 16px, 32px, or 64px."
                      position="right"
                    >
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
              <div className="bg-dark-100 rounded-lg p-6">
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
                <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto bg-dark-200 p-2 rounded">
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
            <div className="bg-dark-100 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                3. Generate Map
              </h3>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    Map Size
                    <Tooltip 
                      content="The dimensions of the generated map in tiles. A 32x32 map will have 1,024 tiles total. Larger maps take longer to generate but provide more detail."
                      position="right"
                    >
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
                    <Tooltip 
                      content="The style of map to generate. Different environments use different algorithms and tile placement patterns. Auto mode analyzes your tiles to choose the best approach."
                      position="right"
                    >
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
                  className="w-full bg-primary-600 hover:bg-primary-700"
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
            <div className="bg-dark-100 rounded-lg p-6 h-full">
              <h3 className="text-xl font-semibold mb-4">Generated Map</h3>
              
              <div className="flex justify-center items-center bg-dark-200 rounded-lg p-4 min-h-96">
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
          </div>
        )}

        {/* Loading States */}
        {(isExtracting || isGenerating) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-100 rounded-lg p-6 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>{isExtracting ? 'Extracting tiles...' : 'Generating map...'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
