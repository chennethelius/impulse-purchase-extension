// Dashboard Full Script - Loads data from chrome.storage
let activityChart = null;
let radarChart = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
    setupNavigation();
    setupBackButton();
    setupNotifications();
    
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
        updateActivityChart(stats);
        updateRadarChart(stats);
        updateTopCategories(stats);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardStats(stats) {
    // Update main stat cards
    document.getElementById('stat-total').textContent = stats.totalBattles || 0;
    document.getElementById('stat-resisted').textContent = stats.victories || 0;
    document.getElementById('stat-saved').textContent = `$${(stats.moneySaved || 0).toFixed(2)}`;
    
    // Update quick stats
    const successRate = stats.totalBattles > 0 
        ? ((stats.victories / stats.totalBattles) * 100).toFixed(0)
        : 0;
    document.getElementById('success-rate').textContent = `${successRate}%`;
    
    // Calculate average per day (assuming data from last 7 days)
    const avgPerDay = stats.totalBattles > 0 ? (stats.totalBattles / 7).toFixed(1) : 0;
    document.getElementById('avg-per-day').textContent = avgPerDay;
}

function updateActivityChart(stats) {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (activityChart) {
        activityChart.destroy();
    }
    
    // Prepare data - last 7 days
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const resistedData = [0, 0, 0, 0, 0, 0, 0];
    const allowedData = [0, 0, 0, 0, 0, 0, 0];
    
    // Process purchase history to get daily counts
    if (stats.purchaseHistory && stats.purchaseHistory.length > 0) {
        const now = new Date();
        stats.purchaseHistory.forEach(item => {
            const date = new Date(item.timestamp);
            const daysAgo = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            if (daysAgo < 7) {
                const dayIndex = (now.getDay() - daysAgo + 7) % 7;
                if (item.saved) {
                    resistedData[dayIndex]++;
                } else {
                    allowedData[dayIndex]++;
                }
            }
        });
    }
    
    activityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Resisted',
                    data: resistedData,
                    backgroundColor: '#5FBDBD',
                    borderRadius: 8,
                    barThickness: 30
                },
                {
                    label: 'Allowed',
                    data: allowedData,
                    backgroundColor: '#E16B5A',
                    borderRadius: 8,
                    barThickness: 30
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#6b7280',
                        font: {
                            size: 12,
                            weight: '600',
                            family: 'Tahoma'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleColor: '#f9fafb',
                    bodyColor: '#e5e7eb',
                    borderColor: '#5FBDBD',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(229, 231, 235, 0.5)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            size: 11,
                            family: 'Tahoma'
                        },
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            size: 11,
                            weight: '600',
                            family: 'Tahoma'
                        }
                    }
                }
            }
        }
    });
}

function updateRadarChart(stats) {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (radarChart) {
        radarChart.destroy();
    }
    
    const categoryStats = stats.categoryStats || {};
    const categories = Object.keys(categoryStats);
    const values = Object.values(categoryStats);
    
    if (categories.length === 0) {
        // Show no data message
        ctx.parentElement.innerHTML = '<div class="text-center text-gray-400 py-12"><i class="fas fa-chart-radar text-4xl mb-3"></i><p>No category data yet</p></div>';
        return;
    }
    
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Purchases Blocked',
                data: values,
                backgroundColor: 'rgba(95, 189, 189, 0.2)',
                borderColor: '#5FBDBD',
                borderWidth: 3,
                pointBackgroundColor: '#5FBDBD',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
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
                    backgroundColor: '#1f2937',
                    titleColor: '#f9fafb',
                    bodyColor: '#e5e7eb',
                    borderColor: '#5FBDBD',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `Blocked: ${context.parsed.r}`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(229, 231, 235, 0.5)'
                    },
                    angleLines: {
                        color: 'rgba(229, 231, 235, 0.5)'
                    },
                    pointLabels: {
                        color: '#6b7280',
                        font: {
                            size: 12,
                            weight: '600',
                            family: 'Tahoma'
                        }
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            size: 10,
                            family: 'Tahoma'
                        },
                        stepSize: 1,
                        backdropColor: 'transparent'
                    }
                }
            }
        }
    });
}

function updateTopCategories(stats) {
    const container = document.getElementById('top-performers');
    if (!container) return;
    
    const categoryStats = stats.categoryStats || {};
    const sortedCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (sortedCategories.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <i class="fas fa-chart-line text-4xl mb-3"></i>
                <p>No purchase attempts yet</p>
                <p class="text-xs mt-2">Data will appear here as you use the extension</p>
            </div>
        `;
        return;
    }
    
    const categoryIcons = {
        'Fitness': 'fa-dumbbell',
        'Electronics': 'fa-laptop',
        'Clothing': 'fa-tshirt',
        'Home': 'fa-home',
        'Health': 'fa-heartbeat',
        'Fashion': 'fa-tshirt',
        'Food': 'fa-utensils',
        'Entertainment': 'fa-gamepad'
    };
    
    const categoryColors = [
        '#5FBDBD',
        '#E16B5A',
        '#E5A88C',
        '#F59E0B',
        '#8B5CF6'
    ];
    
    container.innerHTML = sortedCategories.map(([category, count], index) => {
        const icon = categoryIcons[category] || 'fa-shopping-bag';
        const color = categoryColors[index % categoryColors.length];
        
        return `
            <div class="performer-item">
                <div class="performer-avatar" style="background-color: ${color};">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="performer-info">
                    <div class="performer-name">${category}</div>
                    <div class="performer-detail">${count} blocked</div>
                </div>
                <div class="performer-stat">${count}</div>
            </div>
        `;
    }).join('');
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.dataset.tab;
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show corresponding page
            pages.forEach(page => {
                if (page.id === `${tabName}-page`) {
                    page.classList.remove('hidden');
                } else {
                    page.classList.add('hidden');
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

function setupNotifications() {
    const notificationTrigger = document.querySelector('.notification-trigger');
    const notificationPopup = document.getElementById('notification-popup');
    
    if (notificationTrigger && notificationPopup) {
        notificationTrigger.addEventListener('click', () => {
            notificationPopup.classList.toggle('hidden');
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!notificationTrigger.contains(e.target) && !notificationPopup.contains(e.target)) {
                notificationPopup.classList.add('hidden');
            }
        });
    }
}
