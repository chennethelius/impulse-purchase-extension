// IndexedDB wrapper for stats storage
class StatsDB {
    constructor() {
        this.dbName = 'ImpulseBlockerDB';
        this.storeName = 'stats';
        this.db = null;
    }

    // Initialize the database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    console.log('Created stats object store');
                }
            };
        });
    }

    // Get stats from database
    async getStats() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get('current');

            request.onsuccess = () => {
                if (request.result) {
                    console.log('Stats retrieved from IndexedDB:', request.result.data);
                    const stats = request.result.data;
                    
                    // Ensure categoryStats has all required categories
                    if (!stats.categoryStats) {
                        stats.categoryStats = {};
                    }
                    const requiredCategories = ['Fitness', 'Electronics', 'Clothing', 'Home', 'Health'];
                    requiredCategories.forEach(cat => {
                        if (stats.categoryStats[cat] === undefined) {
                            stats.categoryStats[cat] = 0;
                        }
                    });
                    
                    resolve(stats);
                } else {
                    // Return default stats if none exist
                    const defaultStats = {
                        totalBattles: 0,
                        victories: 0,
                        defeats: 0,
                        moneySaved: 0,
                        savingsHistory: [],
                        purchaseHistory: [],
                        categoryStats: {
                            Fitness: 0,
                            Electronics: 0,
                            Clothing: 0,
                            Home: 0,
                            Health: 0
                        }
                    };
                    console.log('No stats found, returning defaults');
                    resolve(defaultStats);
                }
            };

            request.onerror = () => {
                console.error('Failed to get stats:', request.error);
                reject(request.error);
            };
        });
    }

    // Save stats to database
    async saveStats(stats) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            
            const data = {
                id: 'current',
                data: stats,
                timestamp: Date.now()
            };
            
            const request = objectStore.put(data);

            request.onsuccess = () => {
                console.log('Stats saved to IndexedDB:', stats);
                resolve(stats);
            };

            request.onerror = () => {
                console.error('Failed to save stats:', request.error);
                reject(request.error);
            };
        });
    }

    // Update stats (get, modify, save)
    async updateStats(updateFn) {
        const currentStats = await this.getStats();
        const updatedStats = updateFn(currentStats);
        await this.saveStats(updatedStats);
        return updatedStats;
    }

    // Clear all stats
    async clearStats() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete('current');

            request.onsuccess = () => {
                console.log('Stats cleared from IndexedDB');
                resolve();
            };

            request.onerror = () => {
                console.error('Failed to clear stats:', request.error);
                reject(request.error);
            };
        });
    }
}

// Create singleton instance
const statsDB = new StatsDB();
