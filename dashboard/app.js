const { useState, useEffect, useRef } = React;

// Utility function to load stats from Chrome extension storage or stats.json
const loadStatsData = async () => {
    try {
        // Try to load from Chrome extension storage first
        if (typeof chrome !== 'undefined' && chrome.storage) {
            return new Promise((resolve) => {
                chrome.storage.local.get(['stats', 'impulsePurchaseLogs'], (data) => {
                    if (data.stats || data.impulsePurchaseLogs) {
                        resolve(processExtensionData(data));
                    } else {
                        // Fall back to stats.json
                        fetch('stats.json')
                            .then(res => res.json())
                            .then(resolve)
                            .catch(() => resolve(getDefaultStats()));
                    }
                });
            });
        } else {
            // Load from stats.json
            const response = await fetch('stats.json');
            return await response.json();
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        return getDefaultStats();
    }
};

const processExtensionData = (data) => {
    const logs = data.impulsePurchaseLogs || [];
    const stats = data.stats || {};
    
    // Calculate categories from logs
    const categories = {};
    logs.forEach(log => {
        if (!categories[log.category]) {
            categories[log.category] = {
                blocked: 0,
                allowed: 0,
                saved: 0,
                total: 0
            };
        }
        categories[log.category].total++;
        if (log.outcome === 'blocked') {
            categories[log.category].blocked++;
            categories[log.category].saved += log.price || 0;
        } else if (log.outcome === 'allowed') {
            categories[log.category].allowed++;
        }
    });
    
    return {
        total_blocked: logs.filter(l => l.outcome === 'blocked').length,
        total_resisted: stats.victories || logs.filter(l => l.outcome === 'blocked').length,
        money_saved: stats.moneySaved || logs.filter(l => l.outcome === 'blocked').reduce((sum, l) => sum + (l.price || 0), 0),
        categories: categories,
        timeline: generateTimeline(logs),
        purchases: logs
    };
};

const generateTimeline = (logs) => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const dayLogs = logs.filter(log => {
            const logDate = new Date(log.timestamp || log.attemptTimestamp);
            return logDate.toDateString() === date.toDateString();
        });
        
        last7Days.push({
            date: dateStr,
            blocked: dayLogs.filter(l => l.outcome === 'blocked').length,
            allowed: dayLogs.filter(l => l.outcome === 'allowed').length
        });
    }
    
    return last7Days;
};

const getDefaultStats = () => ({
    total_blocked: 0,
    total_resisted: 0,
    money_saved: 0,
    categories: {},
    timeline: [
        { date: 'Mon', blocked: 0 },
        { date: 'Tue', blocked: 0 },
        { date: 'Wed', blocked: 0 },
        { date: 'Thu', blocked: 0 },
        { date: 'Fri', blocked: 0 },
        { date: 'Sat', blocked: 0 },
        { date: 'Sun', blocked: 0 }
    ],
    purchases: []
});

// Sidebar Component
const Sidebar = ({ currentPage, onNavigate }) => {
    const menuItems = [
        { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard', badge: null },
        { id: 'insights', icon: 'fa-lightbulb', label: 'Insights', badge: null },
        { id: 'reports', icon: 'fa-file-alt', label: 'Reports', badge: null },
        { id: 'comments', icon: 'fa-comments', label: 'Comments', badge: null },
        { id: 'channels', icon: 'fa-share-alt', label: 'Channels', badge: null }
    ];
    
    return (
        <aside className="w-64 bg-white bg-opacity-40 p-6 flex flex-col">
            {/* Logo */}
            <div className="mb-8">
                <div className="flex items-center space-x-2 mb-1">
                    <h1 className="text-xl font-bold text-gray-800">Impulse Guard</h1>
                </div>
            </div>
            
            {/* User Profile */}
            <div className="mb-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 mx-auto mb-3 flex items-center justify-center">
                    <i className="fas fa-user text-white text-3xl"></i>
                </div>
                <h2 className="font-bold text-gray-800 text-sm">Guest User</h2>
                <p className="text-xs text-gray-500">Member</p>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                {menuItems.map(item => (
                    <a
                        key={item.id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); onNavigate(item.id); }}
                        className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                    >
                        <i className={`fas ${item.icon} mr-3`}></i>
                        <span>{item.label}</span>
                        {item.badge && (
                            <span className="ml-auto bg-coral text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {item.badge}
                            </span>
                        )}
                    </a>
                ))}
            </nav>
            
            {/* Logout */}
            <button className="flex items-center space-x-2 text-gray-600 text-sm mt-auto hover:text-gray-800 transition-colors">
                <i className="fas fa-sign-out-alt"></i>
                <span>Log out</span>
            </button>
        </aside>
    );
};

