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
    loadDarkModePreference(); // Load dark mode first
    loadStats();
    initTabSwitching();
    initNotifications();
    initSettings();
    initReportsPage();
    initCommentsPage();
    initChannelsPage();
    initTooltips();
    initSearchAndFilters();
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
            const wasHidden = notificationPopup.classList.contains('hidden');
            notificationPopup.classList.toggle('hidden');
            
            // Animate in
            if (wasHidden) {
                notificationPopup.style.opacity = '0';
                notificationPopup.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    notificationPopup.style.transition = 'all 0.2s ease';
                    notificationPopup.style.opacity = '1';
                    notificationPopup.style.transform = 'translateY(0)';
                }, 10);
            }
            
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
            // Mark as read with smooth transition
            item.style.transition = 'opacity 0.3s ease';
            item.style.opacity = '0.5';
            
            // Show toast notification
            showToast('Notification marked as read', 'success');
        });
    });
    
    // View all notifications button
    const viewAllBtn = notificationPopup.querySelector('button');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            showToast('Full notification history coming soon!', 'info');
            notificationPopup.classList.add('hidden');
        });
    }
}

// Initialize settings button functionality with modal
function initSettings() {
    const settingsTriggers = document.querySelectorAll('.settings-trigger');
    
    settingsTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showSettingsModal();
        });
    });
}

// Show settings modal
function showSettingsModal() {
    // Check current dark mode state
    const isDarkMode = document.body.classList.contains('dark-mode');
    const darkModeChecked = isDarkMode ? 'checked' : '';
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in" style="animation: fadeIn 0.2s ease">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-2xl font-bold text-gray-800">Settings</h2>
                <button class="close-modal w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <div class="space-y-4 mb-6">
                <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <label class="text-sm font-semibold text-gray-700">Notifications</label>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked class="sr-only peer" id="notifications-toggle">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal"></div>
                        </label>
                    </div>
                    <p class="text-xs text-gray-500">Receive alerts for impulse purchases</p>
                </div>
                
                <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <label class="text-sm font-semibold text-gray-700">AI Difficulty</label>
                        <select id="ai-difficulty" class="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:border-teal focus:outline-none">
                            <option>Easy</option>
                            <option selected>Normal</option>
                            <option>Hard</option>
                            <option>Extreme</option>
                        </select>
                    </div>
                    <p class="text-xs text-gray-500">How strict should the AI guardian be?</p>
                </div>
                
                <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <label class="text-sm font-semibold text-gray-700">Dark Mode</label>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" ${darkModeChecked} class="sr-only peer" id="dark-mode-toggle">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal"></div>
                        </label>
                    </div>
                    <p class="text-xs text-gray-500">Switch between light and dark theme</p>
                </div>
            </div>
            
            <div class="flex space-x-3">
                <button class="save-settings flex-1 px-4 py-2 bg-teal text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all">
                    Save Changes
                </button>
                <button class="close-modal px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Dark mode toggle handler
    const darkModeToggle = modal.querySelector('#dark-mode-toggle');
    darkModeToggle.addEventListener('change', (e) => {
        toggleDarkMode(e.target.checked);
    });
    
    // Close modal handlers
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 200);
        });
    });
    
    // Save settings
    modal.querySelector('.save-settings').addEventListener('click', () => {
        const settings = {
            notifications: modal.querySelector('#notifications-toggle').checked,
            aiDifficulty: modal.querySelector('#ai-difficulty').value,
            darkMode: modal.querySelector('#dark-mode-toggle').checked
        };
        
        // Save to localStorage
        localStorage.setItem('impulseGuardSettings', JSON.stringify(settings));
        
        showToast('Settings saved successfully!', 'success');
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 200);
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 200);
        }
    });
}

// Toggle dark mode
function toggleDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
        showToast('Dark mode enabled 🌙', 'success');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
        showToast('Light mode enabled ☀️', 'success');
    }
}

