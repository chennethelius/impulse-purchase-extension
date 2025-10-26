// Main dashboard script
let savingsChart = null;

// Load data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    
    // Refresh button
    document.getElementById('refreshButton').addEventListener('click', () => {
        loadDashboardData();
    });
    
    // Auto-refresh every 30 seconds
    setInterval(loadDashboardData, 30000);
});

async function loadDashboardData() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        updateStatsDisplay(stats);
        updateSavingsChart(stats.savingsHistory || []);
        updateRecentBattles(stats.recentBattles || []);
        
        // Load Plotly radar chart
        loadRadarChart();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadRadarChart() {
    try {
        const response = await fetch('/api/category-chart');
        const chartData = await response.json();
        
        // Parse the Plotly JSON
        const figure = JSON.parse(chartData);
        
        // Render the chart with centered config
        Plotly.newPlot('radarChart', figure.data, figure.layout, {
            responsive: true,
            displayModeBar: false,
            staticPlot: false
        });
        
        // Ensure chart is centered after render
        window.addEventListener('resize', () => {
            Plotly.Plots.resize('radarChart');
        });
        
    } catch (error) {
        console.error('Error loading radar chart:', error);
        document.getElementById('radarChart').innerHTML = 
            '<div class="no-data">No category data available yet.</div>';
    }
}

function calculateAdvancedMetrics(stats) {
    const metrics = {};
    
    // Current Streak: consecutive defeats (saves) from end of recentBattles
    metrics.currentStreak = 0;
    if (stats.recentBattles && stats.recentBattles.length > 0) {
        for (let i = stats.recentBattles.length - 1; i >= 0; i--) {
            if (stats.recentBattles[i].result === 'defeat') {
                metrics.currentStreak++;
            } else {
                break;
            }
        }
    }
    
    // Biggest Save: max amount from defeats
    metrics.biggestSave = 0;
    if (stats.recentBattles && stats.recentBattles.length > 0) {
        const defeatedAmounts = stats.recentBattles
            .filter(b => b.result === 'defeat')
            .map(b => b.amount);
        if (defeatedAmounts.length > 0) {
            metrics.biggestSave = Math.max(...defeatedAmounts);
        }
    }
    
    // Success Rate: percentage of resisted purchases
    metrics.successRate = stats.totalBattles > 0 
        ? ((stats.defeats / stats.totalBattles) * 100).toFixed(1)
        : 0;
    
    // Daily Average: total saved / days since first battle
    metrics.dailyAvg = 0;
    if (stats.recentBattles && stats.recentBattles.length > 0 && stats.moneySaved > 0) {
        const firstBattle = Math.min(...stats.recentBattles.map(b => b.timestamp));
        const daysSinceFirst = Math.max(1, (Date.now() - firstBattle) / (1000 * 60 * 60 * 24));
        metrics.dailyAvg = stats.moneySaved / daysSinceFirst;
    }
    
    // Average Battle: average save per resistance
    metrics.avgBattle = stats.defeats > 0 
        ? stats.moneySaved / stats.defeats 
        : 0;
    
    // This week battles
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    metrics.battlesThisWeek = stats.recentBattles
        ? stats.recentBattles.filter(b => b.timestamp > weekAgo).length
        : 0;
    
    // Win rate (purchases made)
    metrics.winRate = stats.totalBattles > 0 
        ? ((stats.victories / stats.totalBattles) * 100).toFixed(1)
        : 0;
    
    return metrics;
}

