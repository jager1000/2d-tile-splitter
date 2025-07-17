// Map Generation Factory
class MapGeneratorFactory {
    static createGenerator(environmentType, tilesByType) {
        switch(environmentType) {
            case 'nature':
                return NatureMapGenerator;
            case 'dungeon':
                return DungeonMapGenerator;
            case 'city':
                return CityMapGenerator;
            case 'auto':
                return this.selectAutoGenerator(tilesByType);
            case 'abstract':
            default:
                return TopDownMapGenerator;
        }
    }

    static selectAutoGenerator(tilesByType) {
        // Simple heuristic based on tile types available
        const hasWater = tilesByType.wall && tilesByType.wall.length > 0;
        const hasVegetation = tilesByType.decoration && tilesByType.decoration.length > 0;
        
        if (hasWater && hasVegetation) {
            return NatureMapGenerator;
        } else if (tilesByType.wall && tilesByType.wall.length > tilesByType.floor.length) {
            return DungeonMapGenerator;
        } else {
            return TopDownMapGenerator;
        }
    }

    static generate(width, height, tilesByType, environmentType) {
        const generator = this.createGenerator(environmentType, tilesByType);
        return generator.generate(width, height, tilesByType);
    }
}

// Export for use in other modules
window.MapGeneratorFactory = MapGeneratorFactory;
