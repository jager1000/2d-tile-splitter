# 🎮 Smart 2D Map Generator

> AI-powered tile classification and intelligent map generation tool for game developers.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- 🤖 **AI-Powered Tile Classification** - Automatically categorizes tiles as floor, wall, or decoration
- 🎯 **Smart Grid Detection** - Auto-detects tile patterns or use custom configurations
- 🏗️ **Multiple Map Types** - Generate dungeons, nature scenes, cities, and abstract patterns
- 🎨 **Visual Tile Editor** - Click and drag interface for manual tile classification
- 📦 **Multiple Export Formats** - Export as PNG images
- ⚡ **Real-time Preview** - See your map as it generates
- 🔄 **Drag & Drop Support** - Easy file uploads
- ⌨️ **Keyboard Shortcuts** - Streamlined workflow

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd map-generator-2d
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - 🌐 **Frontend**: http://localhost:3005/
   - 🔧 **Backend API**: http://localhost:8891/

## 🎮 How to Use

### 1. Upload Your Tileset
- Drag & drop or click to upload your texture atlas
- Supports PNG, JPG, WebP, and GIF formats
- Choose grid configuration (auto-detect or custom)

### 2. Classify Your Tiles
- Select tiles by clicking (Ctrl+Click for multiple)
- Mark tiles as **Floor**, **Wall**, or **Decoration**
- Use the quick actions for batch operations

### 3. Generate Your Map
- Choose map size and environment type
- Click "Generate Map" or press `Ctrl+G`
- Download your map as PNG with `Ctrl+E`

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + G` | Generate Map |
| `Ctrl/Cmd + E` | Export Map |
| `Ctrl/Cmd + A` | Select All Tiles |
| `ESC` | Close Error Messages |

## 🏗️ Architecture

```
📁 Project Structure
├── 🎨 frontend/           # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx        # Main application (580 lines)
│   │   └── main.tsx       # Entry point
│   └── vite.config.ts     # Vite configuration
├── 🔧 backend/            # Express.js + TypeScript
│   └── src/
│       └── index.ts       # Complete backend API (570 lines)
├── 🔗 shared/             # Shared types and constants
│   ├── types.ts           # TypeScript definitions
│   └── constants.ts       # Configuration constants
└── 🎮 Textures/           # Sample tilesets
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Production
npm run build           # Build both projects
npm run start           # Start production server

# Maintenance
npm run clean           # Clean all dependencies
npm run install:all     # Install all dependencies
```

### Testing

```bash
# Quick end-to-end test
node test-frontend-flow.js

# Manual testing
# 1. Upload sample tileset from /Textures folder
# 2. Classify tiles and generate map
# 3. Export the result
```

## 🌍 Environment Types

- **🏰 Dungeon**: Classic RPG dungeons with rooms and corridors
- **🌲 Nature**: Organic landscapes with trees and vegetation  
- **🏙️ City**: Urban environments with buildings and streets
- **🎨 Abstract**: Mathematical pattern-based generation
- **🎯 Auto**: Intelligent type detection

## 🎯 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check and API info |
| `/extract-tiles` | POST | Upload and extract tiles from image |
| `/generate-map` | POST | Generate map from classified tiles |
| `/atlas/:id` | GET | Retrieve tile atlas by ID |
| `/map/:id` | GET | Retrieve generated map by ID |

## 🔧 Configuration

### Frontend Configuration (`frontend/vite.config.ts`)
```typescript
export default defineConfig({
  server: {
    port: 3005,
    proxy: {
      '/api': 'http://localhost:8891'
    }
  }
})
```

### Backend Configuration (`backend/src/index.ts`)
```typescript
const PORT = process.env.PORT || 8891;
```

## 🐛 Troubleshooting

### Common Issues

**❌ "Cannot connect to backend server"**
```bash
# Check if backend is running
curl http://localhost:8891/

# Restart backend
cd backend && npm run dev
```

**❌ "Port already in use"**
```bash
# Find and kill process using port
netstat -ano | findstr :8891
taskkill /PID <process-id> /F
```

**❌ "Map generation failed"**
- Ensure at least one tile is classified as "Floor"
- Check browser console for detailed error messages
- Verify tileset uploaded successfully

### Performance Tips

- 🖼️ Use tilesets under 10MB for best performance
- 📐 Recommended tile sizes: 16x16, 32x32, 64x64 pixels
- 🗺️ Start with smaller maps (8x8 to 16x16) for testing

## 📝 Release Notes

### Version 1.0.0 - Production Ready 🎉

**🆕 New Features:**
- Complete UI/UX redesign with polished interface
- Advanced map rendering with async image loading
- Comprehensive error handling and validation
- Keyboard shortcuts for improved workflow
- Real-time tile statistics and feedback
- Enhanced loading states and animations
- Custom scrollbars and visual improvements

**🔧 Technical Improvements:**
- Fixed map generation bounds checking
- Improved canvas rendering performance
- Better error messages and debugging
- Enhanced API response handling
- Streamlined codebase (1150 lines total)

**🎨 UI Enhancements:**
- Modern gradient design elements
- Smooth hover animations and transitions
- Better visual feedback for tile selection
- Improved tile classification interface
- Professional header and status indicators

## 📄 License

MIT License - feel free to use this project for your game development needs!

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ for game developers**
