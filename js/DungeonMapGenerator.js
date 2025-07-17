// Dungeon environment generator
class DungeonMapGenerator extends BaseMapGenerator {
    static generatePattern(map, tilesByType) {
        const height = map.length;
        const width = map[0].length;
        
        // Start with walls everywhere
        this.fillWithTiles(map, tilesByType.wall || []);
        
        // Carve out rooms and corridors with floors
        const rooms = this.generateRooms(map, tilesByType.floor || [], width, height);
        this.connectRooms(map, rooms, tilesByType.floor || []);
        this.addDecorations(map, tilesByType);
        
        return map;
    }

    static generateRooms(map, floors, width, height) {
        if (floors.length === 0) return [];
        
        const numRooms = Math.floor(Math.random() * 4) + 3;
        const rooms = [];
        
        for (let i = 0; i < numRooms; i++) {
            const room = this.generateRoom(width, height);
            rooms.push(room);
            
            // Fill room with floor
            for (let y = room.y; y < room.y + room.height; y++) {
                for (let x = room.x; x < room.x + room.width; x++) {
                    map[y][x] = this.getRandomTile(floors);
                }
            }
        }
        
        return rooms;
    }

    static generateRoom(mapWidth, mapHeight) {
        const roomWidth = Math.floor(Math.random() * 8) + 4;
        const roomHeight = Math.floor(Math.random() * 8) + 4;
        const roomX = Math.floor(Math.random() * (mapWidth - roomWidth - 2)) + 1;
        const roomY = Math.floor(Math.random() * (mapHeight - roomHeight - 2)) + 1;
        
        return { x: roomX, y: roomY, width: roomWidth, height: roomHeight };
    }

    static connectRooms(map, rooms, floors) {
        if (floors.length === 0 || rooms.length < 2) return;
        
        for (let i = 0; i < rooms.length - 1; i++) {
            const room1 = rooms[i];
            const room2 = rooms[i + 1];
            
            this.createCorridor(map, room1, room2, floors);
        }
    }

    static createCorridor(map, room1, room2, floors) {
        const x1 = room1.x + Math.floor(room1.width / 2);
        const y1 = room1.y + Math.floor(room1.height / 2);
        const x2 = room2.x + Math.floor(room2.width / 2);
        const y2 = room2.y + Math.floor(room2.height / 2);
        
        // Horizontal corridor
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            map[y1][x] = this.getRandomTile(floors);
        }
        
        // Vertical corridor
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            map[y][x2] = this.getRandomTile(floors);
        }
    }

    static addDecorations(map, tilesByType) {
        const decorations = tilesByType.decoration || [];
        const walls = tilesByType.wall || [];
        
        if (decorations.length === 0 || walls.length === 0) return;
        
        const height = map.length;
        const width = map[0].length;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                // Place decorations on floor tiles near walls
                if (!walls.includes(map[y][x]) && Math.random() < 0.05) {
                    if (this.isNearWall(map, x, y, walls)) {
                        map[y][x] = this.getRandomTile(decorations);
                    }
                }
            }
        }
    }

    static isNearWall(map, x, y, walls) {
        const height = map.length;
        const width = map[0].length;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const newY = y + dy;
                const newX = x + dx;
                
                if (newY >= 0 && newY < height && newX >= 0 && newX < width && 
                    walls.includes(map[newY][newX])) {
                    return true;
                }
            }
        }
        
        return false;
    }
}

// Export for use in other modules
window.DungeonMapGenerator = DungeonMapGenerator;
