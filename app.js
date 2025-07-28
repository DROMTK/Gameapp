// PlayMate App - Main JavaScript File
// Handles navigation, localStorage management, and core app functionality

// App State Management
const AppState = {
    currentPage: 'home',
    settings: {
        soundEnabled: true,
        theme: 'default',
        difficulty: 'normal',
        autoSave: true
    },
    analytics: {
        gamesPlayed: 0,
        totalPlayTime: 0,
        lastPlayed: null
    }
};

// Enhanced Analytics System
const Analytics = {
    trackEvent(eventName, data = {}) {
        const event = {
            event: eventName,
            timestamp: new Date().toISOString(),
            data: data
        };
        
        // Store analytics locally
        const analytics = this.getAnalytics();
        analytics.events = analytics.events || [];
        analytics.events.push(event);
        
        // Keep only last 100 events
        if (analytics.events.length > 100) {
            analytics.events = analytics.events.slice(-100);
        }
        
        localStorage.setItem('playmate_analytics', JSON.stringify(analytics));
        
        console.log('Analytics:', event);
    },
    
    getAnalytics() {
        const analytics = localStorage.getItem('playmate_analytics');
        return analytics ? JSON.parse(analytics) : { events: [] };
    },
    
    trackGameStart(gameId) {
        this.trackEvent('game_start', { gameId });
        AppState.analytics.gamesPlayed++;
        AppState.analytics.lastPlayed = new Date().toISOString();
        this.saveAnalytics();
    },
    
    trackGameComplete(gameId, score, level) {
        this.trackEvent('game_complete', { gameId, score, level });
    },
    
    trackPurchase(gameId, price) {
        this.trackEvent('purchase', { gameId, price });
    },
    
    saveAnalytics() {
        localStorage.setItem('playmate_analytics_state', JSON.stringify(AppState.analytics));
    }
};

// Navigation Functions
function navigateToHome() {
    Analytics.trackEvent('navigation', { from: AppState.currentPage, to: 'home' });
    AppState.currentPage = 'home';
    window.location.href = 'index.html';
}

function navigateToGames() {
    Analytics.trackEvent('navigation', { from: AppState.currentPage, to: 'games' });
    AppState.currentPage = 'games';
    window.location.href = 'games.html';
}

function navigateToGame(gameId) {
    Analytics.trackGameStart(gameId);
    AppState.currentPage = 'game';
    window.location.href = `games/${gameId}.html`;
}

