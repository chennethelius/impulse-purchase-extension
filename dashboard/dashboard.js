// Load real-time stats from stats.json
async function loadStats() {
    try {
        const response = await fetch('stats.json');
        const data = await response.json();
        
        // Transform the data to match our dashboard format
        const transformedData = transformStatsData(data);
        
        // Update stat cards with real data
        document.getElementById('stat-total').textContent = transformedData.total_attempts || 0;
        document.getElementById('stat-resisted').textContent = transformedData.total_blocked || 0;
        document.getElementById('stat-saved').textContent = `$${(transformedData.money_saved || 0).toFixed(2)}`;
        
        // Update success rate
        const successRate = transformedData.total_attempts > 0 
            ? Math.round((transformedData.total_blocked / transformedData.total_attempts) * 100)
            : 0;
        document.getElementById('success-rate').textContent = `${successRate}%`;
        
        // Calculate average per day
        const avgPerDay = transformedData.timeline.length > 0
            ? Math.round(transformedData.total_attempts / transformedData.timeline.length)
            : 0;
        document.getElementById('avg-per-day').textContent = avgPerDay;
        
        // Create activity chart with real timeline data
        createActivityChart(transformedData);
        
        // Create radar chart for category resistance
        createRadarChart(transformedData);
        
        // Populate top performers with real category data
        populateTopPerformers(transformedData);
        
        console.log('✅ Loaded stats:', transformedData);
        
    } catch (error) {
        console.error('❌ Error loading stats:', error);
        showEmptyState();
    }
}

// Transform stats.json format to dashboard format
function transformStatsData(data) {
    const totalBattles = data.totalBattles || 0;
    const defeats = data.defeats || 0;
    const moneySaved = data.moneySaved || 0;
    const recentBattles = data.recentBattles || [];
    
    // Create timeline for last 7 days
    const timeline = [];
    const today = new Date();
    const categoryStats = {};
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dateStr = date.toISOString().split('T')[0];
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        // Count battles for this day
        const dayBattles = recentBattles.filter(battle => {
            const battleDate = new Date(battle.timestamp);
            return battleDate >= date && battleDate < nextDate;
        });
        
        const blocked = dayBattles.filter(b => b.result === 'defeat').length;
        const allowed = dayBattles.filter(b => b.result === 'victory').length;
        const daySavings = dayBattles
            .filter(b => b.result === 'defeat')
            .reduce((sum, b) => sum + (b.amount || 0), 0);
        
        timeline.push({
            date: dateStr,
            blocked: blocked,
            allowed: allowed,
            money_saved: daySavings
        });
        
        // Categorize battles (simple categorization by amount)
        dayBattles.forEach(battle => {
            let category = 'Other';
            const amount = battle.amount || 0;
            
            if (amount > 1000) category = 'Electronics';
            else if (amount > 100) category = 'Fashion';
            else if (amount > 50) category = 'Home';
            else if (amount > 20) category = 'Food';
            else category = 'Entertainment';
            
            if (!categoryStats[category]) {
                categoryStats[category] = { blocked: 0, attempts: 0, money_saved: 0 };
            }
            
            categoryStats[category].attempts++;
            if (battle.result === 'defeat') {
                categoryStats[category].blocked++;
                categoryStats[category].money_saved += amount;
            }
        });
    }
    
    // Create top categories list
    const top_categories = Object.entries(categoryStats)
        .map(([category, stats]) => ({
            category: category,
            blocked: stats.blocked,
            money_saved: stats.money_saved
        }))
        .sort((a, b) => b.blocked - a.blocked)
        .slice(0, 6);
    
    return {
        total_attempts: totalBattles,
        total_blocked: defeats,
        money_saved: moneySaved,
        timeline: timeline,
        categories: categoryStats,
        top_categories: top_categories
    };
}

function showEmptyState() {
    document.getElementById('stat-total').textContent = '0';
    document.getElementById('stat-resisted').textContent = '0';
    document.getElementById('stat-saved').textContent = '$0.00';
    document.getElementById('success-rate').textContent = '0%';
    document.getElementById('avg-per-day').textContent = '0';
    
    createActivityChart({ timeline: [] });
    createRadarChart({ categories: {}, top_categories: [] });
    populateTopPerformers({ top_categories: [] });
}

