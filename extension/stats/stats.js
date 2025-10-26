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
                    savingsHistory: [],
                    recentBattles: []
                }
            });
            await loadStats();
        }
    });
    
    // Setup hover tooltips for graph
    setupGraphTooltips();
    setupRadarTooltips();
});

async function loadStats() {
    const result = await chrome.storage.local.get('stats');
    const stats = result.stats || {
        totalBattles: 0,
        victories: 0,
        defeats: 0,
        moneySaved: 0,
        savingsHistory: [],
        purchaseHistory: [],
        categoryStats: {
            Fitness: 0,
            Electronics: 0,
            Clothing: 0,
            Home: 0,
            Health: 0
        }
    };
    
    // Update display
    document.getElementById('totalBattles').textContent = stats.totalBattles;
    document.getElementById('victories').textContent = stats.victories;
    document.getElementById('defeats').textContent = stats.defeats;
    document.getElementById('moneySaved').textContent = `$${Math.round(stats.moneySaved)}`;
    
    // Calculate block rate (victories = blocked purchases)
    const winRate = stats.totalBattles > 0 
        ? ((stats.victories / stats.totalBattles) * 100).toFixed(1)
        : 0;
    document.getElementById('winRate').textContent = `${winRate}%`;
    
    // Draw savings graph
    drawSavingsGraph(stats.savingsHistory || []);
    
    // Draw category radar chart
    drawCategoryRadar(stats.categoryStats || {});
    
    // Display purchase history
    displayPurchaseHistory(stats.purchaseHistory || []);
}