// Load dark mode preference on page load
function loadDarkModePreference() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
    }
    
    // Also load other settings
    const settings = localStorage.getItem('impulseGuardSettings');
    if (settings) {
        try {
            const parsed = JSON.parse(settings);
            console.log('Loaded settings:', parsed);
        } catch (e) {
            console.error('Failed to parse settings:', e);
        }
    }
}

// Initialize Reports page functionality
function initReportsPage() {
    // Period selector buttons
    const periodButtons = document.querySelectorAll('#reports-page button');
    periodButtons.forEach(btn => {
        if (btn.textContent.includes('Weekly') || btn.textContent.includes('Monthly') || btn.textContent.includes('Yearly')) {
            btn.addEventListener('click', () => {
                // Remove active state from all
                periodButtons.forEach(b => {
                    if (b.textContent.includes('Weekly') || b.textContent.includes('Monthly') || b.textContent.includes('Yearly')) {
                        b.className = b.className.replace('text-coral border-coral border-2', 'text-gray-600');
                        b.className += ' hover:bg-gray-50';
                    }
                });
                
                // Add active state to clicked
                btn.className = btn.className.replace('hover:bg-gray-50', '');
                btn.className += ' text-coral border-coral border-2';
                
                showToast(`Showing ${btn.textContent.trim()} report`, 'info');
            });
        }
        
        // Export button
        if (btn.textContent.includes('Export')) {
            btn.addEventListener('click', () => {
                showToast('Exporting report as PDF...', 'success');
                setTimeout(() => {
                    showToast('Report exported successfully!', 'success');
                }, 1500);
            });
        }
    });
}

// Initialize Comments page functionality
function initCommentsPage() {
    // Save note button
    const saveNoteBtn = document.querySelector('#comments-page button[class*="bg-teal"]');
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', () => {
            const textarea = document.querySelector('#comments-page textarea');
            if (textarea && textarea.value.trim()) {
                showToast('Note saved successfully!', 'success');
                textarea.value = '';
                // Animate success
                saveNoteBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Saved!';
                setTimeout(() => {
                    saveNoteBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Note';
                }, 2000);
            } else {
                showToast('Please write something first', 'error');
            }
        });
    }
    
    // Add Tag and Mood buttons
    const tagButtons = document.querySelectorAll('#comments-page button[class*="bg-gray-100"]');
    tagButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.textContent.includes('Tag')) {
                showToast('Tag selector coming soon!', 'info');
            } else if (btn.textContent.includes('Mood')) {
                showMoodSelector();
            }
        });
    });
    
    // Like and comment buttons on existing notes
    const noteActions = document.querySelectorAll('#comments-page .notification-item button');
    noteActions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const icon = btn.querySelector('i');
            if (icon.classList.contains('fa-thumbs-up')) {
                const count = parseInt(btn.textContent.trim()) || 0;
                btn.innerHTML = `<i class="fas fa-thumbs-up mr-1 text-teal"></i>${count + 1}`;
                showToast('Liked!', 'success');
            } else if (icon.classList.contains('fa-comment')) {
                showToast('Comments feature coming soon!', 'info');
            }
        });
    });
}

