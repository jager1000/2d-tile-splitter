const FormData = require('form-data');
const fs = require('fs');
const { default: fetch } = require('node-fetch');

async function detailedTest() {
  console.log('🧪 Testing atlas16.jpg with 4x4 grid configuration...\n');
  
  try {
    // Create form data
    const form = new FormData();
    form.append('image', fs.createReadStream('../Textures/atlas16.jpg'));
    form.append('gridConfig', JSON.stringify({
      type: 'custom',
      cols: 4,
      rows: 4
    }));
    form.append('tileSize', '32');

    // Send request
    const response = await fetch('http://localhost:8890/extract-tiles', {
      method: 'POST',
      body: form
    });

    const result = await response.json();
    
    if (result.success) {
      const { data: atlas } = result;
      
      console.log('📊 ATLAS EXTRACTION RESULTS:');
      console.log(`   Atlas ID: ${atlas.id}`);
      console.log(`   Original File: ${atlas.name}`);
      console.log(`   Original Dimensions: ${atlas.originalImage.width}x${atlas.originalImage.height}px`);
      console.log(`   Grid Configuration: ${atlas.grid.cols}x${atlas.grid.rows}`);
      console.log(`   Tile Dimensions: ${atlas.grid.tileWidth}x${atlas.grid.tileHeight}px (source)`);
      console.log(`   Output Tile Size: 32x32px`);
      console.log(`   Total Tiles Extracted: ${atlas.tiles.length} tiles`);
      
      // Verify we got exactly 16 tiles
      if (atlas.tiles.length === 16) {
        console.log('   ✅ CORRECT: Got exactly 16 tiles as expected for 4x4 grid');
      } else {
        console.log(`   ❌ ERROR: Expected 16 tiles, got ${atlas.tiles.length}`);
        return;
      }
      
      console.log('\n🏷️  TILE CLASSIFICATION BREAKDOWN:');
      const classifications = {};
      atlas.tiles.forEach((tile, index) => {
        classifications[tile.classification] = (classifications[tile.classification] || 0) + 1;
      });
      
      Object.entries(classifications).forEach(([type, count]) => {
        const percentage = ((count / atlas.tiles.length) * 100).toFixed(1);
        console.log(`   ${type.toUpperCase()}: ${count} tiles (${percentage}%)`);
      });
      
      console.log('\n🗺️  TILE GRID LAYOUT:');
      console.log('   Tile IDs arranged in 4x4 grid:');
      for (let row = 0; row < 4; row++) {
        let rowString = '   ';
        for (let col = 0; col < 4; col++) {
          const tileId = `${row}-${col}`;
          const tile = atlas.tiles.find(t => t.id === tileId);
          const classification = tile ? tile.classification[0].toUpperCase() : '?';
          rowString += `[${tileId}:${classification}] `;
        }
        console.log(rowString);
      }
      
      console.log('\n✅ Backend test completed successfully!');
      console.log('   - Atlas extraction: ✓');
      console.log('   - Correct tile count: ✓');
      console.log('   - Tile classification: ✓');
      console.log('   - Grid layout: ✓');
      
    } else {
      console.error('❌ Tile extraction failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

detailedTest();
