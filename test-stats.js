// Test script to add sample stats data
// Open the extension background page console and paste this

const testStats = {
  totalBattles: 5,
  victories: 3,
  defeats: 2,
  moneySaved: 250.50,
  savingsHistory: [50, 100, 150, 200, 250.50],
  purchaseHistory: [
    {
      timestamp: new Date().toISOString(),
      product: "Nike Running Shoes",
      amount: 89.99,
      category: "Fitness",
      saved: true
    },
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      product: "iPhone 15 Pro",
      amount: 999.00,
      category: "Electronics",
      saved: false
    },
    {
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      product: "Leather Jacket",
      amount: 150.00,
      category: "Clothing",
      saved: true
    },
    {
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      product: "Gaming Mouse",
      amount: 79.99,
      category: "Electronics",
      saved: false
    },
    {
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      product: "Yoga Mat",
      amount: 30.51,
      category: "Fitness",
      saved: true
    }
  ],
  categoryStats: {
    Fitness: 2,
    Electronics: 0,
    Clothing: 1,
    Home: 0,
    Health: 0
  }
};

chrome.storage.local.set({ stats: testStats }, () => {
  console.log('Test stats saved!');
  chrome.storage.local.get('stats', (result) => {
    console.log('Verification - Stats from storage:', result.stats);
  });
});
