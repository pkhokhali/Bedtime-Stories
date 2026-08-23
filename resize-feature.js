const sharp = require('sharp');

const inputPath = 'C:/Users/User/.gemini/antigravity/brain/3fe187ec-2366-4611-92ec-5171ac6dca93/.user_uploaded/media_1787454802821.jpg';
const outputPath = 'D:/Antigravity Projects/Bedtime Stories/playstore-assets/playstore_feature_graphic_1024.png';

async function resizeFeatureGraphic() {
  try {
    await sharp(inputPath)
      .resize(1024, 500, {
        fit: 'cover', // Ensures it fills 1024x500 without stretching
        position: 'center'
      })
      .png({ quality: 90 })
      .toFile(outputPath);
    
    console.log('Saved Play Store Feature Graphic: ' + outputPath);
  } catch (error) {
    console.error('Error resizing image:', error);
  }
}

resizeFeatureGraphic();
