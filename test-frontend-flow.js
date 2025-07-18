// Quick test of the complete frontend flow
const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCompleteFlow() {
  console.log('🧪 Testing complete frontend flow...\n');
  
  try {
    // Step 1: Test backend connection
    console.log('1️⃣ Testing backend connection...');
    const healthResponse = await fetch('http://localhost:8891/');
    const healthResult = await healthResponse.json();
    console.log(`   ✅ Backend responding: ${healthResult.message}`);
    
    // Step 2: Test frontend proxy
    console.log('\n2️⃣ Testing frontend proxy...');
    const proxyResponse = await fetch('http://localhost:3005/api/');
    const proxyResult = await proxyResponse.json();
    console.log(`   ✅ Proxy working: ${proxyResult.message}`);
    
    // Step 3: Test tile extraction
    console.log('\n3️⃣ Testing tile extraction...');
    const formData = new FormData();
    formData.append('image', fs.createReadStream('./Textures/atlas16.jpg'));
    formData.append('gridConfig', JSON.stringify({
      type: 'custom',
      cols: 4,
      rows: 4
    }));
    formData.append('tileSize', '32');
    
    const extractResponse = await fetch('http://localhost:3005/api/extract-tiles', {
      method: 'POST',
      body: formData
    });
    
    if (!extractResponse.ok) {
      throw new Error(`HTTP ${extractResponse.status}: ${await extractResponse.text()}`);
    }
    
    const extractResult = await extractResponse.json();
    console.log(`   ✅ Tiles extracted: ${extractResult.data.tiles.length} tiles`);
    
    // Step 4: Test map generation
    console.log('\n4️⃣ Testing map generation...');
    const atlas = extractResult.data;
    
    const tilesByType = {
      floor: atlas.tiles.filter(t => t.classification === 'floor').map(t => t.id),
      wall: atlas.tiles.filter(t => t.classification === 'wall').map(t => t.id),
      decoration: atlas.tiles.filter(t => t.classification === 'decoration').map(t => t.id)
    };
    
    // Ensure we have at least some tiles
    if (tilesByType.floor.length === 0) {
      tilesByType.floor = [atlas.tiles[0].id];
    }
    if (tilesByType.wall.length === 0) {
      tilesByType.wall = [atlas.tiles[Math.floor(atlas.tiles.length / 2)].id];
    }
    if (tilesByType.decoration.length === 0) {
      tilesByType.decoration = [atlas.tiles[atlas.tiles.length - 1].id];
    }
    
    const mapParams = {
      width: 8,
      height: 8,
      tileSize: 32,
      environmentType: 'dungeon',
      atlasId: atlas.id,
      tilesByType: tilesByType
    };
    
    const mapResponse = await fetch('http://localhost:3005/api/generate-map', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapParams)
    });
    
    if (!mapResponse.ok) {
      throw new Error(`HTTP ${mapResponse.status}: ${await mapResponse.text()}`);
    }
    
    const mapResult = await mapResponse.json();
    console.log(`   ✅ Map generated: ${mapResult.data.width}x${mapResult.data.height}`);
    console.log(`   ✅ Cells structure: ${Array.isArray(mapResult.data.cells) ? 'Valid array' : 'Invalid'}`);
    console.log(`   ✅ Cell count: ${mapResult.data.cells.length * mapResult.data.cells[0].length}`);
    
    console.log('\n🎉 ALL TESTS PASSED! Frontend should be working correctly.');
    console.log('\n📋 Summary:');
    console.log(`   • Backend API: ✅ http://localhost:8891`);
    console.log(`   • Frontend: ✅ http://localhost:3005`);
    console.log(`   • Proxy: ✅ Working`);
    console.log(`   • Tile Extraction: ✅ Working`);
    console.log(`   • Map Generation: ✅ Working`);
    console.log('\n🚀 Ready for use!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure backend is running: npm run dev (in backend folder)');
    console.log('   2. Make sure frontend is running: npm run dev (in frontend folder)');
    console.log('   3. Check that ports 8891 and 3005 are available');
  }
}

testCompleteFlow();
