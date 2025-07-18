# 2D Map Generator

AI-powered tile classification and intelligent map generation tool.

## 🚀 Quick Start

### Option 1: Single Command (Recommended)
```bash
npm run dev
```
This will start both backend (port 8890) and frontend (port 3004) simultaneously.

### Option 2: Individual Commands
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:frontend
```

### Alternative Commands
```bash
npm start        # Same as npm run dev
npm run build    # Build both frontend and backend
npm run clean    # Clean all node_modules and dist folders
```

## 📋 Setup Instructions

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start the application:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Main App: http://localhost:3006/
   - Test Page: http://localhost:3006/test.html

## 🎮 How to Use

1. **Upload a tileset image** (PNG, JPG, WebP)
2. **Configure grid settings** (auto-detect, presets, or custom)
3. **Review and classify tiles** (floor, wall, decoration)
4. **Generate a map** with your preferred settings
5. **Export** the generated map as PNG

## 📝 Features

- ✅ AI-powered tile classification
- ✅ Multiple grid configuration options
- ✅ Visual tile selection and manual classification
- ✅ Intelligent map generation algorithms
- ✅ Real-time canvas rendering
- ✅ PNG export functionality
- ✅ Responsive web interface

## 🐛 Troubleshooting

If you encounter port conflicts:
- Backend runs on port 8890
- Frontend runs on port 3006 (or next available)

To reset everything:
```bash
npm run clean
npm run install:all
npm run dev
```
- Removed complex validation (Joi → simple functions)
- Removed unnecessary middleware (helmet, compression, morgan)
- In-memory storage instead of database
- Simple error handling

#### Frontend (`frontend/src/App-new.tsx`)
- Merged MapGeneratorApp into App.tsx
- Inline UI components (Button, Input, Select, Tooltip)
- Removed React Query → native fetch
- Removed Zustand → React state
- Removed dropzone → native file input
- Simple canvas rendering

#### Dependencies Removed
**Backend**:
- swagger-jsdoc, swagger-ui-express
- helmet, compression, morgan
- joi (validation)

**Frontend**:
- @tanstack/react-query
- zustand
- axios
- framer-motion
- konva, react-konva
- class-variance-authority, clsx, tailwind-merge
- react-dropzone

## Quick Start

### Option 1: Use New Simplified Structure

1. Install root dependencies:
```bash
npm install
```

2. Install all project dependencies:
```bash
npm run install:all
```

3. Replace old files with new simplified versions:
```bash
# Backend
cp backend/package-new.json backend/package.json
# Use backend/src/index.ts (already created)

# Frontend  
cp frontend/package-new.json frontend/package.json
cp frontend/src/App-new.tsx frontend/src/App.tsx
```

4. Run both frontend and backend:
```bash
npm run dev
```

### Option 2: Start Fresh

1. Backup your current project
2. Delete everything except the `/Textures` folder
3. Copy the simplified files:
   - `/shared/` folder
   - `/backend/src/index.ts` + simplified package.json
   - `/frontend/src/App-new.tsx` + simplified package.json
   - Root `package.json`

## File Structure (After Refactoring)

```
/
├── shared/
│   ├── types.ts (68 lines - all types)
│   └── constants.ts (62 lines - all constants & validation)
├── backend/
│   ├── src/
│   │   └── index.ts (440 lines - everything)
│   └── package.json (simplified dependencies)
├── frontend/
│   ├── src/
│   │   ├── App-new.tsx (580 lines - everything)
│   │   └── main.tsx (unchanged)
│   └── package.json (simplified dependencies)
├── package.json (root dev scripts)
└── Textures/ (unchanged)
```

**Total**: ~1150 lines (was ~2500+)

## Development Workflow

1. **Start development**: `npm run dev`
   - Backend runs on http://localhost:8888
   - Frontend runs on http://localhost:3000
   - API proxied through Vite

2. **Add features**: Edit single files instead of multiple components

3. **Build**: `npm run build`

4. **Clean**: `npm run clean` (removes all node_modules and dist folders)

## Key Features Retained

✅ Tile extraction with grid detection  
✅ AI-powered tile classification  
✅ Manual tile classification  
✅ Map generation with multiple algorithms  
✅ Canvas-based map rendering  
✅ PNG export functionality  
✅ Responsive UI with Tailwind  
✅ TypeScript throughout  
✅ File upload with validation  
✅ Error handling and loading states  

## What Was Removed

❌ Complex state management (Zustand)  
❌ Advanced data fetching (React Query)  
❌ Swagger documentation  
❌ Multiple UI component files  
❌ Complex validation schemas  
❌ Unnecessary middleware  
❌ Test files (can add back if needed)  
❌ Advanced canvas libraries (Konva)  
❌ Drag & drop (simplified to click upload)  

## Next Steps

This simplified structure makes it much easier to:
- Add new features
- Debug issues  
- Understand the codebase
- Deploy the application
- Maintain the project

The architecture prioritizes simplicity and maintainability over architectural purity, perfect for a focused map generation tool.
