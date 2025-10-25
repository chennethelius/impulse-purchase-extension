// Tableau-Style Dashboard JavaScript with Enhanced Interactivity
let particlesEnabled = true;
let chartAnimationSpeed = 1;

document.addEventListener('DOMContentLoaded', function() {
    initializeParticleBackground();
    loadDashboard();
    setupEventListeners();
    setupInteractiveEffects();
    startLiveUpdates();
});

function setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', () => {
        showRefreshAnimation();
        loadDashboard();
    });
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('downloadBtn').addEventListener('click', () => {
        createDownloadRipple(event);
        exportData();
    });
    document.getElementById('closeBtn').addEventListener('click', () => window.close());
    
    // Filter listeners with animation
    document.getElementById('timePeriodFilter').addEventListener('change', () => {
        showFilterAnimation();
        loadDashboard();
    });
    document.getElementById('categoryFilter').addEventListener('change', () => {
        showFilterAnimation();
        loadDashboard();
    });
}

function showRefreshAnimation() {
    const btn = document.getElementById('refreshBtn');
    btn.style.transform = 'rotate(360deg)';
    btn.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    setTimeout(() => {
        btn.style.transform = 'rotate(0deg)';
    }, 600);
}

function showFilterAnimation() {
    const cards = document.querySelectorAll('.viz-card');
    cards.forEach((card, index) => {
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = `cardSlideIn 0.6s ease-out backwards ${index * 0.1}s`;
        }, 10);
    });
}

function createDownloadRipple(event) {
    const btn = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(102, 126, 234, 0.5)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s ease-out';
    
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

async function loadDashboard() {
    const data = await chrome.storage.local.get(['stats']);
    const stats = data.stats || {
        totalBattles: 0,
        victories: 0,
        defeats: 0,
        moneySaved: 0,
        savingsHistory: [],
        recentBattles: [],
        installDate: Date.now()
    };

    // Update current year
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    updateSpendingTrends(stats);
    drawBattlesFunnel(stats);
    displayCategoryList(stats);
    drawSpendingPatterns(stats);
    displayRecentActivity(stats);
    drawDecisionTimeAnalysis(stats);
}

function updateSpendingTrends(stats) {
    // Update metrics with count-up animation
    animateValue('totalSaved', 0, stats.moneySaved, 1500, '$');
    
    const winRate = stats.totalBattles > 0 ? ((stats.victories / stats.totalBattles) * 100).toFixed(1) : 0;
    animateValue('winRate', 0, winRate, 1500, '', '%');
    
    // Mock year-over-year changes
    const savingsChange = Math.random() * 10;
    document.getElementById('savingsChange').textContent = `↑ ${savingsChange.toFixed(1)}% vs. PY`;
    
    const winRateChange = (Math.random() * 20) - 10;
    const changeElem = document.getElementById('winRateChange');
    if (winRateChange >= 0) {
        changeElem.textContent = `↑ ${winRateChange.toFixed(1)}% vs. PY`;
        changeElem.className = 'metric-change positive';
    } else {
        changeElem.textContent = `↓ ${winRateChange.toFixed(1)}% vs. PY`;
        changeElem.className = 'metric-change negative';
    }
    
    // Draw trend chart with animation
    drawAnimatedTrendChart(stats);
}

function animateValue(elementId, start, end, duration, prefix = '', suffix = '') {
    const element = document.getElementById(elementId);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = prefix + current.toFixed(0) + suffix;
    }, 16);
}

