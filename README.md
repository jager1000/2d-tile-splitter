# Simplified 2D Map Generator

A streamlined tile-based map generator with AI-powered tile classification.

## Refactoring Summary

This project has been simplified from ~2500 lines to under 1000 lines total by:

### Structure Changes
- **Shared types/constants**: Single source of truth in `/shared/` folder
- **Backend**: Consolidated to 1 main file (`backend/src/index.ts`)
- **Frontend**: Merged components into single App file (`frontend/src/App-new.tsx`)
- **Dependencies**: Removed 15+ unnecessary packages

### Key Simplifications

#### Backend (`backend/src/index.ts`)
- Merged all routes into one file
- Merged all services into one file
- Removed Swagger documentation
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