// LocalStorage Management
const StorageManager = {
    // Game Progress
    getGameProgress(gameId) {
        try {
            const progress = localStorage.getItem(`${gameId}_progress`);
            return progress ? JSON.parse(progress) : { level: 1, score: 0, highScore: 0 };
        } catch (error) {
            console.error('Error loading game progress:', error);
            return { level: 1, score: 0, highScore: 0 };
        }
    },

    setGameProgress(gameId, progress) {
        try {
            localStorage.setItem(`${gameId}_progress`, JSON.stringify(progress));
        } catch (error) {
            console.error('Error saving game progress:', error);
            showNotification('Failed to save progress', 'error');
        }
    },

    // Game Unlock Status
    isGameUnlocked(gameId) {
        return localStorage.getItem(`${gameId}_unlocked`) === 'true';
    },

    unlockGame(gameId) {
        localStorage.setItem(`${gameId}_unlocked`, 'true');
    },

    // Settings
    getSettings() {
        try {
            const settings = localStorage.getItem('playmate_settings');
            return settings ? JSON.parse(settings) : AppState.settings;
        } catch (error) {
            console.error('Error loading settings:', error);
            return AppState.settings;
        }
    },

    setSettings(settings) {
        try {
            localStorage.setItem('playmate_settings', JSON.stringify(settings));
            AppState.settings = settings;
        } catch (error) {
            console.error('Error saving settings:', error);
            showNotification('Failed to save settings', 'error');
        }
    },

    // Purchase System
    getPurchases() {
        try {
            const purchases = localStorage.getItem('playmate_purchases');
            return purchases ? JSON.parse(purchases) : [];
        } catch (error) {
            console.error('Error loading purchases:', error);
            return [];
        }
    },

    addPurchase(gameId, price) {
        try {
            const purchases = this.getPurchases();
            purchases.push({ gameId, price, date: new Date().toISOString() });
            localStorage.setItem('playmate_purchases', JSON.stringify(purchases));
            Analytics.trackPurchase(gameId, price);
        } catch (error) {
            console.error('Error saving purchase:', error);
        }
    },

    // Reset Functions
    resetGameProgress(gameId) {
        localStorage.removeItem(`${gameId}_progress`);
    },

    resetAllProgress() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.includes('_progress')) {
                localStorage.removeItem(key);
            }
        });
    },

    resetAllPurchases() {
        localStorage.removeItem('playmate_purchases');
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.includes('_unlocked')) {
                localStorage.removeItem(key);
            }
        });
    },

    resetAllData() {
        localStorage.clear();
    },

    // Export/Import functionality
    exportData() {
        try {
            const data = {
                settings: this.getSettings(),
                purchases: this.getPurchases(),
                analytics: Analytics.getAnalytics(),
                games: {}
            };
            
            // Export all game progress
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.includes('_progress') || key.includes('_unlocked')) {
                    data.games[key] = localStorage.getItem(key);
                }
            });
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `playmate-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showNotification('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            showNotification('Failed to export data', 'error');
        }
    },

    importData(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Import settings
                if (data.settings) {
                    StorageManager.setSettings(data.settings);
                }
                
                // Import purchases
                if (data.purchases) {
                    localStorage.setItem('playmate_purchases', JSON.stringify(data.purchases));
                }
                
                // Import game data
                if (data.games) {
                    Object.keys(data.games).forEach(key => {
                        localStorage.setItem(key, data.games[key]);
                    });
                }
                
                showNotification('Data imported successfully!', 'success');
                setTimeout(() => location.reload(), 1000);
            } catch (error) {
                console.error('Error importing data:', error);
                showNotification('Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
    }
};

// Purchase System
function unlockGame(gameId, price) {
    if (!StorageManager.isGameUnlocked(gameId)) {
        // Simulate purchase (no real payment system)
        StorageManager.unlockGame(gameId);
        StorageManager.addPurchase(gameId, price);
        
        // Show success message
        showNotification(`Game unlocked successfully!`, 'success');
        
        // Update UI
        updateGameCard(gameId);
        
        return true;
    }
    return false;
}

// Enhanced Notification System
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#8B5CF6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, duration);
}

// Enhanced Settings Functions
function openSettings() {
    const settings = StorageManager.getSettings();
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Settings</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="soundToggle" ${settings.soundEnabled ? 'checked' : ''}>
                        Enable Sound Effects
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="autoSaveToggle" ${settings.autoSave ? 'checked' : ''}>
                        Auto Save Progress
                    </label>
                </div>
                <div class="setting-item">
                    <label>Difficulty Level:</label>
                    <select id="difficultySelect">
                        <option value="easy" ${settings.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                        <option value="normal" ${settings.difficulty === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="hard" ${settings.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
                    </select>
                </div>
                <div class="setting-item">
                    <button class="btn-secondary" onclick="exportData()">Export Data</button>
                    <input type="file" id="importFile" accept=".json" style="display: none;" onchange="importData(this.files[0])">
                    <button class="btn-secondary" onclick="document.getElementById('importFile').click()">Import Data</button>
                </div>
                <div class="setting-item">
                    <button class="btn-secondary" onclick="resetAllProgress()">Reset All Progress</button>
                </div>
                <div class="setting-item">
                    <button class="btn-secondary" onclick="resetAllPurchases()">Reset All Purchases</button>
                </div>
                <div class="setting-item">
                    <button class="btn-secondary" onclick="resetAllData()">Reset All Data</button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" onclick="saveSettings()">Save Settings</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function saveSettings() {
    const soundEnabled = document.getElementById('soundToggle').checked;
    const autoSave = document.getElementById('autoSaveToggle').checked;
    const difficulty = document.getElementById('difficultySelect').value;
    const settings = { ...AppState.settings, soundEnabled, autoSave, difficulty };
    
    StorageManager.setSettings(settings);
    showNotification('Settings saved successfully!', 'success');
    
    // Close modal
    document.querySelector('.modal').remove();
}

function resetAllProgress() {
    if (confirm('Are you sure you want to reset all game progress? This cannot be undone.')) {
        StorageManager.resetAllProgress();
        showNotification('All progress has been reset!', 'success');
    }
}

function resetAllPurchases() {
    if (confirm('Are you sure you want to reset all purchases? This will lock all purchased games.')) {
        StorageManager.resetAllPurchases();
        showNotification('All purchases have been reset!', 'success');
        location.reload(); // Refresh to update UI
    }
}

function resetAllData() {
    if (confirm('Are you sure you want to reset ALL data? This will delete everything and cannot be undone.')) {
        StorageManager.resetAllData();
        showNotification('All data has been reset!', 'success');
        location.reload(); // Refresh to update UI
    }
}

// Data export/import functions
function exportData() {
    StorageManager.exportData();
}

function importData(file) {
    StorageManager.importData(file);
}

// Utility Functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatScore(score) {
    return score.toLocaleString();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Enhanced Sound System
const SoundManager = {
    audioContext: null,
    
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    
    playSound(soundName) {
        const settings = StorageManager.getSettings();
        if (!settings.soundEnabled) return;
        
        this.init();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Different sounds for different events
        switch(soundName) {
            case 'click':
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                break;
            case 'success':
                oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
                break;
            case 'error':
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                break;
            case 'gameOver':
                oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                break;
            default:
                oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        }
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load settings
    AppState.settings = StorageManager.getSettings();
    
    // Load analytics
    const analyticsState = localStorage.getItem('playmate_analytics_state');
    if (analyticsState) {
        AppState.analytics = JSON.parse(analyticsState);
    }
    
    // Add click sound to buttons
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            SoundManager.playSound('click');
        }
    });
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .setting-item {
            margin-bottom: 1rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .setting-item label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
        }
        
        .setting-item input[type="checkbox"] {
            width: 18px;
            height: 18px;
        }
        
        .setting-item select {
            margin-left: 0.5rem;
            padding: 0.25rem;
            border-radius: 4px;
            border: 1px solid #ddd;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.2s ease;
        }
        
        .notification-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    `;
    document.head.appendChild(style);
    
    // Track page view
    Analytics.trackEvent('page_view', { page: AppState.currentPage });
});

// Export functions for use in other files
window.AppState = AppState;
window.StorageManager = StorageManager;
window.SoundManager = SoundManager;
window.Analytics = Analytics;
window.navigateToHome = navigateToHome;
window.navigateToGames = navigateToGames;
window.navigateToGame = navigateToGame;
window.unlockGame = unlockGame;
window.showNotification = showNotification;
window.openSettings = openSettings;
window.saveSettings = saveSettings;
window.resetAllProgress = resetAllProgress;
window.resetAllPurchases = resetAllPurchases;
window.resetAllData = resetAllData;
window.exportData = exportData;
window.importData = importData; 