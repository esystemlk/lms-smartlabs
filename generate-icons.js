const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [48, 72, 96, 128, 192, 256, 512];
const inputPath = path.join(__dirname, 'public', 'logo.png');
const outputDir = path.join(__dirname, 'public', 'icons');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
    for (const size of sizes) {
        const outputPath = path.join(outputDir, `icon-${size}.png`);
        await sharp(inputPath)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .png()
            .toFile(outputPath);
        console.log(`Generated icon-${size}.png`);
    }
    console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
