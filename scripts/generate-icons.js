// Simple script to generate placeholder PWA icons as SVG-based PNGs
// In production, replace these with properly designed icons from logo.png

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Create a simple SVG with the BookedWell "B" letter and blue background
function createSVG(size) {
  const fontSize = Math.round(size * 0.5);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="#4285F4"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="${fontSize}" fill="white">B</text>
</svg>`;
}

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Created ${filename}`);
});

// Also create apple-touch-icon
const appleSvg = createSVG(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleSvg);
console.log('Created apple-touch-icon.svg');

console.log('\nNote: For production, convert these SVGs to PNGs using the logo.png asset.');
console.log('You can use sharp or any image tool to generate proper PNG icons.');