// Dashboard Page Component
const DashboardPage = ({ stats }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    
    useEffect(() => {
        if (chartRef.current && stats.timeline) {
            // Destroy existing chart
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            
            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: stats.timeline.map(t => t.date),
                    datasets: [{
                        label: 'Blocked Purchases',
                        data: stats.timeline.map(t => t.blocked),
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: '#F59E0B',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1f2937',
                            padding: 12,
                            titleFont: { family: 'Tahoma', size: 13 },
                            bodyFont: { family: 'Tahoma', size: 14, weight: 'bold' },
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { font: { family: 'Tahoma', size: 11 }, color: '#9ca3af' }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: '#f3f4f6', drawBorder: false },
                            ticks: { font: { family: 'Tahoma', size: 11 }, color: '#9ca3af' }
                        }
                    }
                }
            });
        }
        
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [stats]);
    
    const topCategories = Object.entries(stats.categories || {})
        .map(([name, data]) => ({
            name,
            blocked: data.blocked || 0,
            saved: data.saved || 0
        }))
        .sort((a, b) => b.blocked - a.blocked)
        .slice(0, 4);
    
    const colors = ['#E16B5A', '#5FBDBD', '#F59E0B', '#8B5CF6'];
    
    return (
        <main className="flex-1 p-8 overflow-y-auto max-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
                    <div className="flex items-center space-x-3">
                        <button className="w-8 h-8 rounded-full bg-coral text-white flex items-center justify-center relative">
                            <i className="fas fa-bell text-sm"></i>
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                        </button>
                        <button className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center">
                            <i className="fas fa-cog text-sm"></i>
                        </button>
                    </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="stat-box">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-semibold">Total Attempts</span>
                            <i className="fas fa-info-circle text-teal text-xs"></i>
                        </div>
                        <div className="text-3xl font-bold text-gray-800">{stats.total_blocked + (stats.purchases?.filter(p => p.outcome === 'allowed').length || 0)}</div>
                    </div>
                    <div className="stat-box">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-semibold">Resisted</span>
                            <i className="fas fa-info-circle text-coral text-xs"></i>
                        </div>
                        <div className="text-3xl font-bold text-gray-800">{stats.total_resisted}</div>
                    </div>
                    <div className="stat-box">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 font-semibold">Money Saved</span>
                            <i className="fas fa-info-circle text-teal text-xs"></i>
                        </div>
                        <div className="text-3xl font-bold text-gray-800">${stats.money_saved.toFixed(2)}</div>
                    </div>
                </div>
            </div>
            
            {/* Activity Chart */}
            <div className="card mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Activity</h2>
                    <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-400">Last 7 days</span>
                    </div>
                </div>
                <div style={{ height: '250px' }}>
                    <canvas ref={chartRef}></canvas>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                {/* Top Performers */}
                <div className="card">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Top Categories</h2>
                    <div className="space-y-3">
                        {topCategories.map((cat, index) => {
                            const percentage = topCategories.length > 0 
                                ? Math.round((cat.blocked / topCategories[0].blocked) * 100) 
                                : 100;
                            
                            return (
                                <div key={cat.name} className="performer-item">
                                    <div className="performer-avatar" style={{ backgroundColor: colors[index % colors.length] }}>
                                        {cat.name.charAt(0)}
                                    </div>
                                    <div className="performer-info">
                                        <div className="performer-name">{cat.name}</div>
                                        <div className="performer-detail">{cat.blocked} blocked • ${cat.saved.toFixed(2)} saved</div>
                                    </div>
                                    <div className="performer-stat">{percentage}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Upgrade Banner & Channels */}
                <div className="space-y-6">
                    {/* Upgrade Banner */}
                    <div className="card bg-gradient-to-br from-teal to-blue-400 text-white relative overflow-hidden" style={{ minHeight: '120px' }}>
                        <div className="relative z-10">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold mb-1">Upgrade Your</h3>
                                    <h3 className="text-lg font-bold mb-2">Guard</h3>
                                    <p className="text-xs opacity-90">Pro plan for better results</p>
                                </div>
                                <button className="bg-coral px-4 py-1.5 rounded-full text-sm font-bold hover:bg-red-500 transition-colors">
                                    NOW
                                </button>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="8"/>
                                <circle cx="50" cy="50" r="25" fill="none" stroke="white" strokeWidth="8"/>
                            </svg>
                        </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="card">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Stats</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <i className="fas fa-shield-alt text-teal mr-3"></i>
                                    <span className="text-sm text-gray-700">Success Rate</span>
                                </div>
                                <span className="font-bold text-gray-800">
                                    {stats.total_blocked + stats.purchases?.filter(p => p.outcome === 'allowed').length > 0
                                        ? Math.round((stats.total_blocked / (stats.total_blocked + stats.purchases?.filter(p => p.outcome === 'allowed').length)) * 100)
                                        : 0}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <i className="fas fa-calendar-day text-coral mr-3"></i>
                                    <span className="text-sm text-gray-700">Avg per Day</span>
                                </div>
                                <span className="font-bold text-gray-800">
                                    {(stats.timeline?.reduce((sum, t) => sum + t.blocked, 0) / 7 || 0).toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

// Insights Page Component
const InsightsPage = ({ stats }) => {
    const chartRef = useRef(null);
    const categoryChartRef = useRef(null);
    const chartInstance = useRef(null);
    const categoryChartInstance = useRef(null);
    
    useEffect(() => {
        // Spending by category pie chart
        if (categoryChartRef.current && stats.categories) {
            if (categoryChartInstance.current) {
                categoryChartInstance.current.destroy();
            }
            
            const ctx = categoryChartRef.current.getContext('2d');
            const categories = Object.entries(stats.categories || {});
            
            categoryChartInstance.current = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categories.map(([name]) => name),
                    datasets: [{
                        data: categories.map(([, data]) => data.blocked),
                        backgroundColor: ['#E16B5A', '#5FBDBD', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { font: { family: 'Tahoma', size: 11 }, padding: 15 }
                        }
                    }
                }
            });
        }
        
        // Time of day analysis
        if (chartRef.current && stats.purchases) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            
            const hourlyData = new Array(24).fill(0);
            stats.purchases?.forEach(purchase => {
                const hour = new Date(purchase.timestamp || purchase.attemptTimestamp).getHours();
                hourlyData[hour]++;
            });
            
            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                    datasets: [{
                        label: 'Impulse Purchases',
                        data: hourlyData,
                        backgroundColor: '#5FBDBD',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { font: { family: 'Tahoma', size: 9 }, maxRotation: 45 }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: '#f3f4f6' },
                            ticks: { font: { family: 'Tahoma', size: 11 } }
                        }
                    }
                }
            });
        }
        
        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
            if (categoryChartInstance.current) categoryChartInstance.current.destroy();
        };
    }, [stats]);
    
    const avgPrice = stats.purchases?.length > 0
        ? stats.purchases.reduce((sum, p) => sum + (p.price || 0), 0) / stats.purchases.length
        : 0;
    
    const mostExpensiveCategory = Object.entries(stats.categories || {})
        .sort((a, b) => b[1].saved - a[1].saved)[0];
    
    return (
        <main className="flex-1 p-8 overflow-y-auto max-h-screen">
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Insights</h1>
                <p className="text-gray-600">Deep dive into your impulse purchase patterns</p>
            </div>
            
            {/* Key Insights */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="stat-box">
                    <div className="text-xs text-gray-500 font-semibold mb-2">Avg Item Price</div>
                    <div className="text-2xl font-bold text-gray-800">${avgPrice.toFixed(2)}</div>
                </div>
                <div className="stat-box">
                    <div className="text-xs text-gray-500 font-semibold mb-2">Top Category</div>
                    <div className="text-2xl font-bold text-gray-800">
                        {mostExpensiveCategory ? mostExpensiveCategory[0] : 'N/A'}
                    </div>
                </div>
                <div className="stat-box">
                    <div className="text-xs text-gray-500 font-semibold mb-2">Total Items</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.purchases?.length || 0}</div>
                </div>
                <div className="stat-box">
                    <div className="text-xs text-gray-500 font-semibold mb-2">Avg Saved/Day</div>
                    <div className="text-2xl font-bold text-gray-800">${(stats.money_saved / 7).toFixed(2)}</div>
                </div>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Spending by Category</h2>
                    <div style={{ height: '300px' }}>
                        <canvas ref={categoryChartRef}></canvas>
                    </div>
                </div>
                
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Purchase Attempts by Hour</h2>
                    <div style={{ height: '300px' }}>
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>
            </div>
            
            {/* Behavioral Insights */}
            <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Behavioral Insights</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-teal to-blue-400 text-white p-4 rounded-xl">
                        <i className="fas fa-clock text-2xl mb-2"></i>
                        <h3 className="font-bold mb-1">Peak Time</h3>
                        <p className="text-sm opacity-90">Most impulses occur in the evening hours</p>
                    </div>
                    <div className="bg-gradient-to-br from-coral to-red-400 text-white p-4 rounded-xl">
                        <i className="fas fa-fire text-2xl mb-2"></i>
                        <h3 className="font-bold mb-1">Trigger Alert</h3>
                        <p className="text-sm opacity-90">{mostExpensiveCategory ? mostExpensiveCategory[0] : 'Electronics'} items need extra attention</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-400 text-white p-4 rounded-xl">
                        <i className="fas fa-trophy text-2xl mb-2"></i>
                        <h3 className="font-bold mb-1">Great Progress!</h3>
                        <p className="text-sm opacity-90">You're building strong resistance habits</p>
                    </div>
                </div>
            </div>
        </main>
    );
};

