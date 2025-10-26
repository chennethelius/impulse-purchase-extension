// Settings page script
document.addEventListener('DOMContentLoaded', () => {
    const enabledToggle = document.getElementById('enabledToggle');
    const priceThreshold = document.getElementById('priceThreshold');
    const saveButton = document.getElementById('saveButton');
    const savedMessage = document.getElementById('savedMessage');
    const blockedCount = document.getElementById('blockedCount');
    const allowedCount = document.getElementById('allowedCount');
    const winRate = document.getElementById('winRate');
    
    // Load current settings
    chrome.storage.local.get([
        'enabled',
        'priceThreshold',
        'totalPurchasesBlocked',
        'totalPurchasesAllowed'
    ], (result) => {
        enabledToggle.checked = result.enabled !== false;
        priceThreshold.value = result.priceThreshold || 50;
        
        // Update stats
        const blocked = result.totalPurchasesBlocked || 0;
        const allowed = result.totalPurchasesAllowed || 0;
        const total = blocked + allowed;
        const winRateValue = total > 0 ? Math.round((allowed / total) * 100) : 0;
        
        blockedCount.textContent = blocked;
        allowedCount.textContent = allowed;
        winRate.textContent = `${winRateValue}%`;
    });
    
    // Save settings
    saveButton.addEventListener('click', () => {
        const settings = {
            enabled: enabledToggle.checked,
            priceThreshold: parseInt(priceThreshold.value) || 50
        };
        
        chrome.storage.local.set(settings, () => {
            // Show saved message
            savedMessage.style.display = 'block';
            setTimeout(() => {
                savedMessage.style.display = 'none';
            }, 2000);
        });
    });
});
