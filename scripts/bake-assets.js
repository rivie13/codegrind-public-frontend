import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const INPUT_FILE = 'C:/Users/rivie/CursorProjects/CodeGrind_Assets/Art_Assets/tiled/backgrounds_loadingScreens/Dusk_City_Background_UNCROPPED.png';
const OUTPUT_DIR = 'C:/Users/rivie/CursorProjects/CodeGrind_Assets/Art_Assets/tiled/backgrounds_loadingScreens/baked_backdrop';

async function bake() {
  console.log('⚡ Starting backdrop slicing/baking...');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const meta = await sharp(INPUT_FILE).metadata();
  console.log(`Input image: ${meta.width}x${meta.height}`);

  const frameCount = 81;
  const frameWidth = Math.floor(meta.width / frameCount); // 152361 / 81 = 1881
  const frameHeight = meta.height; // 918

  console.log(`Baking ${frameCount} frames of size ${frameWidth}x${frameHeight}...`);

  for (let i = 0; i < frameCount; i++) {
    const left = i * frameWidth;
    const outputFilename = `Dusk_City_Background_UNCROPPED_frame_${i}.png`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    // console.log to avoid spamming 81 lines, but show progress at intervals
    if (i % 10 === 0 || i === frameCount - 1) {
      console.log(`Slicing frame ${i}/${frameCount - 1} at left offset ${left}...`);
    }
    
    await sharp(INPUT_FILE)
      .extract({ left, top: 0, width: frameWidth, height: frameHeight })
      .toFile(outputPath);
  }

  console.log('✅ Slicing completed successfully!');
}

bake().catch(err => {
  console.error('Error during baking:', err);
});
