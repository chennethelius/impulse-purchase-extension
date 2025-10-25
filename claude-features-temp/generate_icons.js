const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    // Draw background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Draw shield
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(2, size / 32);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const shieldWidth = size * 0.6;
    const shieldHeight = size * 0.7;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - shieldHeight/2);
    ctx.lineTo(centerX + shieldWidth/2, centerY - shieldHeight/4);
    ctx.lineTo(centerX + shieldWidth/2, centerY + shieldHeight/4);
    ctx.lineTo(centerX, centerY + shieldHeight/2);
    ctx.lineTo(centerX - shieldWidth/2, centerY + shieldHeight/4);
    ctx.lineTo(centerX - shieldWidth/2, centerY - shieldHeight/4);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // Draw dollar sign
    ctx.fillStyle = '#667eea';
    ctx.font = `bold ${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', centerX, centerY);
    
    // Save
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    console.log(`Generated ${filename}`);
}

// Generate all icon sizes
generateIcon(16, 'icon16.png');
generateIcon(48, 'icon48.png');
generateIcon(128, 'icon128.png');
