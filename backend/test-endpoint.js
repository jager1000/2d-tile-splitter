const FormData = require('form-data');
const fs = require('fs');
const { default: fetch } = require('node-fetch');

async function testTileExtraction() {
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
      console.log('✓ Tile extraction successful!');
      console.log(`Atlas ID: ${result.data.id}`);
      console.log(`Atlas Name: ${result.data.name}`);
      console.log(`Grid: ${result.data.grid.cols}x${result.data.grid.rows}`);
      console.log(`Number of tiles extracted: ${result.data.tiles.length}`);
      console.log('Tile classifications:');
      
      const classifications = {};
      result.data.tiles.forEach(tile => {
        classifications[tile.classification] = (classifications[tile.classification] || 0) + 1;
      });
      
      Object.entries(classifications).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} tiles`);
      });

      // Test map generation
      await testMapGeneration(result.data.id, result.data.tiles);
    } else {
      console.error('✗ Tile extraction failed:', result.error);
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

async function testMapGeneration(atlasId, tiles) {
  try {
    // Group tiles by classification
    const tilesByType = {
      floor: [],
      wall: [],
      decoration: []
    };

    tiles.forEach(tile => {
      tilesByType[tile.classification].push(tile.id);
    });

    const mapParams = {
      width: 10,
      height: 10,
      tileSize: 32,
      environmentType: 'dungeon',
      atlasId: atlasId,
      tilesByType: tilesByType
    };

    const response = await fetch('http://localhost:8890/generate-map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mapParams)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✓ Map generation successful!');
      console.log(`Map ID: ${result.data.id}`);
      console.log(`Map Size: ${result.data.width}x${result.data.height}`);
      console.log(`Total cells: ${result.data.cells.length * result.data.cells[0].length}`);
      
      // Count cell types
      const cellTypes = { floor: 0, wall: 0, decoration: 0 };
      result.data.cells.forEach(row => {
        row.forEach(cell => {
          cellTypes[cell.layer]++;
        });
      });
      
      console.log('Cell distribution:');
      Object.entries(cellTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} cells`);
      });

      console.log('\n✓ End-to-end test completed successfully!');
      return result.data.id;
    } else {
      console.error('✗ Map generation failed:', result.error);
    }
  } catch (error) {
    console.error('✗ Map generation error:', error.message);
  }
}

// Run the test
testTileExtraction();