function createActivityChart(data) {
    const ctx = document.getElementById('activityChart').getContext('2d');
    
    // Extract timeline data from backend
    const labels = [];
    const blockedValues = [];
    const cumulativeSavings = [];
    let cumulativeTotal = 0;
    
    if (data.timeline && data.timeline.length > 0) {
        // Use last 7 days of data
        const recentTimeline = data.timeline.slice(-7);
        
        recentTimeline.forEach(entry => {
            // Format date as "Mon", "Tue", etc.
            const date = new Date(entry.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            labels.push(dayName);
            blockedValues.push(entry.blocked || 0);
            
            // Calculate cumulative savings
            cumulativeTotal += (entry.money_saved || 0);
            cumulativeSavings.push(parseFloat(cumulativeTotal.toFixed(2)));
        });
    } else {
        // Default empty data
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        days.forEach(day => {
            labels.push(day);
            blockedValues.push(0);
            cumulativeSavings.push(0);
        });
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Purchases Blocked',
                    data: blockedValues,
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#F59E0B',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                    yAxisID: 'y'
                },
                {
                    label: 'Cumulative Money Saved',
                    data: cumulativeSavings,
                    borderColor: '#5FBDBD',
                    backgroundColor: 'rgba(95, 189, 189, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#5FBDBD',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        font: {
                            family: 'Tahoma',
                            size: 11
                        },
                        color: '#6b7280',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 15,
                        boxWidth: 8,
                        boxHeight: 8
                    }
                },
                tooltip: {
                    backgroundColor: '#1f2937',
                    padding: 12,
                    titleFont: {
                        family: 'Tahoma',
                        size: 13
                    },
                    bodyFont: {
                        family: 'Tahoma',
                        size: 13
                    },
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `Blocked: ${context.parsed.y} purchases`;
                            } else {
                                return `Total Saved: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Tahoma',
                            size: 11
                        },
                        color: '#9ca3af'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    grid: {
                        color: '#f3f4f6',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            family: 'Tahoma',
                            size: 11
                        },
                        color: '#9ca3af',
                        stepSize: 1,
                        callback: function(value) {
                            return Math.round(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Blocked Purchases',
                        font: {
                            family: 'Tahoma',
                            size: 10
                        },
                        color: '#F59E0B'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        font: {
                            family: 'Tahoma',
                            size: 11
                        },
                        color: '#9ca3af',
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Money Saved',
                        font: {
                            family: 'Tahoma',
                            size: 10
                        },
                        color: '#5FBDBD'
                    }
                }
            }
        }
    });
}

function createRadarChart(data) {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    // Extract category data
    const categories = data.categories || {};
    const topCategories = data.top_categories || [];
    
    // Prepare data for radar chart - PENTAGON (exactly 5 categories)
    const labels = [];
    const blockedData = [];
    const resistanceRates = [];
    
    if (topCategories.length > 0) {
        // Use exactly top 5 categories for pentagon shape
        const categoryLimit = Math.min(topCategories.length, 5);
        
        for (let i = 0; i < categoryLimit; i++) {
            const cat = topCategories[i];
            labels.push(cat.category);
            blockedData.push(cat.blocked);
            
            // Calculate resistance rate (percentage of attempts that were blocked)
            const categoryData = categories[cat.category] || { blocked: 0, attempts: 0 };
            const resistanceRate = categoryData.attempts > 0 
                ? Math.round((categoryData.blocked / categoryData.attempts) * 100) 
                : 0;
            resistanceRates.push(resistanceRate);
        }
        
        // Pad with zeros if we have less than 5 categories to maintain pentagon
        while (labels.length < 5) {
            labels.push('Other');
            blockedData.push(0);
            resistanceRates.push(0);
        }
    } else {
        // Default empty data with exactly 5 categories for pentagon
        const defaultCategories = ['Electronics', 'Fashion', 'Food', 'Entertainment', 'Home'];
        defaultCategories.forEach(cat => {
            labels.push(cat);
            blockedData.push(0);
            resistanceRates.push(0);
        });
    }
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Purchases Blocked',
                    data: blockedData,
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    borderColor: '#F59E0B',
                    borderWidth: 2,
                    pointBackgroundColor: '#F59E0B',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: '#F59E0B',
                    pointHoverBorderColor: '#fff'
                },
                {
                    label: 'Resistance Rate (%)',
                    data: resistanceRates,
                    backgroundColor: 'rgba(95, 189, 189, 0.2)',
                    borderColor: '#5FBDBD',
                    borderWidth: 2,
                    pointBackgroundColor: '#5FBDBD',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: '#5FBDBD',
                    pointHoverBorderColor: '#fff'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'Tahoma',
                            size: 12
                        },
                        color: '#6b7280',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 15,
                        boxWidth: 10,
                        boxHeight: 10
                    }
                },
                tooltip: {
                    backgroundColor: '#1f2937',
                    padding: 12,
                    titleFont: {
                        family: 'Tahoma',
                        size: 13
                    },
                    bodyFont: {
                        family: 'Tahoma',
                        size: 13
                    },
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `Blocked: ${context.parsed.r} purchases`;
                            } else {
                                return `Resistance: ${context.parsed.r}%`;
                            }
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    angleLines: {
                        color: '#e5e7eb'
                    },
                    grid: {
                        color: '#e5e7eb'
                    },
                    pointLabels: {
                        font: {
                            family: 'Tahoma',
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#4b5563'
                    },
                    ticks: {
                        font: {
                            family: 'Tahoma',
                            size: 10
                        },
                        color: '#9ca3af',
                        backdropColor: 'rgba(255, 255, 255, 0.8)',
                        backdropPadding: 3,
                        stepSize: blockedData.length > 0 ? Math.ceil(Math.max(...blockedData) / 5) : 1
                    }
                }
            }
        }
    });
}

function populateTopPerformers(data) {
    const container = document.getElementById('top-performers');
    const topCategories = data.top_categories || [];
    
    // If no data, show placeholder
    if (topCategories.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <i class="fas fa-chart-line text-4xl mb-3"></i>
                <p>No purchase attempts yet</p>
                <p class="text-xs mt-2">Data will appear here as you use the extension</p>
            </div>
        `;
        return;
    }
    
    const colors = ['#E16B5A', '#5FBDBD', '#F59E0B', '#E5A88C', '#FF8C69'];
    
    container.innerHTML = topCategories.map((cat, index) => {
        const percentage = topCategories.length > 0 
            ? Math.round((cat.blocked / topCategories[0].blocked) * 100) 
            : 100;
            
        return `
            <div class="performer-item">
                <div class="performer-avatar" style="background-color: ${colors[index % colors.length]}">
                    ${cat.category.charAt(0)}
                </div>
                <div class="performer-info">
                    <div class="performer-name">${cat.category}</div>
                    <div class="performer-detail">${cat.blocked} blocked • $${cat.money_saved.toFixed(2)} saved</div>
                </div>
                <div class="performer-stat">${percentage}%</div>
            </div>
        `;
    }).join('');
}

