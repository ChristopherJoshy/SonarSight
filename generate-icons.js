import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directory if it doesn't exist
const iconDir = path.join(__dirname, 'extension', 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Function to generate icon
function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background circle - primary blue
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
  ctx.fillStyle = '#3B82F6';
  ctx.fill();
  
  // Inner circle - lighter blue
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 * 0.75, 0, Math.PI * 2);
  ctx.fillStyle = '#60A5FA';
  ctx.fill();
  
  // Sonar wave circles
  const drawWave = (radius, opacity) => {
    ctx.beginPath();
    ctx.arc(size/2, size/2, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(239, 246, 255, ${opacity})`;
    ctx.lineWidth = size > 32 ? 2 : 1;
    ctx.stroke();
  };
  
  drawWave(size/2 * 0.6, 0.8);
  drawWave(size/2 * 0.45, 0.6);
  drawWave(size/2 * 0.32, 0.4);
  
  // Central eye element
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#1E40AF';
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  
  // Light beam/ray effect (for larger icons)
  if (size > 32) {
    ctx.beginPath();
    ctx.moveTo(size/2, size/2 - size/2 * 0.2);
    ctx.lineTo(size/2 + size/2 * 0.1, size/2 - size/2 * 0.55);
    ctx.lineTo(size/2 - size/2 * 0.1, size/2 - size/2 * 0.55);
    ctx.closePath();
    ctx.fillStyle = 'rgba(219, 234, 254, 0.7)';
    ctx.fill();
  }
  
  // Light reflection on lens
  ctx.beginPath();
  ctx.arc(size/2 + size/2 * 0.07, size/2 - size/2 * 0.07, size/2 * 0.05, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fill();
  
  return canvas;
}

// Generate icons in different sizes
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const canvas = generateIcon(size);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconDir, `icon${size}.png`), buffer);
  console.log(`Generated icon${size}.png`);
});

console.log('All icons generated successfully!');