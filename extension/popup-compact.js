// Popup Compact JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadQuickStats();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('openDashboardBtn').addEventListener('click', openDashboard);
    document.getElementById('quickStatsBtn').addEventListener('click', openQuickStats);
}

async function loadQuickStats() {
    const data = await chrome.storage.local.get(['stats']);
    const stats = data.stats || {
        totalBattles: 0,
        victories: 0,
        defeats: 0,
        moneySaved: 0,
        savingsHistory: [],
        recentBattles: []
    };

    // Update stats display
    document.getElementById('totalSaved').textContent = `$${stats.moneySaved.toFixed(0)}`;
    
    const winRate = stats.totalBattles > 0 ? ((stats.victories / stats.totalBattles) * 100).toFixed(0) : 0;
    document.getElementById('winRate').textContent = `${winRate}%`;
    
    document.getElementById('totalBattles').textContent = stats.totalBattles;
    
    // Last battle
    if (stats.recentBattles && stats.recentBattles.length > 0) {
        const lastBattle = stats.recentBattles[stats.recentBattles.length - 1];
        document.getElementById('lastBattle').textContent = getTimeAgo(lastBattle.timestamp);
    }
    
    // Draw mini chart
    drawMiniChart(stats);
}

function drawMiniChart(stats) {
    const canvas = document.getElementById('miniChart');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const history = stats.savingsHistory || [];
    if (history.length < 2) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No data yet', width / 2, height / 2);
        return;
    }
    
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxValue = Math.max(...history, 10);
    const minValue = 0;
    
    // Draw line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    history.forEach((value, index) => {
        const x = padding.left + (chartWidth / (history.length - 1)) * index;
        const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
        
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Draw area under line
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#10b981';
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // Draw points
    ctx.fillStyle = '#059669';
    history.slice(-10).forEach((value, index) => {
        const actualIndex = history.length - 10 + index;
        if (actualIndex < 0) return;
        const x = padding.left + (chartWidth / (history.length - 1)) * actualIndex;
        const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function openDashboard() {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
}

function openQuickStats() {
    // If you have a stats.html on this branch, uncomment:
    // chrome.tabs.create({ url: chrome.runtime.getURL('stats.html') });
    
    // For now, just open dashboard
    openDashboard();
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
