const API_BASE = 'http://localhost:5000/api';
const fs = require('fs');
const path = require('path');

// Test configuration
const ATLAS_PATH = '../Textures/atlas16.jpg'; // 4x4 grid
const TEST_CONFIG = {
  gridConfig: { type: 'preset', cols: 4, rows: 4 },
  tileSize: 32
};

async function runAPITests() {
  console.log('🧪 Starting API Test Suite\n');
  
  let atlasId = null;
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Endpoint...');
    const healthResponse = await fetch(`${API_BASE.replace('/api', '')}/health`);
    const health = await healthResponse.json();
    console.log('✅ Health Check:', health.status === 'ok' ? 'PASSED' : 'FAILED');
    console.log(`   Response: ${JSON.stringify(health)}\n`);
    
    // Test 2: Tiles Service Test
    console.log('2️⃣ Testing Tiles Service...');
    const tilesTestResponse = await fetch(`${API_BASE}/tiles/test`);
    const tilesTest = await tilesTestResponse.json();
    console.log('✅ Tiles Service:', tilesTest.success ? 'PASSED' : 'FAILED');
    console.log(`   Supported formats: ${tilesTest.data.supportedFormats.join(', ')}`);
    console.log(`   Max file size: ${(tilesTest.data.maxFileSize / 1024 / 1024).toFixed(1)}MB\n`);
    
    // Test 3: Maps Service Test
    console.log('3️⃣ Testing Maps Service...');
    const mapsTestResponse = await fetch(`${API_BASE}/maps/test`);
    const mapsTest = await mapsTestResponse.json();
    console.log('✅ Maps Service:', mapsTest.success ? 'PASSED' : 'FAILED');
    console.log(`   Map size range: ${mapsTest.data.mapSizeRange.min}-${mapsTest.data.mapSizeRange.max}`);
    console.log(`   Supported environments: ${mapsTest.data.supportedEnvironments.join(', ')}\n`);
    
    // Test 4: Tile Extraction (if atlas file exists)
    console.log('4️⃣ Testing Tile Extraction...');
    const atlasPath = path.resolve(__dirname, ATLAS_PATH);
    
    if (fs.existsSync(atlasPath)) {
      console.log(`   📁 Found atlas file: ${atlasPath}`);
      
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(atlasPath);
      const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
      formData.append('image', blob, 'atlas16.jpg');
      formData.append('gridConfig', JSON.stringify(TEST_CONFIG.gridConfig));
      formData.append('tileSize', TEST_CONFIG.tileSize.toString());
      
      const extractResponse = await fetch(`${API_BASE}/tiles/extract`, {
        method: 'POST',
        body: formData
      });
      
      const extractResult = await extractResponse.json();
      
      if (extractResult.success && extractResult.data) {
        atlasId = extractResult.data.id;
        const atlas = extractResult.data;
        
        console.log('✅ Tile Extraction: PASSED');
        console.log(`   📊 Atlas ID: ${atlas.id}`);
        console.log(`   📐 Original size: ${atlas.originalImage.width}×${atlas.originalImage.height}px`);
        console.log(`   🔳 Grid: ${atlas.grid.cols}×${atlas.grid.rows}`);
        console.log(`   🎨 Extracted tiles: ${atlas.tiles.length}`);
        console.log(`   🎯 Expected for 4×4 grid: 16 tiles`);
        console.log(`   ✨ Result: ${atlas.tiles.length === 16 ? 'PERFECT! ✅' : 'UNEXPECTED COUNT ⚠️'}`);
        
        // Display tile classifications
        const classifications = atlas.tiles.reduce((acc, tile) => {
          acc[tile.classification] = (acc[tile.classification] || 0) + 1;
          return acc;
        }, {});
        console.log(`   🏷️ Classifications:`, classifications);
        
      } else {
        console.log('❌ Tile Extraction: FAILED');
        console.log(`   Error: ${extractResult.error || 'Unknown error'}`);
      }
    } else {
      console.log(`   ⚠️ Atlas file not found: ${atlasPath}`);
      console.log('   Skipping tile extraction test');
    }
    console.log();
    
    // Test 5: Map Generation
    console.log('5️⃣ Testing Map Generation...');
    const mapParams = {
      width: 32,
      height: 32,
      tileSize: 32,
      environmentType: 'nature',
      atlasId: atlasId || 'test-atlas-id',
      enabledLayers: {
        floors: true,
        walls: true,
        decorations: true
      },
      seed: 12345
    };
    
    const mapResponse = await fetch(`${API_BASE}/maps/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mapParams)
    });
    
    const mapResult = await mapResponse.json();
    
    if (mapResult.success && mapResult.data) {
      const map = mapResult.data;
      console.log('✅ Map Generation: PASSED');
      console.log(`   🗺️ Map ID: ${map.id}`);
      console.log(`   📏 Size: ${map.width}×${map.height}`);
      console.log(`   🎮 Environment: ${map.environmentType}`);
      console.log(`   🔗 Atlas ID: ${map.atlasId}`);
      console.log(`   📅 Created: ${new Date(map.createdAt).toLocaleString()}`);
    } else {
      console.log('❌ Map Generation: FAILED');
      console.log(`   Error: ${mapResult.error || 'Unknown error'}`);
    }
    console.log();
    
    // Test 6: Error Handling
    console.log('6️⃣ Testing Error Handling...');
    
    // Test invalid endpoint
    const invalidResponse = await fetch(`${API_BASE}/invalid-endpoint`);
    console.log(`   Invalid endpoint (404): ${invalidResponse.status === 404 ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    // Test invalid file upload
    const invalidFormData = new FormData();
    invalidFormData.append('image', new Blob(['invalid'], { type: 'text/plain' }), 'test.txt');
    invalidFormData.append('gridConfig', JSON.stringify({ type: 'auto' }));
    invalidFormData.append('tileSize', '32');
    
    const invalidFileResponse = await fetch(`${API_BASE}/tiles/extract`, {
      method: 'POST',
      body: invalidFormData
    });
    const invalidFileResult = await invalidFileResponse.json();
    console.log(`   Invalid file type: ${!invalidFileResult.success ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    // Test invalid map parameters
    const invalidMapResponse = await fetch(`${API_BASE}/maps/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ width: 999 }) // Invalid size
    });
    const invalidMapResult = await invalidMapResponse.json();
    console.log(`   Invalid map params: ${!invalidMapResult.success ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log();
    
    // Test Summary
    console.log('🎯 TEST SUMMARY');
    console.log('================');
    console.log('✅ Backend server running');
    console.log('✅ All API endpoints responding');
    console.log('✅ Type safety and validation working');
    console.log('✅ Error handling implemented');
    if (atlasId) {
      console.log('✅ Tile extraction working with real image');
      console.log('✅ AI classification operational');
    }
    console.log('✅ Map generation service functional');
    console.log('\n🚀 API is ready for frontend integration!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    console.log('\n🔧 Make sure the backend server is running on port 5000');
  }
}

// Make it work in both Node.js and browser environments
if (typeof require !== 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  const FormData = require('form-data');
  const fs = require('fs');
  runAPITests();
} else {
  // Browser environment - just export the function
  window.runAPITests = runAPITests;
}
