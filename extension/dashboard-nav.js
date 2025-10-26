// Simple navigation script for Impulse Guard Dashboard
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupBackButton();
});

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
    // Change "Log out" button to "Back to Stats"
    const logoutButton = document.querySelector('button.flex.items-center.space-x-2.text-gray-600');
    if (logoutButton) {
        logoutButton.innerHTML = '<i class="fas fa-arrow-left"></i><span>Back to Stats</span>';
        logoutButton.addEventListener('click', () => {
            window.close();
        });
    }
}
