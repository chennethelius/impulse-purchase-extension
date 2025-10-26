// Modern Dashboard Script
let spendingTrendChart = null;
let battlesFunnelChart = null;
let timeOfDayChart = null;
let dayOfWeekChart = null;
let amountBandsChart = null;
let decisionTimeChart = null;

// Load data when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupEventListeners();
    
    // Auto-refresh every 30 seconds
    setInterval(loadDashboardData, 30000);
});

function initializeDashboard() {
    // Set current year
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Load data
    loadDashboardData();
}

function setupEventListeners() {
    // Header button listeners
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        loadDashboardData();
        showNotification('Data refreshed successfully');
    });
    
    document.getElementById('exportBtn')?.addEventListener('click', exportData);
    document.getElementById('closeBtn')?.addEventListener('click', () => window.close());
    
    // Navigation listeners
    document.getElementById('overviewNav')?.addEventListener('click', () => {
        // Already on overview
    });
    
    document.getElementById('detailedNav')?.addEventListener('click', () => {
        // Switch to detailed view (future implementation)
    });
    
    // Filter listeners
    document.getElementById('timePeriodFilter')?.addEventListener('change', (e) => {
        applyFilters();
    });
    
    document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
        applyFilters();
    });
    
    // Download button
    document.getElementById('downloadBtn')?.addEventListener('click', exportData);
}

