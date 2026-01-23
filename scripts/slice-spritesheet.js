#!/usr/bin/env node

/**
 * Sprite Sheet Slicer
 * Нарезает PNG спрайт-лист на отдельные тайлы заданного размера
 * 
 * Usage:
 *   node scripts/slice-spritesheet.js <input.png> [options]
 * 
 * Options:
 *   --tile-size <size>     Размер тайла в пикселях (по умолчанию: 16)
 *   --output-dir <dir>     Директория для сохранения тайлов (по умолчанию: public/tilesets/sliced)
 *   --output-json <file>   Сохранить JSON с координатами (опционально)
 *   --prefix <prefix>      Префикс для имен файлов (по умолчанию: tile)
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Парсинг аргументов командной строки
const args = process.argv.slice(2);
const inputFile = args[0];

if (!inputFile) {
  console.error('Usage: node scripts/slice-spritesheet.js <input.png> [options]');
  console.error('Options:');
  console.error('  --tile-size <size>     Tile size in pixels (default: 16)');
  console.error('  --output-dir <dir>     Output directory (default: public/tilesets/sliced)');
  console.error('  --output-json <file>   Save JSON with coordinates (optional)');
  console.error('  --prefix <prefix>      File name prefix (default: tile)');
  process.exit(1);
}

// Парсинг опций
let tileSize = 16;
let outputDir = 'public/tilesets/sliced';
let outputJson = null;
let prefix = 'tile';

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--tile-size' && args[i + 1]) {
    tileSize = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--output-dir' && args[i + 1]) {
    outputDir = args[i + 1];
    i++;
  } else if (args[i] === '--output-json' && args[i + 1]) {
    outputJson = args[i + 1];
    i++;
  } else if (args[i] === '--prefix' && args[i + 1]) {
    prefix = args[i + 1];
    i++;
  }
}

async function sliceSpritesheet() {
  try {
    // Проверка существования входного файла
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: File not found: ${inputFile}`);
      process.exit(1);
    }

    console.log(`Loading spritesheet: ${inputFile}`);
    const image = await loadImage(inputFile);
    
    const width = image.width;
    const height = image.height;
    const cols = Math.floor(width / tileSize);
    const rows = Math.floor(height / tileSize);
    
    console.log(`Spritesheet size: ${width}x${height}px`);
    console.log(`Tile size: ${tileSize}x${tileSize}px`);
    console.log(`Grid: ${cols}x${rows} tiles`);
    console.log(`Total tiles: ${cols * rows}`);
    
    // Создание выходной директории
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    }
    
    // Создание canvas для нарезки
    const canvas = createCanvas(tileSize, tileSize);
    const ctx = canvas.getContext('2d');
    
    const tileMap = {};
    let tileIndex = 0;
    
    // Нарезка тайлов
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * tileSize;
        const y = row * tileSize;
        
        // Очистка canvas
        ctx.clearRect(0, 0, tileSize, tileSize);
        
        // Копирование части изображения
        ctx.drawImage(
          image,
          x, y, tileSize, tileSize,  // source
          0, 0, tileSize, tileSize   // destination
        );
        
        // Сохранение тайла
        const tileName = `${prefix}_${row}_${col}.png`;
        const tilePath = path.join(outputDir, tileName);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(tilePath, buffer);
        
        // Сохранение координат в маппинг
        const key = `${prefix}_${row}_${col}`;
        tileMap[key] = [x, y];
        
        tileIndex++;
      }
    }
    
    console.log(`\n✓ Sliced ${tileIndex} tiles to ${outputDir}/`);
    
    // Сохранение JSON с координатами (если указано)
    if (outputJson) {
      const jsonData = {
        tileSize,
        spritesheet: {
          width,
          height,
          cols,
          rows,
        },
        tiles: tileMap,
        // Генерация TypeScript-совместимого формата для pixelholeMap.ts
        typescript: Object.entries(tileMap)
          .map(([key, [x, y]]) => `  ${key}: [${x}, ${y}],`)
          .join('\n'),
      };
      
      fs.writeFileSync(outputJson, JSON.stringify(jsonData, null, 2));
      console.log(`✓ Saved coordinates to ${outputJson}`);
      console.log(`\nYou can copy the coordinates from the JSON file to pixelholeMap.ts`);
    }
    
    console.log('\nDone!');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

sliceSpritesheet();
