const sharp = require('sharp');

const inputPath = 'C:/Users/User/.gemini/antigravity/brain/3fe187ec-2366-4611-92ec-5171ac6dca93/.user_uploaded/media_1787454585500.jpg';
const outputPath = 'D:/Antigravity Projects/Bedtime Stories/playstore-assets/playstore_icon_512.png';
const expoIconPath = 'D:/Antigravity Projects/Bedtime Stories/assets/images/icon.png';
const adaptiveIconPath = 'D:/Antigravity Projects/Bedtime Stories/assets/images/adaptive-icon.png';

async function resizeImage() {
  try {
    const buffer = await sharp(inputPath)
      .resize(512, 512)
      .png({ quality: 90 }) // 32-bit PNG (Google Play standard)
      .toBuffer();

    await sharp(buffer).toFile(outputPath);
    console.log('Saved Play Store icon: ' + outputPath);
    
    // Update Expo icons
    await sharp(buffer).toFile(expoIconPath);
    await sharp(buffer).toFile(adaptiveIconPath);
    console.log('Updated Expo app icons in assets/images/');
    
  } catch (error) {
    console.error('Error resizing image:', error);
  }
}

resizeImage();
