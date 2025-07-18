import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileImage, Settings, Wand2, Download, Grid, Palette, Brush, Eye, EyeOff } from 'lucide-react';

// Types
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
  originalImage: {
    width: number;
    height: number;
  };
  grid: {
    cols: number;
    rows: number;
    tileWidth: number;
    tileHeight: number;
  };
  tiles: Tile[];
  createdAt: Date;
}

interface MapCell {
  x: number;
  y: number;
  tileId: string | null;
  layer: 'floor' | 'wall' | 'decoration';
}

interface GeneratedMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  cells: MapCell[][];
  environmentType: EnvironmentType;
  atlasId: string;
  createdAt: Date;
}

interface GridConfig {
  type: 'auto' | 'preset' | 'custom';
  cols?: number;
  rows?: number;
}

// Constants
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

const APP_CONFIG = {
  DEFAULT_TILE_SIZE: 32,
  MIN_TILE_SIZE: 8,
  MAX_TILE_SIZE: 128,
  DEFAULT_MAP_SIZE: 32,
  MIN_MAP_SIZE: 8,
  MAX_MAP_SIZE: 128,
};

// Unified color scheme
const TILE_COLORS = {
  floor: {
    bg: 'bg-emerald-600',
    hover: 'hover:bg-emerald-700',
    badge: 'bg-emerald-600/90',
    text: 'text-emerald-100',
    border: 'border-emerald-400',
    shadow: 'shadow-emerald-400/50',
    dot: 'bg-emerald-300',
    icon: 'text-emerald-400',
  },
  wall: {
    bg: 'bg-stone-600',
    hover: 'hover:bg-stone-700',
    badge: 'bg-stone-600/90',
    text: 'text-stone-100',
    border: 'border-stone-400',
    shadow: 'shadow-stone-400/50',
    dot: 'bg-stone-300',
    icon: 'text-stone-400',
  },
  decoration: {
    bg: 'bg-violet-600',
    hover: 'hover:bg-violet-700',
    badge: 'bg-violet-600/90',
    text: 'text-violet-100',
    border: 'border-violet-400',
    shadow: 'shadow-violet-400/50',
    dot: 'bg-violet-300',
    icon: 'text-violet-400',
  },
};

// Custom styles
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
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
  
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
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
};

const Input = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
  const baseClasses = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500';
  return <input className={`${baseClasses} ${className}`.trim()} {...props} />;
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

