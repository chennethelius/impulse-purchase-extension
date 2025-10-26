// Popup script for extension icon
document.addEventListener('DOMContentLoaded', async () => {
    const gameModeToggle = document.getElementById('gameModeToggle');
    const modeIndicator = document.getElementById('modeIndicator');
    const viewStatsBtn = document.getElementById('viewStatsBtn');
    const totalSaved = document.getElementById('totalSaved');
    const blockedCount = document.getElementById('blockedCount');
    
    // Load current settings
    chrome.storage.local.get(['gameModeEnabled'], async (result) => {
        // Default to game mode ON if not set
        const isGameMode = result.gameModeEnabled !== undefined ? result.gameModeEnabled : true;
        gameModeToggle.checked = isGameMode;
        updateModeIndicator(isGameMode);
        
        // Load stats from IndexedDB if stats-db.js is available
        try {
            // Simple stats loading without IndexedDB dependency for popup
            chrome.storage.local.get(['stats'], (statsResult) => {
                if (statsResult.stats) {
                    const stats = statsResult.stats;
                    if (stats.moneySaved) {
                        totalSaved.textContent = `$${Math.round(stats.moneySaved)}`;
                    }
                    if (stats.defeats !== undefined) {
                        blockedCount.textContent = stats.defeats || 0;
                    }
                }
            });
        } catch (error) {
            console.log('Stats not available yet:', error);
        }
    });
    
    // Listen for toggle changes
    gameModeToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        chrome.storage.local.set({ gameModeEnabled: isEnabled }, () => {
            updateModeIndicator(isEnabled);
            console.log('Game mode:', isEnabled ? 'ENABLED' : 'DISABLED');
        });
    });
    
    // View stats button
    viewStatsBtn.addEventListener('click', () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('stats/stats.html')
        });
    });
    
    function updateModeIndicator(isGameMode) {
        if (isGameMode) {
            modeIndicator.textContent = '🎮 Game Mode Active';
            modeIndicator.className = 'mode-indicator game-mode';
        } else {
            modeIndicator.textContent = '💬 Classic Mode Active';
            modeIndicator.className = 'mode-indicator classic-mode';
        }
    }
});