async function loadDashboardData() {
    try {
        // Load from Chrome storage
        chrome.storage.local.get(['stats'], (result) => {
            const stats = result.stats || {
                totalBattles: 0,
                victories: 0,
                defeats: 0,
                moneySaved: 0,
                savingsHistory: [],
                recentBattles: []
            };
            
            // Calculate metrics
            const metrics = calculateMetrics(stats);
            
            // Update all visualizations
            updateKeyMetrics(metrics);
            updateSpendingTrendChart(stats.savingsHistory || []);
            updateBattlesFunnelChart(stats);
            updateCategoryList(stats.recentBattles || []);
            updateDemographics(stats.recentBattles || []);
            updateActivityTimeline(stats.recentBattles || []);
            updateDecisionTimeChart(stats.recentBattles || []);
        });
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

function calculateMetrics(stats) {
    const metrics = {
        totalSaved: stats.moneySaved || 0,
        winRate: stats.totalBattles > 0 ? ((stats.defeats / stats.totalBattles) * 100).toFixed(1) : 0,
        savingsChange: '+5.2', // Placeholder - calculate from historical data
        winRateChange: '-14.7', // Placeholder
        totalBattles: stats.totalBattles || 0,
        victories: stats.victories || 0,
        defeats: stats.defeats || 0,
        avgBattle: stats.defeats > 0 ? (stats.moneySaved / stats.defeats) : 0
    };
    
    return metrics;
}

function updateKeyMetrics(metrics) {
    // Update top metrics
    document.getElementById('totalSaved').textContent = `$${metrics.totalSaved.toFixed(2)}`;
    document.getElementById('savingsChange').textContent = `↑ ${metrics.savingsChange}% vs. PY`;
    document.getElementById('winRate').textContent = `${metrics.winRate}%`;
    document.getElementById('winRateChange').textContent = `↓ ${metrics.winRateChange}% vs. PY`;
}

function updateSpendingTrendChart(savingsHistory) {
    const ctx = document.getElementById('spendingTrendChart')?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart
    if (spendingTrendChart) {
        spendingTrendChart.destroy();
    }
    
    // Prepare data
    const labels = savingsHistory.map((_, i) => `Battle ${i + 1}`);
    const data = savingsHistory.length > 0 ? savingsHistory : [0];
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.5)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.05)');
    
    spendingTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cumulative Savings',
                data: data,
                borderColor: '#06b6d4',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: '#06b6d4',
                pointBorderColor: '#0f172a',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(148, 163, 184, 0.2)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `Saved: $${context.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 11 },
                        callback: (value) => '$' + value
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 10 },
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10
                    }
                }
            }
        }
    });
}

function updateBattlesFunnelChart(stats) {
    const ctx = document.getElementById('battlesFunnelChart')?.getContext('2d');
    if (!ctx) return;
    
    if (battlesFunnelChart) {
        battlesFunnelChart.destroy();
    }
    
    const stages = [
        { label: 'Total Attempts', value: stats.totalBattles || 0, color: '#06b6d4' },
        { label: 'Resisted', value: stats.defeats || 0, color: '#10b981' },
        { label: 'Purchased', value: stats.victories || 0, color: '#ef4444' }
    ];
    
    battlesFunnelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stages.map(s => s.label),
            datasets: [{
                data: stages.map(s => s.value),
                backgroundColor: stages.map(s => s.color),
                borderRadius: 8,
                barThickness: 50
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(148, 163, 184, 0.2)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 11 }
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        color: '#f1f5f9',
                        font: { size: 12, weight: '600' }
                    }
                }
            }
        }
    });
}

function updateCategoryList(recentBattles) {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;
    
    // Categorize purchases
    const categories = {};
    const categoryIcons = {
        'Electronics': '💻',
        'Fashion': '👕',
        'Food': '🍔',
        'Entertainment': '🎮',
        'Home': '🏠',
        'Beauty': '💄',
        'Fitness': '💪',
        'Other': '📦'
    };
    
    recentBattles.forEach(battle => {
        const category = categorizeItem(battle.description || battle.item || 'Other');
        if (!categories[category]) {
            categories[category] = { total: 0, amount: 0 };
        }
        categories[category].total++;
        categories[category].amount += battle.amount || 0;
    });
    
    // Sort by total
    const sorted = Object.entries(categories).sort((a, b) => b[1].total - a[1].total);
    const maxTotal = sorted[0]?.[1].total || 1;
    
    categoryList.innerHTML = sorted.slice(0, 6).map(([name, data]) => {
        const percentage = (data.total / maxTotal) * 100;
        return `
            <div class="category-item">
                <div class="category-icon">${categoryIcons[name] || '📦'}</div>
                <div class="category-info">
                    <div class="category-name">${name}</div>
                    <div class="category-bar">
                        <div class="category-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="category-value">$${data.amount.toFixed(0)}</div>
            </div>
        `;
    }).join('');
}

function categorizeItem(description) {
    const desc = description.toLowerCase();
    if (desc.includes('phone') || desc.includes('laptop') || desc.includes('computer') || desc.includes('tech')) return 'Electronics';
    if (desc.includes('shirt') || desc.includes('shoes') || desc.includes('clothes') || desc.includes('fashion')) return 'Fashion';
    if (desc.includes('food') || desc.includes('restaurant') || desc.includes('meal')) return 'Food';
    if (desc.includes('game') || desc.includes('movie') || desc.includes('entertainment')) return 'Entertainment';
    if (desc.includes('home') || desc.includes('furniture') || desc.includes('decor')) return 'Home';
    if (desc.includes('beauty') || desc.includes('makeup') || desc.includes('cosmetic')) return 'Beauty';
    if (desc.includes('fitness') || desc.includes('gym') || desc.includes('workout')) return 'Fitness';
    return 'Other';
}

function updateDemographics(recentBattles) {
    // Time of day chart
    const timeCtx = document.getElementById('timeOfDayChart')?.getContext('2d');
    if (timeCtx) {
        const timeData = [0, 0, 0, 0]; // Morning, Afternoon, Evening, Night
        
        recentBattles.forEach(battle => {
            const hour = new Date(battle.timestamp).getHours();
            if (hour >= 6 && hour < 12) timeData[0]++;
            else if (hour >= 12 && hour < 18) timeData[1]++;
            else if (hour >= 18 && hour < 22) timeData[2]++;
            else timeData[3]++;
        });
        
        if (timeOfDayChart) timeOfDayChart.destroy();
        
        timeOfDayChart = new Chart(timeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Morning', 'Afternoon', 'Evening', 'Night'],
                datasets: [{
                    data: timeData,
                    backgroundColor: ['#06b6d4', '#0284c7', '#0369a1', '#075985'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cbd5e1',
                            font: { size: 10 },
                            padding: 10
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1'
                    }
                }
            }
        });
    }
    
    // Day of week chart
    const dayCtx = document.getElementById('dayOfWeekChart')?.getContext('2d');
    if (dayCtx) {
        const dayData = [0, 0, 0, 0, 0, 0, 0];
        
        recentBattles.forEach(battle => {
            const day = new Date(battle.timestamp).getDay();
            dayData[day]++;
        });
        
        if (dayOfWeekChart) dayOfWeekChart.destroy();
        
        dayOfWeekChart = new Chart(dayCtx, {
            type: 'doughnut',
            data: {
                labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                datasets: [{
                    data: dayData,
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cbd5e1',
                            font: { size: 10 },
                            padding: 10
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1'
                    }
                }
            }
        });
    }
    
    // Amount bands chart
    const amountCtx = document.getElementById('amountBandsChart')?.getContext('2d');
    if (amountCtx) {
        const bands = { '0-25': 0, '25-50': 0, '50-100': 0, '100-250': 0, '250+': 0 };
        
        recentBattles.forEach(battle => {
            const amt = battle.amount || 0;
            if (amt < 25) bands['0-25']++;
            else if (amt < 50) bands['25-50']++;
            else if (amt < 100) bands['50-100']++;
            else if (amt < 250) bands['100-250']++;
            else bands['250+']++;
        });
        
        if (amountBandsChart) amountBandsChart.destroy();
        
        amountBandsChart = new Chart(amountCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(bands),
                datasets: [{
                    data: Object.values(bands),
                    backgroundColor: '#06b6d4',
                    borderRadius: 6,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 10 }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#cbd5e1',
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }
}

function updateActivityTimeline(recentBattles) {
    const timeline = document.getElementById('activityTimeline');
    if (!timeline) return;
    
    const recent = recentBattles.slice(-10).reverse();
    
    if (recent.length === 0) {
        timeline.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">📊</div>
                <div class="no-data-title">No Activity Yet</div>
                <div class="no-data-text">Your purchase battles will appear here</div>
            </div>
        `;
        return;
    }
    
    timeline.innerHTML = recent.map(battle => {
        const isWin = battle.result === 'defeat';
        const icon = isWin ? '🛡️' : '🛍️';
        const title = isWin ? 'Purchase Resisted' : 'Purchase Made';
        const amount = `$${(battle.amount || 0).toFixed(2)}`;
        const timeAgo = formatTimeAgo(battle.timestamp);
        const description = battle.description || battle.item || 'Unknown item';
        
        return `
            <div class="timeline-item">
                <div class="timeline-icon">${icon}</div>
                <div class="timeline-info">
                    <div class="timeline-title">${title}</div>
                    <div class="timeline-desc">${description} • ${timeAgo}</div>
                </div>
                <div class="timeline-amount">${amount}</div>
            </div>
        `;
    }).join('');
}

function updateDecisionTimeChart(recentBattles) {
    const ctx = document.getElementById('decisionTimeChart')?.getContext('2d');
    if (!ctx) return;
    
    // Simulate decision time data (in future, track actual decision times)
    const decisionTimes = recentBattles.map(() => Math.floor(Math.random() * 60) + 5);
    
    if (decisionTimeChart) decisionTimeChart.destroy();
    
    decisionTimeChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Decision Time (seconds)',
                data: decisionTimes.map((time, i) => ({ x: i + 1, y: time })),
                backgroundColor: '#06b6d4',
                borderColor: '#0284c7',
                borderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: (context) => `${context.parsed.y} seconds`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Time (seconds)',
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 11 }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Purchase Attempt',
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

function applyFilters() {
    // Reload data with filters applied
    loadDashboardData();
}

function exportData() {
    chrome.storage.local.get(['stats'], (result) => {
        const stats = result.stats || {};
        const dataStr = JSON.stringify(stats, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `impulse-guard-data-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showNotification('Data exported successfully');
    });
}

function showNotification(message) {
    // Simple notification (can be enhanced with toast)
    console.log(message);
}

function showError(message) {
    console.error(message);
}

function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}
