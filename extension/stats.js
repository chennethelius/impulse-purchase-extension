// Stats page script
document.addEventListener('DOMContentLoaded', async () => {
    await loadStats();
    
    // Reset button handler
    document.getElementById('resetButton').addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all statistics?')) {
            await chrome.storage.local.set({
                stats: {
                    totalBattles: 0,
                    victories: 0,
                    defeats: 0,
                    moneySaved: 0
                }
            });
            await loadStats();
        }
    });
});

async function loadStats() {
    const result = await chrome.storage.local.get('stats');
    const stats = result.stats || {
        totalBattles: 0,
        victories: 0,
        defeats: 0,
        moneySaved: 0
    };
    
    // Update display
    document.getElementById('totalBattles').textContent = stats.totalBattles;
    document.getElementById('victories').textContent = stats.victories;
    document.getElementById('defeats').textContent = stats.defeats;
    document.getElementById('moneySaved').textContent = `$${stats.moneySaved.toFixed(2)}`;
    
    // Calculate win rate
    const winRate = stats.totalBattles > 0 
        ? ((stats.defeats / stats.totalBattles) * 100).toFixed(1)
        : 0;
    document.getElementById('winRate').textContent = `${winRate}%`;
}
