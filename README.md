# 2D Map Generator - Refactored Architecture

This project has been refactored to follow the Single Responsibility Principle (SRP). Each module now has a specific, focused responsibility.

## Architecture Overview

### Core State Management
- **`AppState.js`** - Centralized application state management
  - Manages tileset image, tiles array, selections, classifications
  - Handles manual tile assignments and paint mode state
  - Single source of truth for all application data

### Image Processing
- **`ImageAnalyzer.js`** - Low-level image analysis utilities
  - Calculates texture features (edges, brightness, variance)
  - Analyzes dominant colors and meaningful content
  - Pure utility functions with no side effects

- **`TileClassifier.js`** - AI-powered tile classification
  - Uses ImageAnalyzer to classify tiles as floor/wall/decoration
  - Implements smart heuristics based on visual features
  - Separated from extraction logic

### Tile Processing
- **`AtlasGridDetector.js`** - Atlas grid detection algorithms
  - Auto-detects optimal grid dimensions for tilesets
  - Handles custom grid specifications
  - Validates reasonable tile sizes

- **`TileExtractor.js`** - Tile extraction from images
  - Extracts individual tiles from single textures or atlases
  - Integrates with classifier and grid detector
  - Manages tile creation and storage

### Map Generation
- **`NatureMapGenerator.js`** - Nature environment generation
  - Creates natural landscapes with water features and vegetation
  - Inherits from BaseMapGenerator for common functionality

- **`DungeonMapGenerator.js`** - Dungeon environment generation
  - Generates rooms, corridors, and decorative elements
  - Implements room-based generation algorithms

- **`CityMapGenerator.js`** - City and abstract environment generation
  - Creates grid-based city layouts with roads and buildings
  - Includes TopDownMapGenerator for simple layouts

- **`MapGeneratorFactory.js`** - Map generation strategy pattern
  - Selects appropriate generator based on environment type
  - Implements auto-detection heuristics

### User Interface
- **`UIStateManager.js`** - UI state and status management
  - Handles status messages, visibility toggles
  - Updates stats displays and mode indicators
  - Separated from business logic

- **`FileUploadHandler.js`** - File upload and drag-drop handling
  - Manages file validation and processing
  - Integrates with app state and UI updates

- **`TileDisplayManager.js`** - Tile grid display and selection
  - Renders tile previews with classifications
  - Handles multi-select functionality and visual feedback

- **`TileSelectorManager.js`** - Paint tile selection popup
  - Manages the tile picker interface for paint mode
  - Isolated popup logic and event handling

### Rendering and Interaction
- **`MapRenderer.js`** - Canvas rendering and export
  - Draws generated maps to canvas
  - Handles map export functionality
  - Optimized rendering with proper scaling

- **`PaintModeHandler.js`** - Interactive map painting
  - Manages mouse events for painting tiles
  - Handles coordinate translation and bounds checking
  - Clean event listener management

### Application Controller
- **`MapGeneratorApp.js`** - Main application controller
  - Orchestrates all modules and their interactions
  - Manages application lifecycle and event coordination
  - Single entry point for high-level operations

- **`init.js`** - Application initialization
  - Sets up the app and provides legacy function bridges
  - Clean separation of initialization logic

## Benefits of This Architecture

### Single Responsibility Principle
- Each class has one clear purpose and reason to change
- Easier to understand, test, and maintain individual components
- Reduced coupling between different aspects of the application

### Improved Maintainability
- Changes to one feature (e.g., new map generation algorithm) don't affect others
- Bug fixes are isolated to specific modules
- New features can be added with minimal impact on existing code

### Better Testability
- Each module can be unit tested independently
- Pure functions in utilities are easily testable
- State management is centralized and predictable

### Enhanced Extensibility
- New map generators can be added by extending BaseMapGenerator
- New tile classification algorithms can be plugged in easily
- UI components can be modified without affecting core logic

## Usage

The application maintains the same user interface and functionality as before, but with a much cleaner internal architecture. All original features work exactly the same:

1. Upload tileset images
2. Automatic tile extraction and classification
3. Manual tile classification override
4. Intelligent map generation for different environments
5. Interactive paint mode for manual editing
6. Map export functionality

The refactored code is more maintainable, testable, and ready for future enhancements.