function drawAnimatedTrendChart(stats) {
    const canvas = document.getElementById('spendingTrendChart');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const history = stats.savingsHistory || [];
    if (history.length < 2) {
        ctx.fillStyle = '#999';
        ctx.font = '13px Roboto';
        ctx.textAlign = 'center';
        ctx.fillText('No data yet. Start battling to see trends!', width / 2, height / 2);
        return;
    }
    
    const padding = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Draw grid with fade-in
    ctx.strokeStyle = '#e6eaed';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
    }
    
    // Y-axis labels
    const maxValue = Math.max(...history, 10);
    ctx.fillStyle = '#666';
    ctx.font = '11px Roboto';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = (maxValue / 5) * (5 - i);
        const y = padding.top + (chartHeight / 5) * i;
        ctx.fillText(`$${value.toFixed(0)}`, padding.left - 8, y + 4);
    }
    
    // X-axis
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(history.length / 6));
    for (let i = 0; i < history.length; i += step) {
        const x = padding.left + (chartWidth / (history.length - 1)) * i;
        ctx.fillText(i + 1, x, height - padding.bottom + 20);
    }
    
    // Axis labels
    ctx.fillStyle = '#333';
    ctx.font = '11px Roboto';
    ctx.fillText('Battles', width / 2, height - 5);
    
    // Animate line drawing
    let animationProgress = 0;
    const animationDuration = 1000;
    const startTime = Date.now();
    
    function drawFrame() {
        const elapsed = Date.now() - startTime;
        animationProgress = Math.min(elapsed / animationDuration, 1);
        
        const pointsToDraw = Math.floor(history.length * animationProgress);
        
        // Clear previous frame (keep grid and labels)
        ctx.clearRect(padding.left, padding.top, chartWidth, chartHeight);
        
        // Redraw grid
        ctx.strokeStyle = '#e6eaed';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }
        
        if (pointsToDraw < 2) {
            if (animationProgress < 1) requestAnimationFrame(drawFrame);
            return;
        }
        
        // Draw line with gradient
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        for (let i = 0; i < pointsToDraw; i++) {
            const x = padding.left + (chartWidth / (history.length - 1)) * i;
            const y = padding.top + chartHeight - (history[i] / maxValue) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Draw points with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#667eea';
        ctx.fillStyle = '#4a5f8a';
        
        for (let i = 0; i < pointsToDraw; i++) {
            const x = padding.left + (chartWidth / (history.length - 1)) * i;
            const y = padding.top + chartHeight - (history[i] / maxValue) * chartHeight;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        
        if (animationProgress < 1) {
            requestAnimationFrame(drawFrame);
        }
    }
    
    drawFrame();
}

function drawBattlesFunnel(stats) {
    const canvas = document.getElementById('battlesFunnelChart');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Funnel stages
    const stages = [
        { label: 'Stage 1', sublabel: '100%', count: stats.totalBattles, color: '#e67e22' },
        { label: 'Stage 2', sublabel: '77.7%', count: Math.floor(stats.totalBattles * 0.777), color: '#f39c12' },
        { label: 'Stage 3', sublabel: '50.0%', count: Math.floor(stats.totalBattles * 0.5), color: '#ff8c42' }
    ];
    
    const padding = { top: 40, bottom: 60, left: 50, right: 50 };
    const funnelHeight = height - padding.top - padding.bottom;
    const funnelWidth = width - padding.left - padding.right;
    
    // Draw funnel segments
    stages.forEach((stage, index) => {
        const segmentHeight = funnelHeight / stages.length;
        const y = padding.top + segmentHeight * index;
        
        const topWidth = funnelWidth * (1 - index * 0.25);
        const bottomWidth = funnelWidth * (1 - (index + 1) * 0.25);
        
        const x1 = (width - topWidth) / 2;
        const x2 = (width + topWidth) / 2;
        const x3 = (width + bottomWidth) / 2;
        const x4 = (width - bottomWidth) / 2;
        
        // Draw trapezoid
        ctx.fillStyle = stage.color;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.lineTo(x3, y + segmentHeight);
        ctx.lineTo(x4, y + segmentHeight);
        ctx.closePath();
        ctx.fill();
        
        // Draw label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(stage.label, width / 2, y + segmentHeight / 2);
        ctx.font = '12px Roboto';
        ctx.fillText(stage.sublabel, width / 2, y + segmentHeight / 2 + 20);
    });
    
    // Draw rejected/lost sections
    ctx.fillStyle = '#95a5a6';
    ctx.font = '11px Roboto';
    ctx.textAlign = 'left';
    ctx.fillText('Rejected', padding.left - 40, padding.top + funnelHeight / 3);
    ctx.fillText('Lost', padding.left - 40, padding.top + funnelHeight * 2 / 3);
}

