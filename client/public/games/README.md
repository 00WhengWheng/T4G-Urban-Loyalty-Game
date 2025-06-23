# T4G Urban Games Assets

This directory contains placeholder assets for the urban mini-games.

## Directory Structure

```
/games/
├── assets/          # Game sprites and images
│   ├── player.png   # Player character sprites
│   ├── obstacles.png # Obstacle sprites
│   ├── coins.png    # Collectible coin sprites
│   ├── buildings.png # Building assets
│   └── ...
├── audio/           # Game audio files
│   ├── jump.mp3     # Jump sound effect
│   ├── collect.mp3  # Collection sound effect
│   ├── background.mp3 # Background music
│   └── ...
└── backgrounds/     # Background images
    ├── city-skyline.png
    ├── city-park.png
    └── ...
```

## Asset Requirements

### Sprites
- **Player**: 32x48px blue rectangle (currently generated procedurally)
- **Obstacles**: 40x40px red rectangle (currently generated procedurally)
- **Coins**: 32x32px yellow circle (currently generated procedurally)
- **Buildings**: Various sizes for city backgrounds

### Audio
- **Jump**: Short bounce/jump sound
- **Collect**: Coin collection sound
- **Background**: Upbeat urban/electronic music loops
- **Victory**: Success sound for game completion

### Backgrounds
- **City Skyline**: Urban landscape background
- **City Park**: Green space environment
- **Street View**: Street-level city scene

## Current Implementation

The games currently use procedurally generated colored shapes as placeholders:
- Blue rectangles for players
- Red rectangles for obstacles  
- Yellow circles for coins
- Simple colored backgrounds

These can be replaced with actual sprite assets by placing PNG files in the appropriate directories and updating the asset loading code in the game scenes.

## Adding New Assets

1. Add image files to `/public/games/assets/`
2. Add audio files to `/public/games/audio/`
3. Update the game configuration in `src/games/config.ts`
4. Reference assets in the appropriate game scene files

## Mobile Optimization

All assets should be optimized for mobile devices:
- Use compressed PNG/JPG for images
- Use compressed MP3/OGG for audio
- Consider multiple resolutions for different screen densities
- Keep file sizes small for fast loading