// Show mood selector
function showMoodSelector() {
    const moods = [
        { emoji: '😊', label: 'Happy', color: 'bg-green-100 text-green-600' },
        { emoji: '😰', label: 'Tempted', color: 'bg-orange-100 text-orange-600' },
        { emoji: '😔', label: 'Regret', color: 'bg-red-100 text-red-600' },
        { emoji: '💪', label: 'Strong', color: 'bg-blue-100 text-blue-600' },
        { emoji: '🎉', label: 'Victory', color: 'bg-purple-100 text-purple-600' }
    ];
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 class="text-xl font-bold text-gray-800 mb-4">How are you feeling?</h3>
            <div class="grid grid-cols-2 gap-3">
                ${moods.map(mood => `
                    <button class="mood-option p-4 ${mood.color} rounded-lg font-semibold text-sm hover:scale-105 transition-transform">
                        <div class="text-3xl mb-2">${mood.emoji}</div>
                        ${mood.label}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelectorAll('.mood-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const mood = btn.textContent.trim();
            showToast(`Mood set to ${mood}`, 'success');
            modal.remove();
        });
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Initialize Channels page functionality
function initChannelsPage() {
    // Toggle switches
    const toggles = document.querySelectorAll('#channels-page input[type="checkbox"]');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const card = e.target.closest('.card');
            const channelName = card ? card.querySelector('h3').textContent : 'Channel';
            
            if (e.target.checked) {
                showToast(`${channelName} protection enabled`, 'success');
            } else {
                showToast(`${channelName} protection disabled`, 'info');
            }
        });
    });
    
    // Add custom website button
    const addWebsiteBtn = document.querySelector('#channels-page button[class*="bg-teal"]');
    const websiteInput = document.querySelector('#channels-page input[type="text"]');
    
    if (addWebsiteBtn && websiteInput) {
        addWebsiteBtn.addEventListener('click', () => {
            const url = websiteInput.value.trim();
            if (url) {
                if (isValidUrl(url)) {
                    showToast(`Added ${url} to protected sites!`, 'success');
                    websiteInput.value = '';
                } else {
                    showToast('Please enter a valid URL', 'error');
                }
            } else {
                showToast('Please enter a website URL', 'error');
            }
        });
        
        // Enter key support
        websiteInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addWebsiteBtn.click();
            }
        });
    }
}

// Validate URL
function isValidUrl(string) {
    try {
        const pattern = /^([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
        return pattern.test(string.replace(/^https?:\/\//, ''));
    } catch (_) {
        return false;
    }
}

// Initialize tooltips
function initTooltips() {
    const infoIcons = document.querySelectorAll('.fa-info-circle');
    infoIcons.forEach(icon => {
        icon.style.cursor = 'pointer';
        icon.addEventListener('mouseenter', (e) => {
            const tooltipText = getTooltipText(e.target);
            showTooltip(e.target, tooltipText);
        });
        icon.addEventListener('mouseleave', () => {
            hideTooltip();
        });
    });
}

// Get tooltip text based on context
function getTooltipText(element) {
    const parent = element.closest('.stat-box');
    if (parent) {
        const label = parent.querySelector('span').textContent;
        const tooltips = {
            'Total Attempts': 'Total number of times the AI guardian intercepted a purchase attempt',
            'Resisted': 'Number of purchases you successfully resisted',
            'Money Saved': 'Total amount of money saved by not making impulse purchases'
        };
        return tooltips[label] || 'More information';
    }
    return 'More information';
}

// Show tooltip
let currentTooltip = null;
function showTooltip(element, text) {
    hideTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'fixed bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 max-w-xs';
    tooltip.textContent = text;
    tooltip.style.pointerEvents = 'none';
    
    document.body.appendChild(tooltip);
    currentTooltip = tooltip;
    
    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
    tooltip.style.left = `${rect.left - tooltip.offsetWidth / 2}px`;
    
    // Animate in
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateY(5px)';
    setTimeout(() => {
        tooltip.style.transition = 'all 0.2s ease';
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0)';
    }, 10);
}

// Hide tooltip
function hideTooltip() {
    if (currentTooltip) {
        currentTooltip.remove();
        currentTooltip = null;
    }
}

// Initialize search and filters
function initSearchAndFilters() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            showToast('Quick search coming soon!', 'info');
        }
        
        // Escape to close modals/popups
        if (e.key === 'Escape') {
            document.getElementById('notification-popup')?.classList.add('hidden');
            document.querySelectorAll('.fixed.inset-0').forEach(modal => modal.remove());
        }
    });
}

// Toast notification system
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const icons = {
        success: 'fa-check-circle text-green-500',
        error: 'fa-exclamation-circle text-red-500',
        info: 'fa-info-circle text-blue-500',
        warning: 'fa-exclamation-triangle text-yellow-500'
    };
    
    toast.className = 'fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl p-4 flex items-center space-x-3 z-50 border border-gray-200';
    toast.innerHTML = `
        <i class="fas ${icons[type]} text-xl"></i>
        <span class="text-gray-800 font-medium">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => {
        toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Auto remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