function updateStatsDisplay(stats) {
    document.getElementById('totalBattles').textContent = stats.totalBattles || 0;
    document.getElementById('victories').textContent = stats.victories || 0;
    document.getElementById('defeats').textContent = stats.defeats || 0;
    document.getElementById('moneySaved').textContent = `$${(stats.moneySaved || 0).toFixed(2)}`;
    
    // Calculate advanced metrics
    const metrics = calculateAdvancedMetrics(stats);
    
    // Update avg battle
    document.getElementById('avgBattle').textContent = `$${metrics.avgBattle.toFixed(2)}`;
    
    // Update subtexts
    document.getElementById('battlesSubtext').textContent = `${metrics.battlesThisWeek} this week`;
    document.getElementById('victoriesSubtext').textContent = `${metrics.winRate}% win rate`;
    document.getElementById('defeatsSubtext').textContent = `${metrics.successRate}% save rate`;
    document.getElementById('savingsSubtext').textContent = `$${metrics.dailyAvg.toFixed(2)}/day avg`;
    document.getElementById('avgBattleSubtext').textContent = 'per attempt';
    
    // Update analytics grid
    document.getElementById('currentStreak').textContent = metrics.currentStreak;
    document.getElementById('streakTrend').textContent = metrics.currentStreak === 1 
        ? 'consecutive save' 
        : 'consecutive saves';
    document.getElementById('biggestSave').textContent = `$${metrics.biggestSave.toFixed(2)}`;
    document.getElementById('successRate').textContent = `${metrics.successRate}%`;
    document.getElementById('successTrend').textContent = metrics.successRate >= 50 
        ? 'excellent discipline' 
        : 'room to improve';
    document.getElementById('dailyAvg').textContent = `$${metrics.dailyAvg.toFixed(2)}`;
}

function updateSavingsChart(savingsHistory) {
    const ctx = document.getElementById('savingsChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (savingsChart) {
        savingsChart.destroy();
    }
    
    // Prepare data
    const labels = savingsHistory.map((_, index) => `Purchase ${index + 1}`);
    const data = savingsHistory.length > 0 ? savingsHistory : [0];
    const displayLabels = labels.length > 0 ? labels : ['No purchases yet'];
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0.05)');
    
    // Chart configuration with modern styling
    savingsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: displayLabels,
            datasets: [{
                label: 'Cumulative Savings ($)',
                data: data,
                borderColor: '#00d4ff',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#00d4ff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#00d4ff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#2d3748',
                    bodyColor: '#4a5568',
                    titleFont: {
                        family: "'Tahoma', 'Segoe UI', sans-serif",
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        family: "'Tahoma', 'Segoe UI', sans-serif",
                        size: 12,
                        weight: '500'
                    },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
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
                    ticks: {
                        font: {
                            family: "'Tahoma', 'Segoe UI', sans-serif",
                            size: 11,
                            weight: '500'
                        },
                        color: '#718096',
                        callback: function(value) {
                            return '$' + value;
                        }
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.6)',
                        lineWidth: 1
                    },
                    title: {
                        display: true,
                        text: 'Total Saved',
                        font: {
                            family: "'Tahoma', 'Segoe UI', sans-serif",
                            size: 12,
                            weight: '600'
                        },
                        color: '#4a5568'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: "'Tahoma', 'Segoe UI', sans-serif",
                            size: 10,
                            weight: '500'
                        },
                        color: '#718096',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.3)',
                        lineWidth: 1
                    },
                    title: {
                        display: true,
                        text: 'Purchase Progression',
                        font: {
                            family: "'Tahoma', 'Segoe UI', sans-serif",
                            size: 12,
                            weight: '600'
                        },
                        color: '#4a5568'
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function updateRecentBattles(recentBattles) {
    const battlesList = document.getElementById('recentBattlesList');
    
    if (!recentBattles || recentBattles.length === 0) {
        battlesList.innerHTML = '<div class="no-data">No purchases yet. Start your journey!</div>';
        return;
    }
    
    // Show last 10 purchases, most recent first
    const displayBattles = recentBattles.slice(-10).reverse();
    
    battlesList.innerHTML = displayBattles.map(battle => {
        const isVictory = battle.result === 'victory';
        const resultClass = isVictory ? 'victory' : 'defeat';
        const resultText = isVictory ? 'Purchased' : 'Saved';
        const amountText = isVictory ? 'Purchased' : `+$${battle.amount.toFixed(2)}`;
        const timeAgo = formatTimeAgo(battle.timestamp);
        
        const icon = isVictory 
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="#48bb78" stroke-width="2">
                 <path d="M6 9l6 6 6-6"/>
               </svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="#f56565" stroke-width="2">
                 <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                 <path d="M12 17L2 12M22 12L12 17"/>
               </svg>`;
        
        return `
            <div class="battle-item ${resultClass}">
                <div class="battle-info">
                    <div class="battle-result">${resultText}</div>
                    <div class="battle-amount">${amountText}</div>
                    <div class="battle-time">${timeAgo}</div>
                </div>
                <div class="battle-icon">${icon}</div>
            </div>
        `;
    }).join('');
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