function drawSavingsGraph(history) {
    const canvas = document.getElementById('savingsGraph');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Enable better text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Clear canvas with transparency
    ctx.clearRect(0, 0, width, height);
    
    if (!history || history.length === 0) {
        // Show "NO DATA" message with better visibility
        ctx.fillStyle = '#64748b';
        ctx.font = '600 17px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No data yet', width / 2, height / 2);
        return;
    }
    
    // Graph settings with better padding
    const padding = { top: 20, right: 20, bottom: 30, left: 45 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...history, 10);
    const pointSpacing = history.length > 1 ? graphWidth / (history.length - 1) : 0;
    
    // Draw clean grid lines
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (graphHeight / 4) * i;
        const value = maxValue - (maxValue / 4) * i;
        
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        
        // Y-axis labels with clearer, bolder text
        ctx.fillStyle = '#475569';
        ctx.font = '600 15px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${value.toFixed(0)}`, padding.left - 8, y);
    }
    
    // Calculate points for smooth curve
    const points = [];
    history.forEach((value, index) => {
        const x = padding.left + (index * pointSpacing);
        const y = height - padding.bottom - ((value / maxValue) * graphHeight);
        points.push({ x, y, value, purchase: index + 1 });
    });
    
    // Draw gradient fill under the curve with transparency
    if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - padding.bottom);
        ctx.lineTo(points[0].x, points[0].y);
        
        // Smooth curve through points (Catmull-Rom spline)
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const midX = (current.x + next.x) / 2;
            const midY = (current.y + next.y) / 2;
            
            ctx.quadraticCurveTo(current.x, current.y, midX, midY);
        }
        
        // Complete the last segment
        const lastPoint = points[points.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(lastPoint.x, height - padding.bottom);
        ctx.closePath();
        
        // Apply gradient fill with transparency
        const fillGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        fillGradient.addColorStop(0, 'rgba(95, 189, 189, 0.28)');
        fillGradient.addColorStop(1, 'rgba(95, 189, 189, 0.04)');
        ctx.fillStyle = fillGradient;
        ctx.fill();
    }
    
    // Draw smooth line with professional styling
    ctx.strokeStyle = '#5FBDBD';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(95, 189, 189, 0.35)';
    ctx.shadowBlur = 6;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const midX = (current.x + next.x) / 2;
        const midY = (current.y + next.y) / 2;
        
        ctx.quadraticCurveTo(current.x, current.y, midX, midY);
    }
    
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Draw modern circular points with better visibility
    points.forEach(point => {
        // Outer glow
        ctx.fillStyle = 'rgba(95, 189, 189, 0.2)';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // White ring
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Main circle
        ctx.fillStyle = '#5FBDBD';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight for depth
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(point.x - 1, point.y - 1, 1.3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Store points for hover detection
    canvas.pointsData = points;
}

// Setup hover tooltips for graph
function setupGraphTooltips() {
    const canvas = document.getElementById('savingsGraph');
    const tooltip = document.createElement('div');
    tooltip.className = 'graph-tooltip';
    tooltip.style.cssText = `
        position: absolute;
        background: linear-gradient(135deg, #5FBDBD, #4AA9A9);
        color: #ffffff;
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 11px;
        font-family: 'Tahoma', 'Arial', sans-serif;
        font-weight: 600;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 1000;
        white-space: nowrap;
        border: 2px solid #5FBDBD;
        box-shadow: 0 4px 12px rgba(95, 189, 189, 0.4);
    `;
    document.body.appendChild(tooltip);
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
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
            // Format: "3 purchases: $150.00"
            const purchaseText = closestPoint.purchase === 1 ? '1 purchase' : `${closestPoint.purchase} purchases`;
            tooltip.textContent = `${purchaseText}: $${closestPoint.value.toFixed(2)}`;
            
            // Make tooltip visible first to get its dimensions
            tooltip.style.opacity = '1';
            
            // Get tooltip dimensions
            const tooltipWidth = tooltip.offsetWidth;
            const tooltipHeight = tooltip.offsetHeight;
            
            // Get window dimensions
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // Calculate positions - default to right and above
            let left = e.clientX + 10;
            let top = e.clientY - tooltipHeight - 10;
            
            // Adjust horizontal position if tooltip goes off right edge
            if (left + tooltipWidth > windowWidth - 10) {
                left = e.clientX - tooltipWidth - 10;
            }
            
            // Adjust horizontal position if tooltip goes off left edge
            if (left < 10) {
                left = 10;
            }
            
            // Adjust vertical position if tooltip goes off top edge
            if (top < 10) {
                top = e.clientY + 10;
            }
            
            // Adjust vertical position if tooltip goes off bottom edge
            if (top + tooltipHeight > windowHeight - 10) {
                top = e.clientY - tooltipHeight - 10;
            }
            
            // Position tooltip relative to actual mouse position (not scaled)
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
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

// Setup hover tooltips for radar chart
function setupRadarTooltips() {
    const canvas = document.getElementById('categoryRadar');
    const tooltip = document.createElement('div');
    tooltip.className = 'radar-tooltip';
    tooltip.style.cssText = `
        position: absolute;
        background: linear-gradient(135deg, #5FBDBD, #4AA9A9);
        color: #ffffff;
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 11px;
        font-family: 'Inter', 'Tahoma', sans-serif;
        font-weight: 600;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 1000;
        white-space: nowrap;
        border: 2px solid #5FBDBD;
        box-shadow: 0 4px 12px rgba(95, 189, 189, 0.4);
    `;
    document.body.appendChild(tooltip);
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        if (!canvas.radarPoints || canvas.radarPoints.length === 0) return;
        
        // Find closest point
        let closestPoint = null;
        let minDistance = Infinity;
        
        canvas.radarPoints.forEach(point => {
            const distance = Math.sqrt(
                Math.pow(mouseX - point.x, 2) + 
                Math.pow(mouseY - point.y, 2)
            );
            
            if (distance < 20 && distance < minDistance) {
                closestPoint = point;
                minDistance = distance;
            }
        });
        
        if (closestPoint) {
            // Format: "Fitness 💪: 5 blocked"
            const blockedText = closestPoint.value === 1 ? '1 blocked' : `${closestPoint.value} blocked`;
            tooltip.textContent = `${closestPoint.category} ${closestPoint.icon}: ${blockedText}`;
            
            // Make tooltip visible first to get its dimensions
            tooltip.style.opacity = '1';
            
            // Get tooltip dimensions
            const tooltipWidth = tooltip.offsetWidth;
            const tooltipHeight = tooltip.offsetHeight;
            
            // Get window dimensions
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // Calculate positions - default to right and above
            let left = e.clientX + 10;
            let top = e.clientY - tooltipHeight - 10;
            
            // Adjust horizontal position if tooltip goes off right edge
            if (left + tooltipWidth > windowWidth - 10) {
                left = e.clientX - tooltipWidth - 10;
            }
            
            // Adjust horizontal position if tooltip goes off left edge
            if (left < 10) {
                left = 10;
            }
            
            // Adjust vertical position if tooltip goes off top edge
            if (top < 10) {
                top = e.clientY + 10;
            }
            
            // Adjust vertical position if tooltip goes off bottom edge
            if (top + tooltipHeight > windowHeight - 10) {
                top = e.clientY - tooltipHeight - 10;
            }
            
            // Position tooltip relative to actual mouse position (not scaled)
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
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

// Draw radar chart for product categories
function drawCategoryRadar(categoryStats) {
    const canvas = document.getElementById('categoryRadar');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas with transparency
    ctx.clearRect(0, 0, width, height);
    
    // Enable better text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Categories in order for pentagon
    const categories = ['Fitness', 'Electronics', 'Clothing', 'Home', 'Health'];
    const categoryIcons = ['💪', '📱', '👕', '🏠', '💊'];
    const values = categories.map(cat => categoryStats[cat] || 0);
    const maxValue = Math.max(...values, 5); // At least 5 for scale
    
    // Center and radius
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 35;
    
    // Draw clean background grid (5 levels)
    for (let level = 1; level <= 5; level++) {
        const opacity = level % 2 === 0 ? 0.6 : 0.3;
        ctx.strokeStyle = `rgba(226, 232, 240, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const levelRadius = (radius / 5) * level;
        
        for (let i = 0; i <= 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const x = centerX + Math.cos(angle) * levelRadius;
            const y = centerY + Math.sin(angle) * levelRadius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
    }
    
    // Draw axes with better styling
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Draw labels with icons - clearer, bolder text
        const labelRadius = radius + 18;
        const labelX = centerX + Math.cos(angle) * labelRadius;
        const labelY = centerY + Math.sin(angle) * labelRadius;
        
        // Icon with better sizing
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(categoryIcons[i], labelX, labelY - 12);
        
        // Text label - bolder and clearer
        ctx.fillStyle = '#475569';
        ctx.font = '700 15px Inter, sans-serif';
        ctx.fillText(categories[i], labelX, labelY + 12);
    }
    
    // Draw data polygon with modern styling
    if (Math.max(...values) > 0) {
        ctx.beginPath();
        
        for (let i = 0; i <= 5; i++) {
            const index = i % 5;
            const value = values[index];
            const normalizedValue = (value / maxValue) * radius;
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const x = centerX + Math.cos(angle) * normalizedValue;
            const y = centerY + Math.sin(angle) * normalizedValue;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        
        // Gradient fill with transparency
        const dataGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        dataGradient.addColorStop(0, 'rgba(95, 189, 189, 0.4)');
        dataGradient.addColorStop(1, 'rgba(95, 189, 189, 0.1)');
        ctx.fillStyle = dataGradient;
        ctx.fill();
        
        // Stroke with glow effect
        ctx.strokeStyle = '#5FBDBD';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(95, 189, 189, 0.4)';
        ctx.shadowBlur = 6;
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // Draw professional points with value labels and store for tooltips
        const radarPoints = [];
        for (let i = 0; i < 5; i++) {
            const value = values[i];
            if (value > 0) {
                const normalizedValue = (value / maxValue) * radius;
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const x = centerX + Math.cos(angle) * normalizedValue;
                const y = centerY + Math.sin(angle) * normalizedValue;
                
                // Store point data for tooltips
                radarPoints.push({ x, y, value, category: categories[i], icon: categoryIcons[i] });
                
                // Outer glow
                ctx.fillStyle = 'rgba(95, 189, 189, 0.25)';
                ctx.beginPath();
                ctx.arc(x, y, 7, 0, Math.PI * 2);
                ctx.fill();
                
                // White ring
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, 5.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Main point
                ctx.fillStyle = '#5FBDBD';
                ctx.beginPath();
                ctx.arc(x, y, 4.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Inner highlight
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x - 1.2, y - 1.2, 1.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Value label - clearer text with better contrast
                ctx.fillStyle = '#1e293b';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 5;
                ctx.font = '700 17px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Add white outline for better visibility
                ctx.strokeText(value.toString(), x, y);
                ctx.fillText(value.toString(), x, y);
            }
        }
        
        // Store points for hover detection
        canvas.radarPoints = radarPoints;
    } else {
        // No data message - clearer text
        ctx.fillStyle = '#64748b';
        ctx.font = '600 17px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No categories yet', centerX, centerY);
    }
    
    // Draw center point with better styling
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
    ctx.fill();
}

// Display purchase history
function displayPurchaseHistory(history) {
    const historyList = document.getElementById('historyList');
    const historyCount = document.getElementById('historyCount');
    
    // Update count
    const count = history.length;
    historyCount.textContent = count === 1 ? '1 attempt' : `${count} attempts`;
    
    // Clear existing content
    historyList.innerHTML = '';
    
    if (!history || history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No purchase attempts yet</div>';
        return;
    }
    
    // Sort by date (most recent first)
    const sortedHistory = [...history].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // Display each history item (limit to last 10)
    sortedHistory.slice(0, 10).forEach(item => {
        const historyItem = createHistoryItem(item);
        historyList.appendChild(historyItem);
    });
}

function createHistoryItem(item) {
    const div = document.createElement('div');
    div.className = `history-item ${item.saved ? 'saved' : 'not-saved'}`;
    
    const date = new Date(item.timestamp);
    const formattedDate = formatDate(date);
    const categoryIcon = getCategoryIcon(item.category);
    
    div.innerHTML = `
        <div class="history-item-header">
            <span class="history-status ${item.saved ? 'saved' : 'not-saved'}">
                ${item.saved ? '✓ Money Saved' : '✗ Purchased'}
            </span>
            <span class="history-amount">$${item.amount.toFixed(2)}</span>
        </div>
        <div class="history-details">
            <span class="history-category">${categoryIcon} ${item.category || 'General'}</span>
            <span class="history-date">${formattedDate}</span>
        </div>
    `;
    
    return div;
}

function getCategoryIcon(category) {
    const icons = {
        'Fitness': '💪',
        'Electronics': '📱',
        'Clothing': '👕',
        'Home': '🏠',
        'Health': '💊',
        'General': '🛒'
    };
    return icons[category] || '🛒';
}

function formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
}
