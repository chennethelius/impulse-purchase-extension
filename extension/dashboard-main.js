// Dashboard Main Script - Self-contained extension version
let savingsChart = null;
let categoryChart = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
    setupNavigation();
    setupBackButton();
    
    // Auto-refresh every 30 seconds
    setInterval(loadDashboardData, 30000);
});

async function loadDashboardData() {
    try {
        const result = await chrome.storage.local.get('stats');
        const stats = result.stats || {
            totalBattles: 0,
            victories: 0,
            defeats: 0,
            moneySaved: 0,
            savingsHistory: [],
            purchaseHistory: [],
            categoryStats: {}
        };
        
        updateDashboardStats(stats);
        updateCharts(stats);
        updateRecentActivity(stats);
        updateInsights(stats);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardStats(stats) {
    // Update stat cards
    document.getElementById('dash-total').textContent = stats.totalBattles || 0;
    document.getElementById('dash-blocked').textContent = stats.victories || 0;
    document.getElementById('dash-allowed').textContent = stats.defeats || 0;
    document.getElementById('dash-saved').textContent = `$${Math.round(stats.moneySaved || 0)}`;
}

function updateCharts(stats) {
    updateSavingsChart(stats.savingsHistory || []);
    updateCategoryChart(stats.categoryStats || {});
}

function updateSavingsChart(savingsHistory) {
    const ctx = document.getElementById('savingsChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (savingsChart) {
        savingsChart.destroy();
    }
    
    // Prepare data
    const labels = savingsHistory.map((_, index) => `Purchase ${index + 1}`);
    const data = savingsHistory;
    
    savingsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cumulative Savings',
                data: data,
                borderColor: '#5FBDBD',
                backgroundColor: 'rgba(95, 189, 189, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#5FBDBD',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#5FBDBD',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Saved: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#64748b',
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#64748b',
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10
                    }
                }
            }
        }
    });
}

function updateCategoryChart(categoryStats) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const categories = Object.keys(categoryStats);
    const values = Object.values(categoryStats);
    
    if (categories.length === 0) {
        // Show no data message
        ctx.parentElement.innerHTML = '<div class="text-center text-gray-500 py-12">No category data yet</div>';
        return;
    }
    
    const colors = [
        '#5FBDBD',
        '#E5A88C',
        '#F5E6D3',
        '#E16B5A',
        '#06b6d4'
    ];
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, categories.length),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#64748b',
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#5FBDBD',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${value} blocked`;
                        }
                    }
                }
            }
        }
    });
}

function updateRecentActivity(stats) {
    const activityContainer = document.getElementById('recentActivity');
    if (!activityContainer) return;
    
    const history = stats.purchaseHistory || [];
    
    if (history.length === 0) {
        activityContainer.innerHTML = '<div class="text-center text-gray-500 py-8">No recent activity</div>';
        return;
    }
    
    // Sort by date (most recent first) and take last 10
    const recentHistory = [...history]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
    
    activityContainer.innerHTML = recentHistory.map(item => {
        const date = new Date(item.timestamp);
        const formattedDate = formatDate(date);
        const statusClass = item.saved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
        const statusIcon = item.saved ? '✓' : '✗';
        const statusText = item.saved ? 'Blocked' : 'Allowed';
        const statusColor = item.saved ? 'text-green-600' : 'text-red-600';
        
        return `
            <div class="flex items-center justify-between p-4 ${statusClass} border rounded-lg">
                <div class="flex items-center gap-3">
                    <span class="${statusColor} text-xl font-bold">${statusIcon}</span>
                    <div>
                        <div class="font-semibold text-gray-800">${item.category || 'General'}</div>
                        <div class="text-sm text-gray-600">${formattedDate}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-gray-800">$${item.amount.toFixed(2)}</div>
                    <div class="text-xs ${statusColor}">${statusText}</div>
                </div>
            </div>
        `;
    }).join('');
}

function updateInsights(stats) {
    const insightsContainer = document.getElementById('insights-content');
    if (!insightsContainer) return;
    
    const totalAttempts = stats.totalBattles || 0;
    const blocked = stats.victories || 0;
    const allowed = stats.defeats || 0;
    const saved = stats.moneySaved || 0;
    const blockRate = totalAttempts > 0 ? ((blocked / totalAttempts) * 100).toFixed(1) : 0;
    
    const insights = [];
    
    // Block rate insight
    if (blockRate >= 70) {
        insights.push({
            icon: '🎯',
            title: 'Excellent Self-Control',
            description: `You're blocking ${blockRate}% of impulse purchases! Keep up the great work.`,
            color: 'green'
        });
    } else if (blockRate >= 50) {
        insights.push({
            icon: '💪',
            title: 'Good Progress',
            description: `You're blocking ${blockRate}% of purchases. Try to improve this rate.`,
            color: 'blue'
        });
    } else if (totalAttempts > 0) {
        insights.push({
            icon: '⚠️',
            title: 'Room for Improvement',
            description: `Only ${blockRate}% of purchases are blocked. Consider being more mindful.`,
            color: 'yellow'
        });
    }
    
    // Savings insight
    if (saved > 500) {
        insights.push({
            icon: '💰',
            title: 'Major Savings',
            description: `You've saved $${Math.round(saved)}! That's significant money back in your pocket.`,
            color: 'green'
        });
    } else if (saved > 100) {
        insights.push({
            icon: '💵',
            title: 'Building Savings',
            description: `You've saved $${Math.round(saved)} so far. Every dollar counts!`,
            color: 'blue'
        });
    }
    
    // Category insight
    const categoryStats = stats.categoryStats || {};
    const topCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
        insights.push({
            icon: '📊',
            title: 'Top Category',
            description: `${topCategory[0]} is your most blocked category with ${topCategory[1]} attempts.`,
            color: 'purple'
        });
    }
    
    if (insights.length === 0) {
        insightsContainer.innerHTML = '<div class="text-center text-gray-500 py-12">Start using the extension to see insights</div>';
        return;
    }
    
    insightsContainer.innerHTML = insights.map(insight => {
        const colorClasses = {
            green: 'bg-green-50 border-green-200',
            blue: 'bg-blue-50 border-blue-200',
            yellow: 'bg-yellow-50 border-yellow-200',
            purple: 'bg-purple-50 border-purple-200'
        };
        
        return `
            <div class="p-6 ${colorClasses[insight.color]} border rounded-xl">
                <div class="flex items-start gap-4">
                    <span class="text-4xl">${insight.icon}</span>
                    <div>
                        <h3 class="text-lg font-bold text-gray-800 mb-2">${insight.title}</h3>
                        <p class="text-gray-600">${insight.description}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabs = document.querySelectorAll('.tab-content');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.dataset.tab;
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show corresponding tab
            tabs.forEach(tab => {
                if (tab.id === `${tabName}-tab`) {
                    tab.classList.remove('hidden');
                } else {
                    tab.classList.add('hidden');
                }
            });
        });
    });
}

function setupBackButton() {
    const backButton = document.getElementById('backToStats');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.close();
        });
    }
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