function displayCategoryList(stats) {
    const categories = [
        { name: 'Shopping', count: Math.floor(stats.totalBattles * 0.4) },
        { name: 'Electronics', count: Math.floor(stats.totalBattles * 0.25) },
        { name: 'Fashion', count: Math.floor(stats.totalBattles * 0.2) },
        { name: 'Food Delivery', count: Math.floor(stats.totalBattles * 0.1) },
        { name: 'Entertainment', count: Math.floor(stats.totalBattles * 0.05) }
    ];
    
    const maxCount = Math.max(...categories.map(c => c.count), 1);
    
    const container = document.getElementById('categoryList');
    container.innerHTML = categories.map((cat, index) => `
        <div class="category-item">
            <div class="category-rank">${index + 1}</div>
            <div class="category-name">${cat.name}</div>
            <div class="category-bar-container">
                <div class="category-bar" style="width: ${(cat.count / maxCount) * 100}%"></div>
            </div>
            <div class="category-value">${cat.count}</div>
        </div>
    `).join('');
}

function drawSpendingPatterns(stats) {
    // Time of Day donut chart
    drawDonutChart('timeOfDayChart', [
        { label: 'Morning', value: 20, color: '#667eea' },
        { label: 'Afternoon', value: 35, color: '#764ba2' },
        { label: 'Evening', value: 30, color: '#f093fb' },
        { label: 'Night', value: 15, color: '#4facfe' }
    ], 'TIME');
    
    // Day of Week donut chart
    drawDonutChart('dayOfWeekChart', [
        { label: 'Weekday', value: 60, color: '#667eea' },
        { label: 'Weekend', value: 40, color: '#764ba2' }
    ], 'DAY');
    
    // Amount bands bar chart
    const canvas = document.getElementById('amountBandsChart');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const bands = [
        { label: '<$18', value: 15 },
        { label: '$18-21', value: 25 },
        { label: '$22-30', value: 35 },
        { label: '$30+', value: 25 }
    ];
    
    const padding = { top: 20, bottom: 30, left: 40, right: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / bands.length - 10;
    
    bands.forEach((band, index) => {
        const x = padding.left + (chartWidth / bands.length) * index + 5;
        const barHeight = (band.value / 100) * chartHeight;
        const y = padding.top + chartHeight - barHeight;
        
        ctx.fillStyle = '#667eea';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Label
        ctx.fillStyle = '#666';
        ctx.font = '10px Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(band.label, x + barWidth / 2, height - 10);
    });
}

function drawDonutChart(canvasId, data, centerText) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const innerRadius = radius * 0.6;
    
    ctx.clearRect(0, 0, width, height);
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2;
    
    // Draw segments
    data.forEach(item => {
        const sliceAngle = (item.value / total) * Math.PI * 2;
        
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
    
    // Draw center text
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Roboto';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(centerText, centerX, centerY);
}

function displayRecentActivity(stats) {
    const recentBattles = (stats.recentBattles || []).slice(-10).reverse();
    const container = document.getElementById('activityTimeline');
    
    if (recentBattles.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">No recent activity</div>';
        return;
    }
    
    container.innerHTML = recentBattles.map(battle => `
        <div class="activity-item">
            <div class="activity-icon">${battle.result === 'victory' ? '✅' : '❌'}</div>
            <div class="activity-content">
                <div class="activity-title">${battle.result === 'victory' ? 'Battle Won' : 'Purchase Made'}</div>
                <div class="activity-details">Amount: $${battle.amount.toFixed(2)}</div>
                <div class="activity-time">${getTimeAgo(battle.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

function drawDecisionTimeAnalysis(stats) {
    const canvas = document.getElementById('decisionTimeChart');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Mock decision time data (in reality, track actual time spent in battles)
    const programs = [
        { name: 'Quick Decisions', median: 30, range: [20, 45] },
        { name: 'Moderate Decisions', median: 60, range: [45, 80] },
        { name: 'Careful Decisions', median: 90, range: [75, 120] },
        { name: 'Very Careful', median: 120, range: [100, 150] }
    ];
    
    const padding = { top: 30, bottom: 40, left: 150, right: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const rowHeight = chartHeight / programs.length;
    
    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '11px Roboto';
    ctx.textAlign = 'right';
    programs.forEach((prog, index) => {
        const y = padding.top + rowHeight * index + rowHeight / 2;
        ctx.fillText(prog.name, padding.left - 10, y + 4);
        
        // Draw median value
        ctx.textAlign = 'left';
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Roboto';
        ctx.fillText(prog.median + 's', padding.left + chartWidth + 10, y + 4);
    });
    
    // Draw box plots
    programs.forEach((prog, index) => {
        const y = padding.top + rowHeight * index + rowHeight / 2;
        const maxTime = 200;
        
        const rangeStart = padding.left + (prog.range[0] / maxTime) * chartWidth;
        const rangeEnd = padding.left + (prog.range[1] / maxTime) * chartWidth;
        const medianX = padding.left + (prog.median / maxTime) * chartWidth;
        
        // Draw range line
        ctx.strokeStyle = '#c1c9d0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rangeStart, y);
        ctx.lineTo(rangeEnd, y);
        ctx.stroke();
        
        // Draw box
        ctx.fillStyle = '#667eea';
        ctx.fillRect(rangeStart, y - 8, rangeEnd - rangeStart, 16);
        
        // Draw median line
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(medianX, y - 8);
        ctx.lineTo(medianX, y + 8);
        ctx.stroke();
    });
    
    // Draw scale
    ctx.fillStyle = '#666';
    ctx.font = '10px Roboto';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 200; i += 50) {
        const x = padding.left + (i / 200) * chartWidth;
        ctx.fillText(i, x, height - 10);
    }
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

function exportData() {
    chrome.storage.local.get(['stats'], (data) => {
        const stats = data.stats || {};
        const dataStr = JSON.stringify(stats, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `impulse-analytics-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        // Show success notification
        showNotification('Data exported successfully! 📊', 'success');
    });
}

// Particle Background Animation
function initializeParticleBackground() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    canvas.style.opacity = '0.3';
    document.body.prepend(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 50;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.color = `rgba(102, 126, 234, ${Math.random() * 0.5})`;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Draw connections
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.strokeStyle = `rgba(102, 126, 234, ${0.2 * (1 - distance / 100)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Interactive Effects
function setupInteractiveEffects() {
    // Add hover effects to viz cards
    const vizCards = document.querySelectorAll('.viz-card');
    vizCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.zIndex = '10';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.zIndex = '1';
        });
        
        // Add tilt effect
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
        });
    });
    
    // Add click ripple effect to all buttons
    const buttons = document.querySelectorAll('button, .nav-item, .filter-select');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple-effect');
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// Live Updates Simulation
function startLiveUpdates() {
    // Simulate real-time data updates every 30 seconds
    setInterval(() => {
        const updateIndicator = document.createElement('div');
        updateIndicator.textContent = '● Live';
        updateIndicator.style.position = 'fixed';
        updateIndicator.style.top = '20px';
        updateIndicator.style.right = '20px';
        updateIndicator.style.background = 'rgba(16, 185, 129, 0.9)';
        updateIndicator.style.color = 'white';
        updateIndicator.style.padding = '8px 16px';
        updateIndicator.style.borderRadius = '20px';
        updateIndicator.style.fontSize = '12px';
        updateIndicator.style.fontWeight = '500';
        updateIndicator.style.zIndex = '1000';
        updateIndicator.style.animation = 'fadeInOut 2s ease-in-out';
        
        document.body.appendChild(updateIndicator);
        setTimeout(() => updateIndicator.remove(), 2000);
    }, 30000);
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '16px 24px';
    notification.style.borderRadius = '8px';
    notification.style.fontSize = '14px';
    notification.style.fontWeight = '500';
    notification.style.zIndex = '1000';
    notification.style.animation = 'slideInUp 0.3s ease-out';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        notification.style.color = 'white';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        notification.style.color = 'white';
    } else {
        notification.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        notification.style.color = 'white';
    }
    
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutDown 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
