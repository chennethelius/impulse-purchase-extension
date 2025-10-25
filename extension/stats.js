// Stats page script
document.addEventListener('DOMContentLoaded', async () => {
    await loadStats();
    
    // Reset button handler
    document.getElementById('resetButton').addEventListener('click', async () => {
        if (confirm('Reset all stats?')) {
            await chrome.storage.local.set({
                stats: {
                    totalBattles: 0,
                    victories: 0,
                    defeats: 0,
                    moneySaved: 0,
                    savingsHistory: []
                }
            });
            await loadStats();
        }
    });
    
    // Setup hover tooltips for graph
    setupGraphTooltips();
});

async function loadStats() {
    const result = await chrome.storage.local.get('stats');
    const stats = result.stats || {
        totalBattles: 0,
        victories: 0,
        defeats: 0,
        moneySaved: 0,
        savingsHistory: []
    };
    
    // Update display
    document.getElementById('totalBattles').textContent = stats.totalBattles;
    document.getElementById('victories').textContent = stats.victories;
    document.getElementById('defeats').textContent = stats.defeats;
    document.getElementById('moneySaved').textContent = `$${stats.moneySaved.toFixed(2)}`;
    
    // Calculate win rate (defeats = user gave up = money saved)
    const winRate = stats.totalBattles > 0 
        ? ((stats.defeats / stats.totalBattles) * 100).toFixed(1)
        : 0;
    document.getElementById('winRate').textContent = `${winRate}%`;
    
    // Draw savings graph
    drawSavingsGraph(stats.savingsHistory || []);
}

function drawSavingsGraph(history) {
    const canvas = document.getElementById('savingsGraph');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    if (!history || history.length === 0) {
        // Show "NO DATA" message
        ctx.fillStyle = '#999999';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('NO DATA', width / 2, height / 2);
        return;
    }
    
    // Graph settings - more padding on left for Y-axis labels
    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...history, 10);
    const pointSpacing = history.length > 1 ? graphWidth / (history.length - 1) : 0;
    
    // Draw grid lines (retro style)
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines with labels
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (graphHeight / 4) * i;
        const value = maxValue - (maxValue / 4) * i;
        
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        
        // Y-axis labels
        ctx.fillStyle = '#666666';
        ctx.font = '7px "Press Start 2P"';
        ctx.textAlign = 'right';
        ctx.fillText(`$${value.toFixed(0)}`, padding.left - 8, y + 3);
    }
    
    // Draw axes
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    
    // Draw line graph
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    const points = [];
    history.forEach((value, index) => {
        const x = padding.left + (index * pointSpacing);
        const y = height - padding.bottom - ((value / maxValue) * graphHeight);
        points.push({ x, y, value, battle: index + 1 });
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw points (pixel style)
    ctx.fillStyle = '#fbbf24';
    points.forEach(point => {
        ctx.fillRect(point.x - 4, point.y - 4, 8, 8);
    });
    
    // Draw axis labels
    ctx.fillStyle = '#333333';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    
    // X-axis label
    ctx.fillText('BATTLES', width / 2, height - 8);
    
    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(12, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('SAVED', 0, 0);
    ctx.restore();
    
    // Store points for hover detection
    canvas.pointsData = points;
    canvas.graphPadding = padding;
    canvas.graphDimensions = { width: graphWidth, height: graphHeight, maxValue };
}

// Setup hover tooltips for graph
function setupGraphTooltips() {
    const canvas = document.getElementById('savingsGraph');
    const tooltip = document.createElement('div');
    tooltip.className = 'graph-tooltip';
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.9);
        color: #fbbf24;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 7px;
        font-family: 'Press Start 2P', monospace;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 1000;
        white-space: nowrap;
        border: 2px solid #fbbf24;
    `;
    document.body.appendChild(tooltip);
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        if (!canvas.pointsData) return;
        
        // Find closest point
        let closestPoint = null;
        let minDistance = Infinity;
        
        canvas.pointsData.forEach(point => {
            const distance = Math.sqrt(
                Math.pow(mouseX - point.x, 2) + 
                Math.pow(mouseY - point.y, 2)
            );
            
            if (distance < 15 && distance < minDistance) {
                closestPoint = point;
                minDistance = distance;
            }
        });
        
        if (closestPoint) {
            // Format: "3 battles: $150.00"
            const battleText = closestPoint.battle === 1 ? '1 battle' : `${closestPoint.battle} battles`;
            tooltip.textContent = `${battleText}: $${closestPoint.value.toFixed(2)}`;
            
            // Switch tooltip to left side if hovering over right half of canvas
            const canvasCenter = rect.width / 2;
            if (mouseX > canvasCenter) {
                // Show on left side
                tooltip.style.left = `${e.clientX - tooltip.offsetWidth - 10}px`;
            } else {
                // Show on right side
                tooltip.style.left = `${e.clientX + 10}px`;
            }
            
            tooltip.style.top = `${e.clientY - 30}px`;
            tooltip.style.opacity = '1';
            canvas.style.cursor = 'pointer';
        } else {
            tooltip.style.opacity = '0';
            canvas.style.cursor = 'default';
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        canvas.style.cursor = 'default';
    });
}
