// Game State
let gameState = {
    resources: 0,
    resourcesPerSecond: 0,
    totalCollected: 0,
    playTime: 0,
    totalClicks: 0,
    upgrades: {
        autoDrone: {
            level: 0,
            baseCost: 10,
            multiplier: 1
        }
    },
    achievements: {
        firstClick: { unlocked: false },
        collector100: { unlocked: false },
        collector1000: { unlocked: false },
        timePlayer: { unlocked: false },
        expertMiner: { unlocked: false }
    }
};

// DOM Elements
const elements = {
    resourceCount: document.getElementById('resource-count'),
    resourcePerSec: document.getElementById('resource-per-second'),
    clickButton: document.getElementById('click-button'),
    totalCollected: document.getElementById('total-collected'),
    playTime: document.getElementById('play-time'),
    saveStatus: document.getElementById('save-status'),
    upgradeLevel: document.querySelector('.upgrade .level'),
    upgradeCost: document.querySelector('.upgrade .cost'),
    achievementsContainer: document.getElementById('achievements-container')
};

// Achievement Definitions
const achievementDefs = {
    firstClick: {
        name: "First Click!",
        description: "Mine your first energy",
        icon: "⛏️",
        check: () => gameState.totalClicks >= 1
    },
    collector100: {
        name: "Apprentice Miner",
        description: "Collect 100 energy",
        icon: "💰",
        check: () => gameState.totalCollected >= 100
    },
    collector1000: {
        name: "Master Miner",
        description: "Collect 1,000 energy",
        icon: "💎",
        check: () => gameState.totalCollected >= 1000
    },
    timePlayer: {
        name: "Dedicated Miner",
        description: "Play for 5 minutes",
        icon: "⏳",
        check: () => gameState.playTime >= 300
    },
    expertMiner: {
        name: "Expert Miner",
        description: "Reach level 5 auto miner",
        icon: "🏅",
        check: () => gameState.upgrades.autoDrone.level >= 5
    }
};

// Initialize Game
function initGame() {
    loadGame();
    renderAchievements();
    startGameLoop();
    setupEventListeners();
}

// Load Game Data
async function loadGame() {
    try {
        const response = await fetch('/api/load');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // Merge loaded data with defaults
        gameState = {
            ...gameState,
            ...data,
            upgrades: {
                autoDrone: {
                    ...gameState.upgrades.autoDrone,
                    ...(data.upgrades?.autoDrone || {})
                }
            },
            achievements: {
                ...gameState.achievements,
                ...(data.achievements || {})
            }
        };
        
        updateUI();
        checkAllAchievements();
        showNotification('Game loaded', 'success');
    } catch (error) {
        console.error('Load failed:', error);
        showNotification('Load failed', 'error');
    }
}

// Save Game Data
async function saveGame() {
    try {
        showNotification('Saving...', 'saving');
        
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameState)
        });
        
        if (!response.ok) throw new Error('Save failed');
        
        showNotification('Progress saved', 'success');
    } catch (error) {
        console.error('Save error:', error);
        showNotification('Save failed', 'error');
    }
}

// Achievement System
function checkAllAchievements() {
    Object.keys(achievementDefs).forEach(id => {
        if (!gameState.achievements[id].unlocked && achievementDefs[id].check()) {
            unlockAchievement(id);
        }
    });
}

function unlockAchievement(id) {
    gameState.achievements[id].unlocked = true;
    renderAchievements();
    showNotification(`Achievement: ${achievementDefs[id].name}`, 'success');
    saveGame();
}

function renderAchievements() {
    elements.achievementsContainer.innerHTML = '';
    
    Object.entries(achievementDefs).forEach(([id, def]) => {
        const achievement = document.createElement('div');
        achievement.className = `achievement ${gameState.achievements[id].unlocked ? 'unlocked' : ''}`;
        
        achievement.innerHTML = `
            <div class="achievement-icon">${def.icon}</div>
            <div class="achievement-name">${def.name}</div>
            <div class="achievement-desc">${def.description}</div>
            ${!gameState.achievements[id].unlocked ? `
            <div class="achievement-progress">
                <div class="achievement-progress-bar" style="width: ${
                    def.check() ? '100%' : '0%'
                }"></div>
            </div>` : ''}
        `;
        
        elements.achievementsContainer.appendChild(achievement);
    });
}

// Game Logic
function calculateUpgradeCost() {
    return Math.floor(
        gameState.upgrades.autoDrone.baseCost * 
        Math.pow(1.5, gameState.upgrades.autoDrone.level)
    );
}

function updateUI() {
    elements.resourceCount.textContent = Math.floor(gameState.resources);
    elements.resourcePerSec.textContent = `(${Math.floor(gameState.resourcesPerSecond)}/sec)`;
    elements.totalCollected.textContent = Math.floor(gameState.totalCollected);
    elements.upgradeLevel.textContent = gameState.upgrades.autoDrone.level;
    elements.upgradeCost.textContent = calculateUpgradeCost();
}

function updatePlayTime() {
    const hours = Math.floor(gameState.playTime / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((gameState.playTime % 3600) / 60).toString().padStart(2, '0');
    const seconds = (gameState.playTime % 60).toString().padStart(2, '0');
    elements.playTime.textContent = `${hours}:${minutes}:${seconds}`;
}

// Event Handlers
function setupEventListeners() {
    elements.clickButton.addEventListener('click', () => {
        gameState.resources += 1;
        gameState.totalCollected += 1;
        gameState.totalClicks += 1;
        updateUI();
        checkAllAchievements();
        saveGame();
    });

    document.querySelector('.buy-button').addEventListener('click', () => {
        const cost = calculateUpgradeCost();
        if (gameState.resources >= cost) {
            gameState.resources -= cost;
            gameState.upgrades.autoDrone.level += 1;
            gameState.resourcesPerSecond = 
                gameState.upgrades.autoDrone.level * 
                gameState.upgrades.autoDrone.multiplier;
            updateUI();
            checkAllAchievements();
            saveGame();
        }
    });
}

// Game Loop
function startGameLoop() {
    // Resource generation loop
    setInterval(() => {
        gameState.resources += gameState.resourcesPerSecond / 10;
        gameState.totalCollected += gameState.resourcesPerSecond / 10;
        updateUI();
        checkAllAchievements();
    }, 100);

    // Time counter
    setInterval(() => {
        gameState.playTime += 1;
        updatePlayTime();
        checkAllAchievements();
    }, 1000);

    // Auto-save
    setInterval(saveGame, 30000);
}

// UI Helpers
function showNotification(message, type) {
    elements.saveStatus.textContent = message;
    elements.saveStatus.className = `save-status visible ${type}`;
    setTimeout(() => {
        elements.saveStatus.classList.remove('visible');
    }, 2000);
}

// Initialize
window.addEventListener('load', initGame);
window.addEventListener('beforeunload', saveGame);