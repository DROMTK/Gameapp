// Games Page JavaScript
// Handles the games grid, purchase modal, and game card interactions

// Game Definitions
const GAMES = [
    {
        id: 'word-search',
        title: 'Word Search',
        description: 'Find hidden words in a grid of letters. Infinite levels with increasing difficulty.',
        icon: '🔍',
        price: 0,
        unlocked: true,
        category: 'puzzle'
    },
    {
        id: 'memory-match',
        title: 'Memory Match',
        description: 'Match pairs of cards to clear the board. Test your memory skills!',
        icon: '🧠',
        price: 0,
        unlocked: true,
        category: 'puzzle'
    },
    {
        id: '2048',
        title: '2048',
        description: 'Slide tiles to combine them and reach the 2048 tile. Classic number puzzle game.',
        icon: '🔢',
        price: 0,
        unlocked: true,
        category: 'puzzle'
    },
    {
        id: 'color-match',
        title: 'Color Match',
        description: 'Match colored blocks to complete patterns. Increasing difficulty with each level.',
        icon: '🎨',
        price: 0,
        unlocked: true,
        category: 'puzzle'
    },
    {
        id: 'math-quiz',
        title: 'Quick Math Quiz',
        description: 'Solve math problems quickly. Three difficulty levels with timer and combo system.',
        icon: '🧮',
        price: 0,
        unlocked: true,
        category: 'educational'
    },
    {
        id: 'platform-jump',
        title: 'Platform Jump',
        description: 'Jump from platform to platform without falling. Endless runner with increasing speed.',
        icon: '🦘',
        price: 0,
        unlocked: true,
        category: 'action'
    },
    {
        id: 'typing-test',
        title: 'Typing Speed Test',
        description: 'Test your typing speed and accuracy. Random paragraphs with WPM tracking.',
        icon: '⌨️',
        price: 0,
        unlocked: true,
        category: 'educational'
    },
    {
        id: 'snake',
        title: 'Snake Game',
        description: 'Classic Snake game with increasing speed. Eat food to grow longer!',
        icon: '🐍',
        price: 0.05,
        unlocked: false,
        category: 'action'
    },
    {
        id: 'maze-runner',
        title: 'Maze Runner',
        description: 'Navigate through randomly generated mazes. Find the exit before time runs out!',
        icon: '🏃',
        price: 0.10,
        unlocked: false,
        category: 'puzzle'
    },
    {
        id: 'brick-breaker',
        title: 'Brick Breaker',
        description: 'Break bricks with a bouncing ball and paddle. Classic arcade action!',
        icon: '🏓',
        price: 0.25,
        unlocked: false,
        category: 'action'
    }
];

// Current purchase modal state
let currentPurchase = null;

// Initialize games page
document.addEventListener('DOMContentLoaded', function() {
    loadGamesGrid();
    loadStatistics();
});

// Load and display games grid
function loadGamesGrid() {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid) return;

    gamesGrid.innerHTML = '';

    GAMES.forEach(game => {
        const gameCard = createGameCard(game);
        gamesGrid.appendChild(gameCard);
    });
}

// Create individual game card
function createGameCard(game) {
    const isUnlocked = StorageManager.isGameUnlocked(game.id) || game.unlocked;
    const progress = StorageManager.getGameProgress(game.id);
    
    const card = document.createElement('div');
    card.className = `game-card ${!isUnlocked ? 'locked' : ''}`;
    card.dataset.gameId = game.id;
    
    const progressPercent = Math.min((progress.level / 10) * 100, 100);
    
    card.innerHTML = `
        <div class="game-header">
            <div class="game-icon">${game.icon}</div>
            <div class="game-info">
                <h3>${game.title}</h3>
                <p>${game.description}</p>
                <span class="game-category">${game.category}</span>
            </div>
        </div>
        <div class="game-status">
            ${isUnlocked ? `
                <div class="game-progress">
                    <span>Level ${progress.level}</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
            ` : `
                <div class="lock-icon">🔒</div>
                <div class="unlock-price">Unlock for $${game.price.toFixed(2)}</div>
            `}
        </div>
    `;
    
    card.addEventListener('click', () => handleGameClick(game));
    
    return card;
}

// Handle game card click
function handleGameClick(game) {
    const isUnlocked = StorageManager.isGameUnlocked(game.id) || game.unlocked;
    
    if (isUnlocked) {
        // Navigate to game
        navigateToGame(game.id);
    } else {
        // Show purchase modal
        showPurchaseModal(game);
    }
}