// API - using relative paths that will be proxied by Vite
const api = {
  extractTiles: async (formData: FormData) => {
    const response = await fetch('/api/extract-tiles', { 
      method: 'POST', 
      body: formData 
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
    }
    return response.json();
  },
  
  generateMap: async (data: any) => {
    const response = await fetch('/api/generate-map', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
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
  const [generatedMapData, setGeneratedMapData] = useState<GeneratedMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [selectedPaintTile, setSelectedPaintTile] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [config, setConfig] = useState({
    grid: { type: 'auto' } as GridConfig,
    selectedPreset: 'auto',
    tileSize: APP_CONFIG.DEFAULT_TILE_SIZE,
    mapSize: APP_CONFIG.DEFAULT_MAP_SIZE,
    environmentType: 'auto',
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tileImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Show success message
  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Show error message
  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const handleGridConfigChange = (value: string) => {
    const newConfig = { ...config, selectedPreset: value };
    
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
    
    setConfig(newConfig);
    
    // Re-extract tiles if an image is already uploaded
    if (fileInputRef.current?.files?.[0] && newConfig.grid) {
      const file = fileInputRef.current.files[0];
      extractTiles(file, newConfig.grid, config.tileSize);
    }
  };

  const extractTiles = useCallback(async (file: File, gridConfig?: GridConfig, tileSize?: number) => {
    setError(null);
    setIsExtracting(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('gridConfig', JSON.stringify(gridConfig || config.grid));
      formData.append('tileSize', (tileSize || config.tileSize).toString());

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
        
        // Pre-load tile images
        tileImagesRef.current.clear();
        await Promise.all(
          result.data.tiles.map(tile => 
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                tileImagesRef.current.set(tile.id, img);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = tile.imageData;
            })
          )
        );
        
        showSuccess('Tiles extracted successfully!');
      } else {
        throw new Error(result.error || 'Failed to extract tiles');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to extract tiles');
    } finally {
      setIsExtracting(false);
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
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(imageFile);
        fileInputRef.current.files = dataTransfer.files;
      }
      await extractTiles(imageFile);
    } else {
      showError('Please drop an image file (PNG, JPG, WebP, GIF)');
    }
  }, [extractTiles]);

  const handleTileClick = (tileId: string, event: React.MouseEvent) => {
    if (isPainting) {
      setSelectedPaintTile(tileId);
      setSelectedTiles(new Set([tileId]));
    } else {
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
    }
  };

  const updateTileClassification = (classification: TileClassification) => {
    if (selectedTiles.size === 0) {
      showError('Please select tiles first');
      return;
    }

    const newClassifications = new Map(tileClassifications);
    selectedTiles.forEach(tileId => {
      newClassifications.set(tileId, classification);
    });
    setTileClassifications(newClassifications);
    setSelectedTiles(new Set());
    showSuccess(`${selectedTiles.size} tile(s) marked as ${classification}`);
  };

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, cellSize: number, width: number, height: number) => {
    if (!showGrid) return;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [showGrid]);

  const renderMapToCanvas = useCallback(async (mapData: GeneratedMap) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas ref not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    // Calculate canvas size based on map dimensions
    const cellSize = config.tileSize;
    canvas.width = mapData.width * cellSize;
    canvas.height = mapData.height * cellSize;

    // Set canvas CSS size for proper display
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;

    // Clear canvas with a visible color to ensure it's rendering
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the map
    if (mapData.cells && Array.isArray(mapData.cells)) {
      for (let y = 0; y < mapData.cells.length; y++) {
        for (let x = 0; x < mapData.cells[y].length; x++) {
          const cell = mapData.cells[y][x];
          
          // Always draw something, even if no tile data
          let color = '#1a1a1a';
          
          if (cell) {
            // Try to use tile image first
            if (cell.tileId && tileImagesRef.current.has(cell.tileId)) {
              const img = tileImagesRef.current.get(cell.tileId)!;
              try {
                ctx.drawImage(img, x * cellSize, y * cellSize, cellSize, cellSize);
                continue;
              } catch (e) {
                console.error('Error drawing tile image:', e);
              }
            }
            
            // Fallback to colored squares based on layer
            if (cell.layer) {
              switch (cell.layer) {
                case 'floor': 
                  color = '#10b981'; // emerald-500
                  break;
                case 'wall': 
                  color = '#6b7280'; // gray-500
                  break;
                case 'decoration': 
                  color = '#8b5cf6'; // violet-500
                  break;
                default:
                  color = '#374151'; // gray-700
              }
            }
          }
          
          // Draw the colored square
          ctx.fillStyle = color;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    } else {
      // If no cells data, draw a test pattern to show canvas is working
      console.error('Invalid map cells data:', mapData.cells);
      ctx.fillStyle = '#dc2626';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Map Data Error', canvas.width / 2, canvas.height / 2);
    }

    // Draw grid
    drawGrid(ctx, cellSize, canvas.width, canvas.height);
  }, [config.tileSize, showGrid, drawGrid]);

  const generateMap = async () => {
    if (!tileAtlas) {
      showError('Please upload and extract tiles first');
      return;
    }

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

    // Ensure we have at least floor tiles
    if (tilesByType.floor.length === 0) {
      showError('Please classify at least one tile as "Floor"');
      return;
    }

    // Use floor tiles as fallback for missing types
    if (tilesByType.wall.length === 0) {
      tilesByType.wall = [...tilesByType.floor];
    }
    if (tilesByType.decoration.length === 0) {
      tilesByType.decoration = [...tilesByType.floor];
    }

    setError(null);
    setIsGenerating(true);

    try {
      const requestData = {
        atlasId: tileAtlas.id,
        width: config.mapSize,
        height: config.mapSize,
        tileSize: config.tileSize,
        environmentType: config.environmentType,
        tilesByType,
      };

      const result = await api.generateMap(requestData);
      console.log('Map generation result:', result);

      if (result.success && result.data) {
        console.log('Map data received:', {
          width: result.data.width,
          height: result.data.height,
          cellsLength: result.data.cells?.length,
          firstRow: result.data.cells?.[0]?.length,
          sampleCell: result.data.cells?.[0]?.[0]
        });
        
        // Set the map data first so the canvas becomes visible
        setGeneratedMapData(result.data);
        // Then render it after a short delay to ensure canvas is mounted
        setTimeout(() => {
          renderMapToCanvas(result.data);
        }, 100);
        showSuccess('Map generated successfully!');
      } else {
        throw new Error(result.error || 'Failed to generate map');
      }
    } catch (err) {
      showError(`Map generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting || !selectedPaintTile || !generatedMapData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const cellX = Math.floor(x / config.tileSize);
    const cellY = Math.floor(y / config.tileSize);
    
    if (cellX >= 0 && cellX < generatedMapData.width && cellY >= 0 && cellY < generatedMapData.height) {
      // Update the map data
      generatedMapData.cells[cellY][cellX].tileId = selectedPaintTile;
      
      // Redraw the single cell
      const ctx = canvas.getContext('2d');
      if (ctx && tileImagesRef.current.has(selectedPaintTile)) {
        const img = tileImagesRef.current.get(selectedPaintTile)!;
        ctx.drawImage(img, cellX * config.tileSize, cellY * config.tileSize, config.tileSize, config.tileSize);
        
        // Redraw grid for this cell if enabled
        if (showGrid) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(cellX * config.tileSize, cellY * config.tileSize, config.tileSize, config.tileSize);
        }
      }
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDown || !isPainting || !selectedPaintTile || !generatedMapData || !canvasRef.current) return;
    handleCanvasClick(event);
  };

  const exportMap = () => {
    const canvas = canvasRef.current;
    if (!canvas || !generatedMapData) {
      showError('No map to export');
      return;
    }

    try {
      // Create a temporary canvas without grid
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Copy the canvas content without grid
        tempCtx.drawImage(canvas, 0, 0);
        
        // If grid is shown, redraw without it
        if (showGrid) {
          const originalShowGrid = showGrid;
          setShowGrid(false);
          renderMapToCanvas(generatedMapData).then(() => {
            tempCanvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
                link.download = `map-${config.mapSize}x${config.mapSize}-${config.environmentType}-${timestamp}.png`;
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                showSuccess('Map exported successfully!');
              }
              setShowGrid(originalShowGrid);
              renderMapToCanvas(generatedMapData);
            }, 'image/png');
          });
        } else {
          tempCanvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
              link.download = `map-${config.mapSize}x${config.mapSize}-${config.environmentType}-${timestamp}.png`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              showSuccess('Map exported successfully!');
            }
          }, 'image/png');
        }
      }
    } catch (err) {
      showError('Failed to export map');
    }
  };

  // Re-render map when grid visibility changes
  useEffect(() => {
    if (generatedMapData) {
      renderMapToCanvas(generatedMapData);
    }
  }, [showGrid, generatedMapData, renderMapToCanvas]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'g' && !isGenerating && tileAtlas) {
        event.preventDefault();
        generateMap();
      }
      
      if ((event.ctrlKey || event.metaKey) && event.key === 'e' && generatedMapData) {
        event.preventDefault();
        exportMap();
      }
      
      if (event.key === 'Escape') {
        if (error || success) {
          setError(null);
          setSuccess(null);
        }
        if (isPainting) {
          setIsPainting(false);
          setSelectedPaintTile(null);
        }
      }
      
      if ((event.ctrlKey || event.metaKey) && event.key === 'a' && tileAtlas) {
        event.preventDefault();
        const allTileIds = new Set(tileAtlas.tiles.map(tile => tile.id));
        setSelectedTiles(allTileIds);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, tileAtlas, generatedMapData, error, success, isPainting]);

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
          <p className="text-gray-400 text-lg">AI-powered tile classification and intelligent map generation</p>
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
                  isDragging ? 'text-blue-400 scale-110' : 'text-gray-400 group-hover:text-blue-400'
                }`} />
                <p className={`mb-2 font-medium transition-colors duration-300 ${
                  isDragging ? 'text-blue-300' : ''
                }`}>
                  {isDragging ? 'Drop your texture atlas here!' : 'Click to select or drag & drop'}
                </p>
                <p className={`text-sm transition-colors duration-300 ${
                  isDragging ? 'text-blue-200' : 'text-gray-400'
                }`}>
                  PNG, JPG, WebP, GIF (max 10MB)
                </p>
              </div>

              {/* Grid Configuration */}
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <Grid className="w-4 h-4" />
                    Grid Configuration
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
                      onChange={(e) => {
                        const cols = parseInt(e.target.value) || undefined;
                        setConfig(prev => ({ 
                          ...prev, 
                          grid: { ...prev.grid, cols } 
                        }));
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Rows"
                      value={config.grid.rows || ''}
                      onChange={(e) => {
                        const rows = parseInt(e.target.value) || undefined;
                        setConfig(prev => ({ 
                          ...prev, 
                          grid: { ...prev.grid, rows } 
                        }));
                      }}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Tile Size (px)</label>
                  <Input
                    type="number"
                    value={config.tileSize}
                    onChange={(e) => {
                      const tileSize = parseInt(e.target.value) || APP_CONFIG.DEFAULT_TILE_SIZE;
                      setConfig(prev => ({ ...prev, tileSize }));
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
                  <Palette className="w-5 h-5" />
                  2. Classify Tiles
                </h3>
                
                <p className="text-sm text-gray-400 mb-4">
                  {isPainting ? 'Click a tile to select for painting' : 'Select tiles and assign classifications. Ctrl+Click for multiple.'}
                </p>

                <div className="mb-4 space-y-2">
                  <div className="text-xs text-gray-400 mb-3">
                    {isPainting ? `Painting with: ${selectedPaintTile || 'none'}` : `Selected: ${selectedTiles.size} tile${selectedTiles.size !== 1 ? 's' : ''}`}
                  </div>
                  
                  <Button 
                    onClick={() => updateTileClassification('floor')}
                    disabled={selectedTiles.size === 0 || isPainting}
                    className={`w-full ${TILE_COLORS.floor.bg} ${TILE_COLORS.floor.hover}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-3 h-3 ${TILE_COLORS.floor.dot} rounded`}></div>
                      Mark as Floor
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => updateTileClassification('wall')}
                    disabled={selectedTiles.size === 0 || isPainting}
                    className={`w-full ${TILE_COLORS.wall.bg} ${TILE_COLORS.wall.hover}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-3 h-3 ${TILE_COLORS.wall.dot} rounded`}></div>
                      Mark as Wall
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => updateTileClassification('decoration')}
                    disabled={selectedTiles.size === 0 || isPainting}
                    className={`w-full ${TILE_COLORS.decoration.bg} ${TILE_COLORS.decoration.hover}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-3 h-3 ${TILE_COLORS.decoration.dot} rounded`}></div>
                      Mark as Decoration
                    </div>
                  </Button>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <Button
                      onClick={() => {
                        setIsPainting(!isPainting);
                        if (!isPainting && selectedTiles.size === 1) {
                          setSelectedPaintTile(Array.from(selectedTiles)[0]);
                        } else {
                          setSelectedPaintTile(null);
                        }
                      }}
                      variant={isPainting ? 'primary' : 'secondary'}
                      className="w-full"
                      disabled={!generatedMapData}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Brush className="w-4 h-4" />
                        {isPainting ? 'Stop Painting' : 'Paint Mode'}
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Tiles Grid */}
                <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto bg-gray-700 p-3 rounded-lg custom-scrollbar">
                  {tileAtlas.tiles.map((tile) => {
                    const classification = tileClassifications.get(tile.id) || tile.classification;
                    const isSelected = selectedTiles.has(tile.id);
                    const isPaintTile = selectedPaintTile === tile.id;
                    const colors = TILE_COLORS[classification];
                    
                    return (
                      <div
                        key={tile.id}
                        className={`relative border-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 ${
                          isPaintTile
                            ? 'border-yellow-400 shadow-lg shadow-yellow-400/50 ring-2 ring-yellow-400/30'
                            : isSelected
                            ? `${colors.border} shadow-lg ${colors.shadow}`
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
                        
                        <div className={`absolute bottom-0 left-0 right-0 text-xs text-center py-1 rounded-b-lg font-medium ${colors.badge} ${colors.text}`}>
                          {classification}
                        </div>
                        
                        {(isSelected || isPaintTile) && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <div className={`w-2 h-2 ${isPaintTile ? 'bg-yellow-500' : 'bg-blue-600'} rounded-full`}></div>
                          </div>
                        )}
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
                  <label className="block text-sm font-medium mb-1">Map Size</label>
                  <Select
                    value={config.mapSize.toString()}
                    onChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      mapSize: parseInt(value) 
                    }))}
                    options={MAP_SIZE_PRESETS.map(preset => ({ 
                      value: preset.value.toString(), 
                      label: preset.label 
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Environment Type</label>
                  <Select
                    value={config.environmentType}
                    onChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      environmentType: value 
                    }))}
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
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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

                <Button
                  onClick={() => setShowGrid(!showGrid)}
                  disabled={!generatedMapData}
                  variant="secondary"
                  className="w-full"
                >
                  <div className="flex items-center justify-center gap-2">
                    {showGrid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showGrid ? 'Hide Grid' : 'Show Grid'}
                  </div>
                </Button>

                <Button
                  onClick={exportMap}
                  disabled={!generatedMapData}
                  variant="secondary"
                  className="w-full"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Export as PNG
                  </div>
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tileset Preview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Tileset Preview</h3>
              
              <div className="bg-gray-700 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                {!tileAtlas ? (
                  <div className="text-center text-gray-400">
                    <FileImage className="w-24 h-24 mx-auto mb-4 opacity-30" />
                    <p>Upload a tileset to get started</p>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="grid grid-cols-8 gap-2 max-h-[280px] overflow-y-auto custom-scrollbar">
                      {tileAtlas.tiles.map((tile) => {
                        const classification = tileClassifications.get(tile.id) || tile.classification;
                        const colors = TILE_COLORS[classification];
                        return (
                          <div key={tile.id} className="relative">
                            <img 
                              src={tile.imageData} 
                              alt={`Tile ${tile.id}`}
                              className="w-full h-full object-cover rounded border border-gray-600"
                              style={{ imageRendering: 'pixelated' }}
                            />
                            <div className={`absolute bottom-0 left-0 right-0 text-xs text-center py-0.5 ${colors.badge} ${colors.text}`}>
                              {classification[0].toUpperCase()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Generated Map */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Generated Map</h3>
                {generatedMapData && (
                  <span className="text-sm bg-green-600 text-white px-3 py-1 rounded-full">
                    {config.mapSize}×{config.mapSize} Map
                  </span>
                )}
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 min-h-[600px] flex items-center justify-center overflow-auto">
                {!generatedMapData ? (
                  <div className="text-center text-gray-400">
                    <Wand2 className="w-24 h-24 mx-auto mb-4 opacity-30" />
                    <p>Generate a map to see it here</p>
                  </div>
                ) : (
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      className={`border border-gray-600 ${isPainting ? 'cursor-crosshair' : 'cursor-default'}`}
                      style={{ 
                        imageRendering: 'pixelated',
                        maxWidth: '100%',
                        height: 'auto'
                      }}
                      onClick={handleCanvasClick}
                      onMouseDown={() => setIsMouseDown(true)}
                      onMouseUp={() => setIsMouseDown(false)}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseLeave={() => setIsMouseDown(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-xl max-w-md z-50 animate-slide-up">
            <div className="flex items-start gap-3">
              <span>⚠️</span>
              <div className="flex-1">{error}</div>
              <button onClick={() => setError(null)} className="text-white/80 hover:text-white">×</button>
            </div>
          </div>
        )}

        {success && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl max-w-md z-50 animate-slide-up">
            <div className="flex items-start gap-3">
              <span>✅</span>
              <div className="flex-1">{success}</div>
              <button onClick={() => setSuccess(null)} className="text-white/80 hover:text-white">×</button>
            </div>
          </div>
        )}

        {/* Loading States */}
        {(isExtracting || isGenerating) && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <div className="w-16 h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-lg font-medium mb-2">
                {isExtracting ? 'Extracting tiles...' : 'Generating map...'}
              </div>
              <div className="text-sm text-gray-400">
                {isExtracting ? 'Analyzing tileset structure' : 'Creating procedural map layout'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}