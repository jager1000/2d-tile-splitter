# Smart 2D Map Generator

AI-powered tile classification and intelligent procedural map generation tool for game developers.

![Map Generator](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)

## Features

- **Smart Tile Extraction**: Automatically extract individual tiles from texture atlases
- **AI-Powered Classification**: Intelligent tile classification into floor, wall, and decoration types
- **Procedural Map Generation**: Generate maps using various algorithms (Dungeon, Nature, City, Abstract)
- **Flexible Grid System**: Support for auto-detection or custom grid configurations
- **Real-time Preview**: See your tileset and generated maps instantly
- **Export Functionality**: Export generated maps as PNG files
- **Drag & Drop Interface**: Easy file upload with drag and drop support
- **Keyboard Shortcuts**: Productivity shortcuts for power users

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/map-generator-2d.git
cd map-generator-2d
```

2. Install all dependencies:
```bash
npm run install:all
```

## Usage

### Starting the Application

```bash
npm start
```

This will:
- Start the backend server on port 8890
- Start the frontend development server on port 3000
- Open your browser to http://localhost:3000

### Basic Workflow

1. **Upload a Tileset**
   - Click the upload area or drag & drop your tileset image
   - Supported formats: PNG, JPG, WebP, GIF (max 10MB)

2. **Configure Grid**
   - Choose a preset grid size (2×2, 4×4, 8×8, etc.)
   - Or select "Custom" to specify your own grid dimensions

3. **Classify Tiles**
   - Click tiles to select them (Ctrl+Click for multiple selection)
   - Assign classifications: Floor, Wall, or Decoration
   - Use "Select All" and "Clear Selection" for bulk operations

4. **Generate Map**
   - Choose map size (16×16 to 128×128)
   - Select environment type (Dungeon, Nature, City, Abstract)
   - Click "Generate Map" to create your procedural map

5. **Export**
   - Click "Export as PNG" to download your generated map

### Keyboard Shortcuts

- **Ctrl/Cmd + G**: Generate Map
- **Ctrl/Cmd + E**: Export Map
- **Ctrl/Cmd + A**: Select All Tiles
- **ESC**: Close Error/Success Messages

## Development

### Project Structure

```
map-generator-2d/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── App.tsx    # Main application component
│   │   └── ...
│   └── package.json
├── backend/            # Express backend server
│   ├── src/
│   │   └── index.ts   # Main server file
│   └── package.json
├── shared/             # Shared types and constants
│   ├── types.ts
│   └── constants.ts
└── package.json        # Root package.json
```

### Running in Development

Backend only:
```bash
cd backend && npm run dev
```

Frontend only:
```bash
cd frontend && npm run dev
```

Both (recommended):
```bash
npm start
```

### Building for Production

```bash
npm run build
```

This will create optimized builds in:
- `backend/dist/` - Compiled TypeScript backend
- `frontend/dist/` - Production React build

## API Endpoints

- `GET /` - API health check
- `POST /extract-tiles` - Extract tiles from uploaded image
- `POST /generate-map` - Generate a procedural map
- `GET /atlas/:id` - Get tile atlas by ID
- `GET /map/:id` - Get generated map by ID

## Environment Types

### Dungeon
Creates room-and-corridor layouts typical of roguelike dungeons.

### Nature
Generates organic patterns with clusters for natural environments.

### City
Creates grid-based layouts with building blocks and streets.

### Abstract
Uses mathematical functions to create artistic patterns.

## Troubleshooting

### Backend Connection Issues
- Ensure port 8890 is not in use
- Check that backend dependencies are installed
- Verify Node.js version is 16 or higher

### Map Not Displaying
- Check browser console for errors
- Ensure tiles are properly classified
- Verify the tileset image loaded correctly

### Export Not Working
- Generate a map first before exporting
- Check browser permissions for downloads
- Try a different browser if issues persist

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React, TypeScript, and Express
- Uses Sharp for image processing
- Styled with Tailwind CSS
- Icons from Lucide React