// Auto-refresh stats every 30 seconds
setInterval(loadStats, 30000);

// Tab switching functionality
function initTabSwitching() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show target page, hide others
            pages.forEach(page => {
                if (page.id === `${targetTab}-page`) {
                    page.classList.remove('hidden');
                } else {
                    page.classList.add('hidden');
                }
            });
            
            // Load insights chart if switching to insights
            if (targetTab === 'insights') {
                createSpendingPatternChart();
            }
        });
    });
}

// Create spending pattern chart for insights page
function createSpendingPatternChart() {
    const canvas = document.getElementById('spendingPatternChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.spendingChart) {
        window.spendingChart.destroy();
    }
    
    const hours = ['12AM', '3AM', '6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];
    const attempts = [2, 1, 0, 3, 8, 12, 18, 24];
    const resisted = [2, 1, 0, 2, 6, 9, 11, 15];
    
    window.spendingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours,
            datasets: [
                {
                    label: 'Purchase Attempts',
                    data: attempts,
                    backgroundColor: 'rgba(229, 168, 140, 0.6)',
                    borderColor: '#E5A88C',
                    borderWidth: 2
                },
                {
                    label: 'Successfully Resisted',
                    data: resisted,
                    backgroundColor: 'rgba(95, 189, 189, 0.6)',
                    borderColor: '#5FBDBD',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Tahoma',
                            size: 12
                        },
                        color: '#6b7280',
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: '#1f2937',
                    padding: 12,
                    titleFont: {
                        family: 'Tahoma',
                        size: 13
                    },
                    bodyFont: {
                        family: 'Tahoma',
                        size: 13
                    },
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Tahoma',
                            size: 11
                        },
                        color: '#9ca3af'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f3f4f6',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            family: 'Tahoma',
                            size: 11
                        },
                        color: '#9ca3af',
                        stepSize: 5
                    }
                }
            }
        }
    });
}

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    initTabSwitching();
    initNotifications();
    initSettings();
});

// Initialize notification popup functionality
function initNotifications() {
    const notificationPopup = document.getElementById('notification-popup');
    
    if (!notificationPopup) return;
    
    // Get all notification trigger buttons
    const notificationTriggers = document.querySelectorAll('.notification-trigger');
    const notificationBadges = document.querySelectorAll('.notification-badge');
    
    // Toggle notification popup when clicking any notification button
    notificationTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationPopup.classList.toggle('hidden');
            
            // Hide all badges when opened
            if (!notificationPopup.classList.contains('hidden')) {
                notificationBadges.forEach(badge => {
                    badge.style.display = 'none';
                });
            }
        });
    });
    
    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        if (!notificationPopup.contains(e.target) && !e.target.closest('.notification-trigger')) {
            notificationPopup.classList.add('hidden');
        }
    });
    
    // Handle notification item clicks
    const notificationItems = document.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
        item.addEventListener('click', () => {
            // Mark as read (fade effect)
            item.style.opacity = '0.6';
            console.log('Notification clicked');
        });
    });
}

// Initialize settings button functionality
function initSettings() {
    const settingsTriggers = document.querySelectorAll('.settings-trigger');
    
    settingsTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            alert('Settings panel coming soon! 🎨\n\nYou will be able to customize:\n• Alert thresholds\n• Theme colors\n• Notification preferences\n• AI difficulty level');
        });
    });
}