// Show purchase modal
function showPurchaseModal(game) {
    currentPurchase = game;
    
    const modal = document.getElementById('purchaseModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalGameIcon = document.getElementById('modalGameIcon');
    const modalDescription = document.getElementById('modalDescription');
    const modalPrice = document.getElementById('modalPrice');
    
    modalTitle.textContent = `Unlock ${game.title}`;
    modalGameIcon.innerHTML = game.icon;
    modalDescription.textContent = game.description;
    modalPrice.textContent = game.price.toFixed(2);
    
    modal.style.display = 'block';
}

// Close purchase modal
function closeModal() {
    const modal = document.getElementById('purchaseModal');
    modal.style.display = 'none';
    currentPurchase = null;
}

// Confirm purchase
function confirmPurchase() {
    if (!currentPurchase) return;
    
    const success = unlockGame(currentPurchase.id, currentPurchase.price);
    
    if (success) {
        // Update the specific game card
        updateGameCard(currentPurchase.id);
        closeModal();
    }
}

// Update specific game card
function updateGameCard(gameId) {
    const game = GAMES.find(g => g.id === gameId);
    if (!game) return;
    
    const card = document.querySelector(`[data-game-id="${gameId}"]`);
    if (!card) return;
    
    // Remove locked class and update content
    card.classList.remove('locked');
    
    const progress = StorageManager.getGameProgress(gameId);
    const progressPercent = Math.min((progress.level / 10) * 100, 100);
    
    card.innerHTML = `
        <div class="game-header">
            <div class="game-icon">${game.icon}</div>
            <div class="game-info">
                <h3>${game.title}</h3>
                <p>${game.description}</p>
                <span class="game-category">${game.category}</span>
            </div>
        </div>
        <div class="game-status">
            <div class="game-progress">
                <span>Level ${progress.level}</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            </div>
        </div>
    `;
    
    // Re-add click handler
    card.addEventListener('click', () => handleGameClick(game));
}

// Load and display statistics
function loadStatistics() {
    const analytics = Analytics.getAnalytics();
    const analyticsState = localStorage.getItem('playmate_analytics_state');
    const userStats = analyticsState ? JSON.parse(analyticsState) : { gamesPlayed: 0, totalPlayTime: 0 };
    
    // Calculate statistics
    const totalGames = GAMES.length;
    const unlockedGames = GAMES.filter(game => StorageManager.isGameUnlocked(game.id) || game.unlocked).length;
    const totalPurchases = StorageManager.getPurchases().length;
    const totalSpent = StorageManager.getPurchases().reduce((sum, purchase) => sum + purchase.price, 0);
    
    // Get game-specific stats
    const gameStats = {};
    GAMES.forEach(game => {
        const progress = StorageManager.getGameProgress(game.id);
        gameStats[game.id] = {
            highScore: progress.highScore || 0,
            level: progress.level || 1,
            score: progress.score || 0
        };
    });
    
    // Create statistics section
    const statsSection = document.createElement('div');
    statsSection.className = 'stats-section';
    statsSection.innerHTML = `
        <h3 class="stats-title">Your Statistics</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">🎮</div>
                <div class="stat-content">
                    <div class="stat-value">${userStats.gamesPlayed || 0}</div>
                    <div class="stat-label">Games Played</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🔓</div>
                <div class="stat-content">
                    <div class="stat-value">${unlockedGames}/${totalGames}</div>
                    <div class="stat-label">Games Unlocked</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                    <div class="stat-value">$${totalSpent.toFixed(2)}</div>
                    <div class="stat-label">Total Spent</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-content">
                    <div class="stat-value">${Math.max(...Object.values(gameStats).map(g => g.highScore))}</div>
                    <div class="stat-label">Best Score</div>
                </div>
            </div>
        </div>
        <div class="recent-activity">
            <h4>Recent Activity</h4>
            <div class="activity-list">
                ${getRecentActivity(analytics.events || [])}
            </div>
        </div>
    `;
    
    // Insert stats section before games grid
    const gamesSection = document.querySelector('.games-section');
    if (gamesSection) {
        gamesSection.insertBefore(statsSection, gamesSection.firstChild);
    }
}

// Get recent activity from analytics
function getRecentActivity(events) {
    const recentEvents = events.slice(-5).reverse();
    
    if (recentEvents.length === 0) {
        return '<p class="no-activity">No recent activity</p>';
    }
    
    return recentEvents.map(event => {
        const date = new Date(event.timestamp);
        const timeAgo = getTimeAgo(date);
        
        let activityText = '';
        switch (event.event) {
            case 'game_start':
                activityText = `Started ${event.data.gameId.replace('-', ' ')}`;
                break;
            case 'game_complete':
                activityText = `Completed ${event.data.gameId.replace('-', ' ')} (Score: ${event.data.score})`;
                break;
            case 'purchase':
                activityText = `Purchased ${event.data.gameId.replace('-', ' ')}`;
                break;
            default:
                activityText = event.event.replace('_', ' ');
        }
        
        return `
            <div class="activity-item">
                <span class="activity-text">${activityText}</span>
                <span class="activity-time">${timeAgo}</span>
            </div>
        `;
    }).join('');
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('purchaseModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Export functions for use in other files
window.closeModal = closeModal;
window.confirmPurchase = confirmPurchase;
window.updateGameCard = updateGameCard; 