// Reports Page Component
const ReportsPage = ({ stats }) => {
    const [selectedPeriod, setSelectedPeriod] = useState('7days');
    
    const recentPurchases = (stats.purchases || [])
        .sort((a, b) => (b.timestamp || b.attemptTimestamp) - (a.timestamp || a.attemptTimestamp))
        .slice(0, 20);
    
    return (
        <main className="flex-1 p-8 overflow-y-auto max-h-screen">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">Reports</h1>
                        <p className="text-gray-600">Detailed purchase attempt history</p>
                    </div>
                    <select 
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    >
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="stat-box bg-gradient-to-br from-green-50 to-green-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-green-700 font-semibold">Blocked</span>
                        <i className="fas fa-shield-alt text-green-500"></i>
                    </div>
                    <div className="text-3xl font-bold text-green-700">{stats.total_blocked}</div>
                </div>
                <div className="stat-box bg-gradient-to-br from-red-50 to-red-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-red-700 font-semibold">Allowed</span>
                        <i className="fas fa-shopping-cart text-red-500"></i>
                    </div>
                    <div className="text-3xl font-bold text-red-700">
                        {stats.purchases?.filter(p => p.outcome === 'allowed').length || 0}
                    </div>
                </div>
                <div className="stat-box bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-blue-700 font-semibold">Categories</span>
                        <i className="fas fa-tags text-blue-500"></i>
                    </div>
                    <div className="text-3xl font-bold text-blue-700">
                        {Object.keys(stats.categories || {}).length}
                    </div>
                </div>
                <div className="stat-box bg-gradient-to-br from-purple-50 to-purple-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-purple-700 font-semibold">Avg Price</span>
                        <i className="fas fa-dollar-sign text-purple-500"></i>
                    </div>
                    <div className="text-3xl font-bold text-purple-700">
                        ${stats.purchases?.length > 0 
                            ? (stats.purchases.reduce((sum, p) => sum + (p.price || 0), 0) / stats.purchases.length).toFixed(0)
                            : 0}
                    </div>
                </div>
            </div>
            
            {/* Purchase History Table */}
            <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Purchase History</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Date</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Item</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Category</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Price</th>
                                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">Status</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Domain</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">
                                        <i className="fas fa-inbox text-4xl mb-2"></i>
                                        <p>No purchase attempts recorded yet</p>
                                    </td>
                                </tr>
                            ) : (
                                recentPurchases.map((purchase, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {new Date(purchase.timestamp || purchase.attemptTimestamp).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-800 font-medium">
                                            {purchase.description || purchase.item_name || 'Unknown Item'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                                {purchase.category}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-800 font-bold text-right">
                                            ${(purchase.price || 0).toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {purchase.outcome === 'blocked' ? (
                                                <span className="inline-block px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-semibold">
                                                    <i className="fas fa-check-circle mr-1"></i>Blocked
                                                </span>
                                            ) : purchase.outcome === 'allowed' ? (
                                                <span className="inline-block px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 font-semibold">
                                                    <i className="fas fa-times-circle mr-1"></i>Allowed
                                                </span>
                                            ) : (
                                                <span className="inline-block px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-gray-500">
                                            {purchase.domain || 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};

// Comments Page Component (Motivational Messages)
const CommentsPage = ({ stats }) => {
    const messages = [
        {
            type: 'achievement',
            icon: 'fa-trophy',
            color: 'from-yellow-400 to-orange-400',
            title: 'Milestone Reached!',
            message: `You've successfully resisted ${stats.total_blocked} impulse purchases. Keep up the great work!`,
            time: '2 hours ago'
        },
        {
            type: 'insight',
            icon: 'fa-lightbulb',
            color: 'from-teal to-blue-400',
            title: 'Smart Move',
            message: `By avoiding ${Object.keys(stats.categories || {})[0] || 'Electronics'} purchases, you've saved the most money this week.`,
            time: '1 day ago'
        },
        {
            type: 'motivation',
            icon: 'fa-heart',
            color: 'from-pink-400 to-red-400',
            title: 'You\'re Doing Great!',
            message: 'Every impulse you resist is a step toward your financial goals. Stay strong!',
            time: '2 days ago'
        },
        {
            type: 'tip',
            icon: 'fa-brain',
            color: 'from-purple-400 to-pink-400',
            title: 'Pro Tip',
            message: 'Most of your impulses happen in the evening. Try setting a "no shopping" rule after 8 PM.',
            time: '3 days ago'
        }
    ];
    
    return (
        <main className="flex-1 p-8 overflow-y-auto max-h-screen">
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Motivation & Tips</h1>
                <p className="text-gray-600">Personalized insights and encouragement</p>
            </div>
            
            {/* Motivational Stats */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="card bg-gradient-to-br from-green-400 to-teal text-white">
                    <div className="flex items-center justify-between mb-3">
                        <i className="fas fa-piggy-bank text-3xl"></i>
                        <span className="text-4xl font-bold">${stats.money_saved.toFixed(0)}</span>
                    </div>
                    <h3 className="font-bold text-lg">Money Saved</h3>
                    <p className="text-sm opacity-90">That's real money back in your pocket!</p>
                </div>
                
                <div className="card bg-gradient-to-br from-blue-400 to-purple-400 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <i className="fas fa-calendar-check text-3xl"></i>
                        <span className="text-4xl font-bold">7</span>
                    </div>
                    <h3 className="font-bold text-lg">Day Streak</h3>
                    <p className="text-sm opacity-90">You're building consistent habits!</p>
                </div>
                
                <div className="card bg-gradient-to-br from-coral to-red-400 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <i className="fas fa-chart-line text-3xl"></i>
                        <span className="text-4xl font-bold">
                            {stats.total_blocked > 0 
                                ? Math.round((stats.total_blocked / (stats.total_blocked + (stats.purchases?.filter(p => p.outcome === 'allowed').length || 0))) * 100)
                                : 0}%
                        </span>
                    </div>
                    <h3 className="font-bold text-lg">Success Rate</h3>
                    <p className="text-sm opacity-90">Excellent impulse control!</p>
                </div>
            </div>
            
            {/* Messages Feed */}
            <div className="space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className="card hover:shadow-lg transition-shadow">
                        <div className="flex items-start space-x-4">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${msg.color} flex items-center justify-center flex-shrink-0`}>
                                <i className={`fas ${msg.icon} text-white text-lg`}></i>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-gray-800">{msg.title}</h3>
                                    <span className="text-xs text-gray-400">{msg.time}</span>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed">{msg.message}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Motivational Quote */}
            <div className="card bg-gradient-to-br from-teal to-blue-400 text-white mt-6">
                <div className="text-center py-6">
                    <i className="fas fa-quote-left text-3xl mb-4 opacity-50"></i>
                    <p className="text-xl font-bold mb-2">
                        "The secret of change is to focus all of your energy not on fighting the old, but on building the new."
                    </p>
                    <p className="text-sm opacity-75">- Socrates</p>
                </div>
            </div>
        </main>
    );
};

// Channels Page Component (Category Breakdown)
const ChannelsPage = ({ stats }) => {
    const categoryIcons = {
        'Electronics': { icon: 'fa-laptop', color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600' },
        'Fashion': { icon: 'fa-tshirt', color: 'bg-pink-500', gradient: 'from-pink-400 to-pink-600' },
        'Food & Dining': { icon: 'fa-utensils', color: 'bg-orange-500', gradient: 'from-orange-400 to-orange-600' },
        'Entertainment': { icon: 'fa-film', color: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600' },
        'Home & Garden': { icon: 'fa-home', color: 'bg-green-500', gradient: 'from-green-400 to-green-600' },
        'Beauty & Personal Care': { icon: 'fa-spa', color: 'bg-red-500', gradient: 'from-red-400 to-red-600' },
        'Fitness & Sports': { icon: 'fa-dumbbell', color: 'bg-teal-500', gradient: 'from-teal-400 to-teal-600' },
        'Toys & Hobbies': { icon: 'fa-gamepad', color: 'bg-yellow-500', gradient: 'from-yellow-400 to-yellow-600' },
        'Automotive': { icon: 'fa-car', color: 'bg-gray-600', gradient: 'from-gray-500 to-gray-700' },
        'Pet Supplies': { icon: 'fa-paw', color: 'bg-amber-500', gradient: 'from-amber-400 to-amber-600' },
        'Other': { icon: 'fa-shopping-bag', color: 'bg-gray-400', gradient: 'from-gray-300 to-gray-500' }
    };
    
    const categories = Object.entries(stats.categories || {})
        .map(([name, data]) => ({
            name,
            blocked: data.blocked || 0,
            allowed: data.allowed || 0,
            saved: data.saved || 0,
            total: data.total || 0,
            ...categoryIcons[name] || categoryIcons['Other']
        }))
        .sort((a, b) => b.saved - a.saved);
    
    return (
        <main className="flex-1 p-8 overflow-y-auto max-h-screen">
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Categories</h1>
                <p className="text-gray-600">Breakdown by purchase category</p>
            </div>
            
            {/* Category Grid */}
            <div className="grid grid-cols-3 gap-6">
                {categories.length === 0 ? (
                    <div className="col-span-3 text-center py-12">
                        <i className="fas fa-tags text-6xl text-gray-300 mb-4"></i>
                        <p className="text-gray-500 text-lg">No category data available yet</p>
                        <p className="text-gray-400 text-sm mt-2">Start using the extension to see your spending patterns</p>
                    </div>
                ) : (
                    categories.map((category) => (
                        <div key={category.name} className="card hover:shadow-xl transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center`}>
                                    <i className={`fas ${category.icon} text-white text-2xl`}></i>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-800">{category.total}</div>
                                    <div className="text-xs text-gray-500">attempts</div>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-800 mb-3">{category.name}</h3>
                            
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                        <i className="fas fa-shield-alt text-green-500 mr-2"></i>Blocked
                                    </span>
                                    <span className="font-bold text-gray-800">{category.blocked}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                        <i className="fas fa-shopping-cart text-red-500 mr-2"></i>Allowed
                                    </span>
                                    <span className="font-bold text-gray-800">{category.allowed}</span>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 font-semibold">SAVED</span>
                                    <span className="text-lg font-bold text-teal">${category.saved.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
};

// Main App Component
const App = () => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [stats, setStats] = useState(getDefaultStats());
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        loadStatsData().then(data => {
            setStats(data);
            setLoading(false);
        });
        
        // Listen for Chrome extension updates
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (namespace === 'local' && (changes.stats || changes.impulsePurchaseLogs)) {
                    loadStatsData().then(setStats);
                }
            });
        }
    }, []);
    
    const renderPage = () => {
        switch (currentPage) {
            case 'insights':
                return <InsightsPage stats={stats} />;
            case 'reports':
                return <ReportsPage stats={stats} />;
            case 'comments':
                return <CommentsPage stats={stats} />;
            case 'channels':
                return <ChannelsPage stats={stats} />;
            default:
                return <DashboardPage stats={stats} />;
        }
    };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-teal mb-4"></i>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-cream rounded-3xl shadow-2xl overflow-hidden flex">
                <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
                {renderPage()}
            </div>
        </div>
    );
};

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));
