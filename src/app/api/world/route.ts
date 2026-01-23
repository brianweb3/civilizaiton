import { NextResponse } from "next/server";

// Mock world data endpoint
// In production, this would fetch from the simulation engine
export async function GET() {
  const worldWidth = 64;
  const worldHeight = 64;
  
  // Generate tiles
  const tiles = [];
  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      const seed = Math.sin(x * 0.1) * Math.cos(y * 0.1);
      const noise = Math.sin(x * 0.05 + y * 0.03) * 0.5 + 0.5;
      const distFromCenter = Math.sqrt((x - worldWidth / 2) ** 2 + (y - worldHeight / 2) ** 2);
      
      let terrain = "PLAINS";
      if (distFromCenter < 10) terrain = "URBAN";
      else if (distFromCenter < 20 && noise > 0.4) terrain = "URBAN";
      else if ((x > 40 && x < 50 && y > 10 && y < 25) || (x > 5 && x < 15 && y > 45 && y < 58)) {
        terrain = "WATER";
      } else if (seed > 0.3) terrain = "HILLS";
      else if (seed < -0.3) terrain = "FOREST";
      
      tiles.push({
        x,
        y,
        terrain,
        districtId: distFromCenter < 15 ? "D1" : null,
        buildingId: null,
        ownerId: null,
        population: Math.random() * 0.5,
        wealth: Math.random() * 0.3,
        conflict: Math.random() * 0.2,
        productivity: Math.random() * 0.4,
        happiness: 0.5 + Math.random() * 0.3,
        research: Math.random() * 0.2,
      });
    }
  }
  
  return NextResponse.json({
    tick: Date.now(),
    world: {
      w: worldWidth,
      h: worldHeight,
    },
    tiles,
    districts: [
      {
        id: "D1",
        name: "Central District",
        type: "GOVERNMENT",
        centerX: 500,
        centerY: 500,
        radius: 150,
        population: 100,
        wealth: 50000,
        productivity: 0.8,
        happiness: 0.7,
        dissent: 0.1,
        color: "#eab308",
      },
    ],
    buildings: [],
    citizens: [],
  });
}
